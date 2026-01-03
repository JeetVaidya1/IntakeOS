import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import type { AgenticBotSchema, ConversationState, AgentResponse, UploadedDocument } from '@/types/agentic';
import { parseDocumentFromUrl } from '@/lib/document-parser';
import { buildSystemPrompt } from '@/lib/agent/system-prompt';
import { enforceGuardrails } from '@/lib/agent/guardrails';
import { fixBotIdentity } from '@/lib/agent/identity';
import { updateConversationState } from '@/lib/agent/state';

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

    // Call OpenAI to make the agent decision
    const completion = await openai.chat.completions.create({
      model: 'gpt-5-nano', // Using nano model - prompt optimized for better instruction following
      messages: [
        {
          role: 'system',
          content: agentSystemPrompt,
        },
        {
          role: 'user',
          content: `The user just said: "${messages[messages.length - 1]?.content || ''}"

⚠️⚠️⚠️ CRITICAL REMINDERS - READ CAREFULLY ⚠️⚠️⚠️

**BEFORE ASKING ANY QUESTION:**
1. **CHECK CONVERSATION HISTORY FIRST**: Look at "RECENT CONVERSATION FLOW" - did the user already mention this information?
   - If they said "I already gave you X" or "use that one" - they're right! Check conversation history and extract it
   - If you see [IMAGE] in conversation history, they already uploaded a photo - don't ask again!
   - If they mentioned address, email, phone, name earlier - extract it from conversation history!

2. **AGGRESSIVE EXTRACTION**: Extract information from:
   - Current user message
   - Conversation history (if they mentioned it earlier, extract it now!)
   - Image analysis (if image was uploaded)

3. **NEVER ASK FOR ALREADY-PROVIDED INFO**:
   - Check "INFORMATION ALREADY GATHERED" section - NEVER ask for those fields
   - Check conversation history - if they mentioned it, extract it and don't ask again
   - If user says "I already gave you X", acknowledge and use what they provided

**CONVERSATION FLOW:**
- **MAINTAIN CONTEXT**: Reference what was said earlier (check "RECENT CONVERSATION FLOW" section)
- **BUILD ON PREVIOUS STATEMENTS**: Don't start fresh each time - show you're listening
- **NATURAL TOPIC PROGRESSION**: Problem → Details → Images → Contact → Confirmation
- **COMPLETE TOPICS**: Finish discussing the current topic before moving to the next one
- Ask 1-2 questions MAX per response (contact info grouping is the only exception)
- If user says they're doing something ("wait, I'll get a photo"), acknowledge and WAIT

**IMAGE HANDLING:**
- If you see "IMAGE ANALYSIS" section, the user just uploaded an image:
  * USE the exact terminology from the analysis (if it says "blinds", say "blinds", not "awnings")
  * EXTRACT information from the analysis (damage_description, severity, etc.)
  * DESCRIBE what you see using specific details from the analysis
  * Have a conversation about the image before asking for other information

**EXTRACTION:**
- If the user provided multiple pieces of information (e.g., name, email, phone), extract ALL of them at once
- Only ask for fields listed under "INFORMATION STILL NEEDED"
- Keep it natural - have a real conversation, not a checklist

What should I reply, and what information can I extract? Return your response as JSON.`,
        },
      ],
      reasoning_effort: 'low',
      response_format: { type: "json_object" },
    });

    const agentDecision = completion.choices[0].message.content;
    if (!agentDecision) throw new Error('No agent response');

    console.log('🤖 Agent Decision:', agentDecision);

    const parsed = JSON.parse(agentDecision);

    console.log('📤 Agent Reply:', parsed.reply?.substring(0, 100) + '...');
    console.log('📥 Extracted Info:', parsed.extracted_information);
    console.log('🔄 Phase Transition:', currentState.phase, '→', parsed.updated_phase);

    // Handle duplicate closing prevention (early return)
    if (currentState.phase === 'completed') {
      console.log('🛑 DUPLICATE CLOSING PREVENTION: Already completed, sending final acknowledgement');

      // Send a very short final acknowledgement
      parsed.reply = "You're very welcome! Goodbye!";
      parsed.updated_phase = 'completed'; // Keep phase as completed
      parsed.extracted_information = {}; // No new extractions

      const response: AgentResponse = {
        reply: parsed.reply,
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
      parsed.extracted_information,
      allRequiredKeys,
      botSchema
    );

    console.log('📊 Gathered so far:', Object.keys(updatedGatheredInfo).join(', '));
    console.log('⏳ Still missing:', newMissingInfo.join(', ') || 'Nothing!');

    // Enforce guardrails on phase transitions
    const { finalPhase } = enforceGuardrails(
      parsed,
      currentState,
      messages,
      botSchema,
      updatedGatheredInfo,
      allRequiredKeys
    );

    // Build the updated state
    const updatedState: ConversationState = {
      gathered_information: updatedGatheredInfo,
      missing_info: newMissingInfo,
      phase: finalPhase as ConversationState['phase'],
      current_topic: parsed.current_topic || null,
      last_user_message: messages[messages.length - 1]?.content || '',
      uploaded_files: currentState.uploaded_files || [],
      uploaded_documents: uploadedDocuments,
    };

    console.log('✅ Final Phase:', updatedState.phase);

    // Fix bot identity by replacing internal names with effective business name
    const finalReply = fixBotIdentity(
      parsed.reply || '',
      effectiveBusinessName,
      botSchema,
      businessName
    );

    const response: AgentResponse = {
      reply: finalReply,
      updated_state: updatedState,
      reasoning: parsed.reasoning,
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
