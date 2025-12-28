import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import type { AgenticBotSchema, ConversationState, AgentResponse, UploadedDocument } from '@/types/agentic';
import { parseDocumentFromUrl } from '@/lib/document-parser';

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
    let businessContext = '';
    if (botUserId) {
      const { data: businessProfile } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('user_id', botUserId)
        .single();

      if (businessProfile) {
        businessContext = `
BUSINESS CONTEXT (use this to inform your responses):
${businessProfile.business_description ? `About: ${businessProfile.business_description}` : ''}
${businessProfile.products_services ? `Offerings: ${businessProfile.products_services}` : ''}
${businessProfile.location ? `Location: ${businessProfile.location}` : ''}
${businessProfile.target_audience ? `Target Audience: ${businessProfile.target_audience}` : ''}
${businessProfile.unique_selling_points ? `What Makes ${businessName} Special: ${businessProfile.unique_selling_points}` : ''}
`;
        console.log('🏢 Loaded business context');
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

    // Build the system prompt for the agent
    const agentSystemPrompt = `You are an intelligent conversational agent for ${businessName}.

${botSchema.system_prompt}
${businessContext}
${documentContext}

CONVERSATION GOAL:
${botSchema.goal}

REQUIRED INFORMATION TO GATHER:
${JSON.stringify(botSchema.required_info, null, 2)}

INFORMATION GATHERED SO FAR:
${JSON.stringify(currentState.gathered_information, null, 2)}

MISSING INFORMATION:
${missingInfo.length > 0 ? missingInfo.map(key => `- ${key}: ${botSchema.required_info[key].description}`).join('\n') : 'All information collected!'}

CRITICAL MISSING:
${criticalMissing.length > 0 ? criticalMissing.map(key => `- ${key}: ${botSchema.required_info[key].description}`).join('\n') : 'All critical information collected!'}

FULL CONVERSATION HISTORY:
${conversationHistory}

YOUR TASK AS AN AGENTIC CONVERSATIONAL ASSISTANT:

1. **EXTRACT INFORMATION**: Carefully analyze the user's last message. Did they provide ANY information we need? Extract ALL of it, even if they mention multiple things at once.

2. **UPDATE PHASE**: Determine the conversation phase:
   - 'introduction': First message, welcoming the user (MUST introduce yourself as representing ${businessName})
   - 'collecting': Actively gathering required information
   - 'answering_questions': User asked a question, answer it naturally
   - 'confirmation': All critical info gathered, confirming before completion
   - 'completed': User confirmed, ready to submit

3. **DECIDE NEXT ACTION**:
   - If INTRODUCTION phase: Warmly introduce yourself as an assistant for ${businessName}, briefly mention what you're here to help with, and start the conversation naturally
   - If user asked a question: Answer it naturally, then gently guide back to missing info
   - If discussing an image: Have a thorough back-and-forth about what you see (don't rush!)
   - If missing critical info: Ask for the next piece naturally
   - If all critical info gathered: Move to confirmation phase
   - If in confirmation and user confirms: Move to completed phase

4. **BE NATURALLY CONVERSATIONAL**:
   - Don't ask multiple questions at once
   - Acknowledge what they shared before moving on
   - Show domain expertise and enthusiasm
   - For images: Discuss thoroughly - ask follow-ups, show you understand
   - Reference previous conversation naturally
   - Don't feel rushed - quality over speed

5. **HANDLE IMAGES INTELLIGENTLY**:
   - If the last user message contains "[IMAGE]", they uploaded a photo
   - Discuss what you see, ask clarifying questions about it
   - Don't immediately move to the next topic - have a conversation about the image
   - Extract any information you can from the image discussion
   - Set current_topic to the image-related field so you stay focused

6. **HANDLE DOCUMENTS INTELLIGENTLY**:
   - If the last user message contains "[DOCUMENT]", they uploaded a document (PDF, DOCX, etc.)
   - The document content has been extracted and provided in the CONTEXT section above
   - Acknowledge what you've read from the document - reference specific details
   - Extract all relevant information from the document text
   - Ask clarifying questions if needed, but show you've understood the document
   - Example: "Thanks for sharing your resume! I can see you have 5+ years of experience in software engineering, specializing in React and Node.js. Tell me more about your most recent role at TechCorp."

7. **IMMEDIATE ACTION PROTOCOL - CRITICAL**:
   ⚠️ **FORBIDDEN RESPONSES** - NEVER say any of the following when files are uploaded:
   - ❌ "Let me take a look at that"
   - ❌ "I'll review this"
   - ❌ "Thanks for the file, I'll check it out"
   - ❌ "Give me a moment to analyze"
   - ❌ Any variation of deferring analysis

   ✅ **REQUIRED BEHAVIOR** - When you detect [IMAGE] or [DOCUMENT]:
   - The content is ALREADY in your context above
   - You MUST analyze it IMMEDIATELY in your very next response
   - You MUST mention AT LEAST ONE specific detail from the file to prove you read it
   - Act like a receptionist who just received a paper - you read it NOW, not later

   **Example - WRONG ❌:**
   User: [Uploads Resume.pdf]
   Bot: "Thanks for sharing your resume! Let me take a look at that for you."
   [This forces a second message from the user asking "What did you find?"]

   **Example - CORRECT ✅:**
   User: [Uploads Resume.pdf]
   Bot: "Thanks for sharing your resume! I can see you graduated from MIT in 2018 and have been a Senior Software Engineer at Google for the past 4 years. That's impressive experience. What motivated you to apply to our position?"
   [Analysis is immediate, specific details prove the bot read it]

RESPONSE FORMAT (return VALID JSON):
{
  "reply": "Your natural, conversational response to the user",
  "extracted_information": {
    "info_key": "value you learned from their message"
  },
  "updated_phase": "introduction|collecting|answering_questions|confirmation|completed",
  "current_topic": "The information key you're currently discussing (or null)",
  "reasoning": "Brief explanation of your decision (for debugging)"
}

EXAMPLES OF GOOD AGENTIC BEHAVIOR:

Example 1 - Introduction (CRITICAL - always mention the business name!):
Bot: "Hi! I'm an assistant for ${businessName}. I'm here to help you with [purpose]. Let's chat about what you're looking for!"
Phase: introduction
[This establishes trust and brand identity right away]

Example 2 - Extracting multiple pieces at once:
User: "It's for Sarah and Mike's wedding on October 15th"
Your extraction: { "couple_names": "Sarah and Mike", "wedding_date": "October 15th" }
Your reply: "Sarah and Mike's October wedding - how exciting! 🎉 Where are you planning to have the ceremony?"

Example 3 - Image discussion (IMPORTANT - don't rush!):
User: [Uploads venue photo]
Your reply: "What a gorgeous venue! I can see it's an outdoor space with beautiful gardens. Is this where you're planning the ceremony?"
Phase: collecting
Topic: venue_details
[Wait for their response - DON'T move on yet!]

User: "Yes! It's Riverside Manor"
Your extraction: { "venue_details": "Riverside Manor, outdoor ceremony with gardens" }
Your reply: "Riverside Manor is stunning! I notice there are a lot of trees - will you have shade, or are you planning an evening ceremony?"
Topic: venue_details (STILL on the same topic!)
[Continue the conversation until you have full context]

Example 4 - User asks a question:
User: "Do you do engagement photos too?"
Phase: answering_questions
Your reply: "Yes, we absolutely do engagement sessions! They're a great way to get comfortable in front of the camera before the big day. Many couples do them 6-8 months before the wedding. Now, back to your wedding - have you decided on a date yet?"

Example 5 - Moving to confirmation:
[All critical info gathered]
Phase: confirmation
Your reply: "Perfect! Let me make sure I have everything right: Wedding for Sarah and Mike on October 15th, 2025 at Riverside Manor, around 150 guests, interested in our Premium 10-hour package, budget around $3-4k. I can reach you at sarah@example.com or (555) 123-4567. Does that all sound correct?"

Example 6 - Completion:
User: "Yes, that's all correct!"
Phase: completed
Your reply: "Wonderful! I'm so excited for your big day. I'll send all this information to our team and we'll get back to you within 24 hours with next steps. Congratulations again to you and Mike! 💕"

Now process the current conversation and respond.`;

    // Call OpenAI to make the agent decision
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
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

    // Merge extracted information into gathered_information
    const updatedGatheredInfo = {
      ...currentState.gathered_information,
      ...(parsed.extracted_information || {}),
    };

    // Recalculate missing info after extraction
    const newGatheredKeys = Object.keys(updatedGatheredInfo);
    const newMissingInfo = allRequiredKeys.filter(key => !newGatheredKeys.includes(key));

    // Build the updated state
    const updatedState: ConversationState = {
      gathered_information: updatedGatheredInfo,
      missing_info: newMissingInfo,
      phase: parsed.updated_phase || currentState.phase,
      current_topic: parsed.current_topic || null,
      last_user_message: messages[messages.length - 1]?.content || '',
      uploaded_files: currentState.uploaded_files || [],
      uploaded_documents: uploadedDocuments,
    };

    console.log('✅ Updated State:', updatedState);

    const response: AgentResponse = {
      reply: parsed.reply,
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
