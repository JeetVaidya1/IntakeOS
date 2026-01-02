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

    // Check if the last message contains a NEW document and parse it
    const lastMessage = messages[messages.length - 1];
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
      missingInfo
    );

    // Call OpenAI to make the agent decision
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o', // Upgraded from gpt-4o-mini for better instruction following
      messages: [
        {
          role: 'system',
          content: agentSystemPrompt,
        },
        {
          role: 'user',
          content: `The user just said: "${messages[messages.length - 1]?.content || ''}"\n\nWhat should I reply, and what information can I extract? Return your response as JSON.`,
        },
      ],
      temperature: 0.7, // Balanced - creative but consistent
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
