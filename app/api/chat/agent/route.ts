import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import type { AgenticBotSchema, ConversationState, AgentResponse, UploadedDocument } from '@/types/agentic';
import { parseDocumentFromUrl } from '@/lib/document-parser';
import { buildSystemPrompt } from '@/lib/agent/system-prompt';
import { enforceGuardrails } from '@/lib/agent/guardrails';
import { validateConversationPhase } from '@/lib/agent/smart-validation';
import { fixBotIdentity } from '@/lib/agent/identity';
import { updateConversationState } from '@/lib/agent/state';
import { summarizeConversation, estimateTokenCount } from '@/lib/agent/conversation-summary';
import {
  createSSEStream,
  processOpenAIStream,
  getSSEHeaders,
  isStreamingRequest
} from '@/lib/agent/streaming';
import type { StreamChunk } from '@/lib/agent/streaming';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST(request: Request) {
  try {
    const {
      messages,
      currentState,
      botSchema,
      businessName,
      botUserId
    }: {
      messages: Array<{ role: string; content: string }>;
      currentState: ConversationState;
      botSchema: AgenticBotSchema;
      businessName: string;
      botUserId?: string;
    } = await request.json();

    console.log('🧠 Agent Brain invoked');
    console.log('📊 Current State:', currentState);
    console.log('💬 Message count:', messages.length);

    // Summarize long conversations to reduce token usage
    let processedMessages = messages;
    const tokenEstimate = estimateTokenCount(messages);
    console.log('💭 Estimated tokens:', tokenEstimate);

    if (messages.length >= 20) {
      const summarizationResult = await summarizeConversation(
        messages,
        currentState.gathered_information
      );

      if (summarizationResult.shouldSummarize && summarizationResult.summarizedMessages) {
        processedMessages = summarizationResult.summarizedMessages;
        console.log(`✂️ Conversation summarized: ${messages.length} → ${processedMessages.length} messages`);
      }
    }

    // Fetch business profile for enhanced context
    let businessProfile = null;
    if (botUserId) {
      const { data } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('user_id', botUserId)
        .single();

      if (data) {
        businessProfile = data;
        console.log('🏢 Loaded business profile');
      }
    }

    // Build the conversation history for context
    const conversationHistory = messages
      .map(m => `${m.role}: ${m.content}`)
      .join('\n');

    // Initialize uploaded documents from current state
    let uploadedDocuments: UploadedDocument[] = currentState.uploaded_documents || [];
    let imageAnalysis = '';

    // Check if the last message contains a NEW image and analyze it
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.content.startsWith('[IMAGE]')) {
      console.log('🖼️ Image detected, analyzing with Vision API...');

      // Extract URL from message format: [IMAGE] url
      const imageUrl = lastMessage.content.replace('[IMAGE] ', '').trim();

      try {
        // Use GPT-4 Vision to analyze the image
        const visionCompletion = await openai.chat.completions.create({
          model: 'gpt-5-nano',
          messages: [
            {
              role: 'system',
              content: `You are a visual assessment expert for ${businessName}. Analyze the uploaded image carefully and provide a detailed, accurate description of what you see. Be specific about:
- What type of item/product is shown (e.g., blinds, awnings, windows, etc.)
- The specific damage or condition visible
- Details that would help assess the situation
- Any relevant observations a professional would notice

Be accurate and specific. If the user said it's "blinds", describe BLINDS. If they said "awnings", describe AWNINGS. Match their terminology.`
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `The user uploaded an image. They mentioned: "${conversationHistory.split('\n').slice(-3).join(' ')}". Analyze this image and describe what you see in detail.`
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: imageUrl,
                    detail: 'high' // High detail for better analysis
                  }
                }
              ]
            }
          ],
          max_completion_tokens: 300
        });

        imageAnalysis = visionCompletion.choices[0].message.content || '';
        console.log('✅ Image analysis complete:', imageAnalysis.substring(0, 100) + '...');
      } catch (error) {
        console.error('❌ Image analysis error:', error);
        imageAnalysis = 'Image uploaded but analysis failed.';
      }
    }

    // Check if the last message contains a NEW document and parse it
    if (lastMessage && lastMessage.content.startsWith('[DOCUMENT]')) {
      console.log('📄 Document detected, parsing...');

      // Extract URL from message format: [DOCUMENT] url | filename
      const documentUrl = lastMessage.content.split(' | ')[0].replace('[DOCUMENT] ', '').trim();
      const documentName = lastMessage.content.split(' | ')[1] || 'document';

      try {
        const extractedText = await parseDocumentFromUrl(documentUrl);

        // Store the parsed document in uploaded_documents array
        const newDocument: UploadedDocument = {
          filename: documentName,
          url: documentUrl,
          extracted_text: extractedText,
          uploaded_at: new Date().toISOString(),
          uploaded_turn: messages.length,
        };

        uploadedDocuments = [...uploadedDocuments, newDocument];
        console.log('✅ Document parsed successfully, text length:', extractedText.length);
      } catch (error) {
        console.error('❌ Document parsing error:', error);
        // Don't add to uploaded_documents if parsing failed
      }
    }

    // Build document context from ALL uploaded documents (not just latest)
    let documentContext = '';
    if (uploadedDocuments.length > 0) {
      documentContext = `
UPLOADED DOCUMENTS CONTEXT:
================================================================================

`;
      uploadedDocuments.forEach((doc, index) => {
        documentContext += `DOCUMENT ${index + 1}: ${doc.filename}
Uploaded: ${new Date(doc.uploaded_at).toLocaleString()}

Content:
${doc.extracted_text}

================================================================================

`;
      });

      documentContext += `
You have access to ${uploadedDocuments.length} uploaded document${uploadedDocuments.length > 1 ? 's' : ''}.
Analyze ALL of them carefully and extract any relevant information for the required fields.
Reference specific details from the documents in your responses to show you've read them.
If the user asks questions about any previously uploaded document, you can answer using the content above.
`;
    }

    // Determine what information is still missing
    const allRequiredKeys = Object.keys(botSchema.required_info);
    const gatheredKeys = Object.keys(currentState.gathered_information);
    const missingInfo = allRequiredKeys.filter(key => !gatheredKeys.includes(key));
    const criticalMissing = missingInfo.filter(key => botSchema.required_info[key].critical);

    console.log('📋 Missing info:', missingInfo);
    console.log('⚠️ Critical missing:', criticalMissing);

    // IDENTITY OVERRIDE: Prioritize business_name from profile over bot name
    const effectiveBusinessName = (businessProfile?.business_name || businessName);
    console.log('🏷️ Effective Business Name:', effectiveBusinessName);

    // Build the complete system prompt
    const agentSystemPrompt = buildSystemPrompt(
      effectiveBusinessName,
      botSchema,
      businessProfile,
      currentState,
      uploadedDocuments,
      allRequiredKeys,
      missingInfo,
      imageAnalysis,
      messages
    );

    // Dynamically build the tool schema for incremental updates
    const toolProperties: Record<string, any> = {};
    Object.entries(botSchema.required_info).forEach(([key, info]) => {
      toolProperties[key] = {
        type: 'string',
        description: info.description,
      };
    });

    toolProperties['_conversation_status'] = {
      type: 'string',
      enum: ['active', 'completed'],
      description:
        "Set to 'completed' ONLY when all critical info is gathered and you are saying goodbye.",
    };

    const tools: OpenAI.Chat.ChatCompletionTool[] = [
      {
        type: 'function',
        function: {
          name: 'update_lead_info',
          description:
            'Save extracted lead information to the database. Call this whenever the user provides relevant info.',
          parameters: {
            type: 'object',
            properties: toolProperties,
            required: [],
          },
        },
      },
    ];

    const formattedMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: agentSystemPrompt,
      },
      ...processedMessages.map(
        (m) =>
          ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: m.content,
          } as OpenAI.Chat.ChatCompletionMessageParam)
      ),
    ];

    // Use extended thinking for confirmation phase (better decision making)
    const reasoningEffort = currentState.phase === 'collecting' && missingInfo.length <= 2
      ? 'medium'
      : 'low';

    console.log('🧠 Using reasoning effort:', reasoningEffort);

    // Check if client wants streaming
    const useStreaming = isStreamingRequest(request);
    console.log('🌊 Streaming mode:', useStreaming);

    // === STREAMING MODE ===
    if (useStreaming) {
      console.log('🌊 SERVER: Starting streaming mode');
      const stream = createSSEStream(async (controller, sendChunk) => {
        // Call OpenAI with streaming enabled
        const streamingCompletion = await openai.chat.completions.create({
          model: 'gpt-5-nano',
          messages: formattedMessages,
          tools,
          tool_choice: 'auto',
          reasoning_effort: reasoningEffort,
          stream: true, // Enable streaming
        });

        let reply = '';
        let extractedInfo: Record<string, string> = {};
        let newPhase: ConversationState['phase'] = currentState.phase;
        let tokenCount = 0;

        console.log('🌊 SERVER: Processing OpenAI stream');
        // Process the stream
        const { fullMessage, toolCalls } = await processOpenAIStream(
          streamingCompletion,
          (token) => {
            // Send each token immediately
            tokenCount++;
            sendChunk({ type: 'token', content: token });
          },
          (name, args) => {
            // Send tool call info
            console.log(`🌊 SERVER: Tool call received: ${name}`);
            sendChunk({ type: 'tool_call', toolCall: { name, arguments: args } });
          }
        );

        reply = fullMessage;
        console.log(`🌊 SERVER: Stream complete. Tokens sent: ${tokenCount}, Full message length: ${reply.length}`);

        // Process tool calls
        for (const toolCall of toolCalls) {
          if (toolCall.name === 'update_lead_info') {
            try {
              const args = JSON.parse(toolCall.arguments || '{}');
              console.log('🛠️ Agent extracted info:', args);

              if (args._conversation_status === 'completed') {
                newPhase = 'completed';
              }

              delete args._conversation_status;
              extractedInfo = { ...extractedInfo, ...args };
            } catch (e) {
              console.error('Error parsing tool args:', e);
            }
          }
        }

        // CRITICAL FIX: If AI only used tool calls without text response, generate contextual follow-up
        if (!reply.trim() && Object.keys(extractedInfo).length > 0) {
          console.log('🌊 SERVER: AI used tool calls but sent no text. Generating contextual response...');

          // Get what was just extracted to acknowledge it
          const extractedKeys = Object.keys(extractedInfo);
          const acknowledgedFields = extractedKeys
            .filter(key => !key.startsWith('_'))
            .map(key => {
              const fieldInfo = botSchema.required_info[key];
              return fieldInfo ? fieldInfo.description : key;
            })
            .slice(0, 2); // Only acknowledge first 2 fields

          // Generate contextual response via OpenAI
          const fallbackCompletion = await openai.chat.completions.create({
            model: 'gpt-5-nano',
            messages: [
              {
                role: 'system',
                content: `You are ${effectiveBusinessName}'s AI assistant. The user just provided information. Generate a brief, natural acknowledgment (1-2 sentences) and ask the next most important missing question. Be conversational and friendly.`,
              },
              {
                role: 'user',
                content: `The user just told you: ${messages[messages.length - 1]?.content}\n\nYou extracted: ${acknowledgedFields.join(', ')}.\n\nMissing info still needed: ${allRequiredKeys.filter(k => !extractedInfo[k]).slice(0, 3).join(', ')}.\n\nGenerate a brief acknowledgment and ask for the next piece of info.`,
              },
            ],
            max_tokens: 100,
            stream: true,
          });

          // Stream the fallback response
          let fallbackTokens = 0;
          for await (const chunk of fallbackCompletion) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              reply += content;
              sendChunk({ type: 'token', content });
              fallbackTokens++;
            }
          }
          console.log(`🌊 SERVER: Generated ${fallbackTokens} fallback tokens`);
        }

        // Update conversation state
        const { updatedGatheredInfo, newMissingInfo } = updateConversationState(
          currentState,
          extractedInfo,
          allRequiredKeys,
          botSchema
        );

        // Smart validation
        const lastUserMessage = messages[messages.length - 1]?.content || '';
        const validationResult = validateConversationPhase(
          newPhase,
          currentState.phase,
          updatedGatheredInfo,
          botSchema,
          lastUserMessage,
          reply
        );

        console.log('🌊 SERVER: Validation result:', { shouldShowConfirmation: validationResult.shouldShowConfirmation });
        if (validationResult.shouldShowConfirmation && validationResult.confirmationList) {
          reply = validationResult.confirmationList;
          // Send replacement message
          console.log('🌊 SERVER: Sending additional confirmation list token');
          sendChunk({ type: 'token', content: '\n\n' + validationResult.confirmationList });
        }

        newPhase = validationResult.correctedPhase;

        // Apply guardrails as fallback
        const { finalPhase } = enforceGuardrails(
          {
            reply,
            extracted_information: extractedInfo,
            updated_phase: newPhase,
            current_topic: currentState.current_topic || null,
            reasoning: 'Processed via streaming',
          },
          currentState,
          messages,
          botSchema,
          updatedGatheredInfo,
          allRequiredKeys
        );

        console.log('🌊 SERVER: Final phase after guardrails:', finalPhase);

        const updatedState: ConversationState = {
          gathered_information: updatedGatheredInfo,
          missing_info: newMissingInfo,
          phase: finalPhase as ConversationState['phase'],
          current_topic: currentState.current_topic ?? undefined,
          last_user_message: messages[messages.length - 1]?.content || '',
          uploaded_files: currentState.uploaded_files || [],
          uploaded_documents: uploadedDocuments,
        };

        const finalReply = fixBotIdentity(
          reply || '',
          effectiveBusinessName,
          botSchema,
          businessName
        );

        console.log(`🌊 SERVER: Final reply after fixBotIdentity - Original: ${reply.length} chars, Final: ${finalReply.length} chars`);

        // Send final state update
        console.log('🌊 SERVER: Sending state_update event');
        sendChunk({ type: 'state_update', state: updatedState });
        console.log('🌊 SERVER: Sending done event');
        sendChunk({ type: 'done' });
      });

      return new Response(stream, {
        headers: getSSEHeaders()
      });
    }

    // === NON-STREAMING MODE (Original) ===
    const completion = await openai.chat.completions.create({
      model: 'gpt-5-nano',
      messages: formattedMessages,
      tools,
      tool_choice: 'auto',
      reasoning_effort: reasoningEffort,
    });

    const message = completion.choices[0].message;
    if (!message) throw new Error('No agent response');

    let reply = message.content || '';
    let extractedInfo: Record<string, string> = {};
    let newPhase: ConversationState['phase'] = currentState.phase;

    if (message.tool_calls) {
      for (const toolCall of message.tool_calls) {
        if (toolCall.type === 'function' && toolCall.function?.name === 'update_lead_info') {
          try {
            const args = JSON.parse(toolCall.function.arguments || '{}');
            console.log('🛠️ Agent extracted info:', args);

            if (args._conversation_status === 'completed') {
              newPhase = 'completed';
            }

            delete args._conversation_status;
            extractedInfo = { ...extractedInfo, ...args };
          } catch (e) {
            console.error('Error parsing tool args:', e);
          }
        }
      }
    }

    // Handle duplicate closing prevention (early return)
    if (currentState.phase === 'completed') {
      console.log('🛑 DUPLICATE CLOSING PREVENTION: Already completed, sending final acknowledgement');

      const response: AgentResponse = {
        reply: "You're very welcome! Goodbye!",
        updated_state: {
          ...currentState,
          phase: 'completed',
          last_user_message: messages[messages.length - 1]?.content || '',
        },
        reasoning: 'Conversation already completed, sending final acknowledgement',
      };

      return NextResponse.json(response);
    }

    // Update conversation state by merging extracted information
    const { updatedGatheredInfo, newMissingInfo } = updateConversationState(
      currentState,
      extractedInfo,
      allRequiredKeys,
      botSchema
    );

    console.log('📊 Gathered so far:', Object.keys(updatedGatheredInfo).join(', ') || 'None');
    console.log('⏳ Still missing:', newMissingInfo.join(', ') || 'Nothing!');

    // Helpers to create concise follow-ups (avoid dumping internal descriptions)
    const formatLabel = (key: string) =>
      key
        .split('_')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');

    const buildProactiveFollowUp = (): string => {
      if (newMissingInfo.length === 0) {
        return 'Great—that covers what we need. Want me to lock this in?';
      }

      const contactKeywords = ['email', 'phone', 'name', 'contact', 'full_name'];
      const photoRegex = /photo|image|picture|upload/i;
      const transcript = messages.map(m => m.content?.toLowerCase?.() || '').join(' ');
      const damageMentioned = /scratch|damage|dent|swirl|scuff/.test(transcript);
      const noDamageMentioned = /no (scratch|scratches|damage|dent|dents|swirl|swirls|issues)/.test(transcript);

      const coreNonPhoto = newMissingInfo.filter(
        key =>
          !contactKeywords.some(k => key.toLowerCase().includes(k)) && !photoRegex.test(key)
      );
      const photoFields = newMissingInfo.filter(key => photoRegex.test(key));
      const contactOnly = newMissingInfo.filter(key =>
        contactKeywords.some(k => key.toLowerCase().includes(k))
      );

      let nextKey: string | undefined = coreNonPhoto[0];

      if (!nextKey) {
        if (photoFields.length > 0 && damageMentioned && !noDamageMentioned) {
          nextKey = photoFields[0];
        } else if (contactOnly.length > 0) {
          nextKey = contactOnly[0];
        } else if (photoFields.length > 0) {
          // photo is optional if no damage mentioned and nothing else to ask
          return 'No worries on photos since there’s no damage. Want me to finalize the booking details?';
        } else {
          nextKey = newMissingInfo[0];
        }
      }

      const label = formatLabel(nextKey);
      const isContact = contactOnly.includes(nextKey);
      const isPhoto = photoRegex.test(nextKey);

      if (isPhoto) {
        return 'If there’s visible damage or scratches, could you share 2–3 close-ups plus a wide shot? If not, we can skip photos.';
      }

      return isContact
        ? `Awesome. To finalize, what’s your ${label.toLowerCase()}?`
        : `Got it. Next up: ${label}?`;
    };

    // If the model only returned a tool call without surface text, provide a proactive follow-up
    if (!reply?.trim() && Object.keys(extractedInfo).length > 0) {
      reply = buildProactiveFollowUp();
    }

    // Phase progression based on gathered info and model signal
    if (newPhase !== 'completed') {
      if (currentState.phase === 'introduction') {
        newPhase = 'collecting';
      }

      if (newMissingInfo.length === 0) {
        newPhase = 'confirmation';
      }
    }

    // Use smart validation first (improved logic-based validation)
    const lastUserMessage = messages[messages.length - 1]?.content || '';
    const lastBotMessage = messages.length >= 2 ? messages[messages.length - 2]?.content || '' : '';

    const validationResult = validateConversationPhase(
      newPhase,
      currentState.phase,
      updatedGatheredInfo,
      botSchema,
      lastUserMessage,
      lastBotMessage
    );

    console.log('🔍 Smart Validation Result:', {
      isValid: validationResult.isValid,
      correctedPhase: validationResult.correctedPhase,
      issues: validationResult.issues
    });

    // If validation suggests showing confirmation list, use it
    if (validationResult.shouldShowConfirmation && validationResult.confirmationList) {
      reply = validationResult.confirmationList;
      console.log('📝 Using auto-generated confirmation list');
    }

    // Use corrected phase from smart validation
    newPhase = validationResult.correctedPhase;

    const parsedForGuardrails = {
      reply,
      extracted_information: extractedInfo,
      updated_phase: newPhase,
      current_topic: currentState.current_topic || null,
      reasoning: 'Processed via tool-first extraction',
    };

    // Keep guardrails as fallback (will remove in future iteration)
    const { finalPhase } = enforceGuardrails(
      parsedForGuardrails,
      currentState,
      messages,
      botSchema,
      updatedGatheredInfo,
      allRequiredKeys
    );

    const updatedState: ConversationState = {
      gathered_information: updatedGatheredInfo,
      missing_info: newMissingInfo,
      phase: finalPhase as ConversationState['phase'],
      current_topic: currentState.current_topic ?? undefined,
      last_user_message: messages[messages.length - 1]?.content || '',
      uploaded_files: currentState.uploaded_files || [],
      uploaded_documents: uploadedDocuments,
    };

    const finalReply = fixBotIdentity(
      reply || '',
      effectiveBusinessName,
      botSchema,
      businessName
    );

    const response: AgentResponse = {
      reply: finalReply,
      updated_state: updatedState,
      reasoning: 'Processed via tool-first extraction',
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Agent Brain Error:', error);
    return NextResponse.json(
      {
        error: 'Agent failed to process',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
