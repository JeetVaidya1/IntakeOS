import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import type { AgenticBotSchema, ConversationState, AgentResponse, UploadedDocument } from '@/types/agentic';
import { parseDocumentFromUrl } from '@/lib/document-parser';
import { generateAgentPrompt, shouldUseAutoGeneration } from '@/lib/generate-agent-prompt';

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

    // Determine if we should use auto-generated prompt
    const useAutoPrompt = shouldUseAutoGeneration(botSchema);
    console.log('🤖 Using auto-generated prompt:', useAutoPrompt);

    // Build the main system prompt
    let mainPrompt: string;
    if (useAutoPrompt && businessProfile) {
      // Use auto-generated comprehensive prompt
      mainPrompt = generateAgentPrompt(
        {
          business_name: businessName,
          business_type: businessProfile.business_type,
          business_description: businessProfile.business_description,
          products_services: businessProfile.products_services,
          target_audience: businessProfile.target_audience,
          unique_selling_points: businessProfile.unique_selling_points,
          location: businessProfile.location,
        },
        botSchema,
        businessName
      );
    } else {
      // Fallback to manual prompt
      mainPrompt = `You are an intelligent conversational agent for ${businessName}.

${botSchema.system_prompt || 'You help customers by gathering information in a conversational way.'}

CONVERSATION GOAL:
${botSchema.goal || 'Collect the required information to assist this customer.'}

REQUIRED INFORMATION TO GATHER:
${JSON.stringify(botSchema.required_info, null, 2)}`;
    }

    // Add document context if available
    const documentSection = uploadedDocuments.length > 0 ? `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

UPLOADED DOCUMENTS CONTEXT:
${uploadedDocuments.map((doc, i) => `
DOCUMENT ${i + 1}: ${doc.filename}
Uploaded: ${new Date(doc.uploaded_at).toLocaleString()}

Content:
${doc.extracted_text}
`).join('\n')}

You have access to ${uploadedDocuments.length} uploaded document${uploadedDocuments.length > 1 ? 's' : ''}.
Analyze ALL of them carefully and extract any relevant information for the required fields.
Reference specific details from the documents in your responses to show you've read them.
` : '';

    // Add current state information
    const stateSection = `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CURRENT CONVERSATION STATE:

INFORMATION GATHERED SO FAR:
${Object.keys(currentState.gathered_information).length > 0 ? Object.entries(currentState.gathered_information).map(([key, value]) => `- ${key}: ${value}`).join('\n') : 'None yet'}

STILL MISSING:
${missingInfo.length > 0 ? missingInfo.map(key => `- ${key}: ${botSchema.required_info[key].description}`).join('\n') : 'All information collected!'}

CURRENT PHASE: ${currentState.phase}
`;

    // Build complete system prompt with instruction sections
    const agentSystemPrompt = mainPrompt + documentSection + stateSection + `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DETAILED INSTRUCTIONS:

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

8. **SMART VALIDATION - INTELLIGENT FORMAT CHECKING**:
   Each required field has a "type" hint (email, phone, url, date, number, text).
   Use intelligent, flexible validation - don't be overly strict!

   **Email Validation (type: "email"):**
   ✅ ACCEPT: user@domain.com, name+tag@company.co.uk, user123@subdomain.company.com
   ❌ REJECT: "john at gmail", "myemail.com", "name@@domain"
   Rule: Must have @ symbol and a domain. Be flexible with international domains and + tags.

   **Phone Validation (type: "phone"):**
   ✅ ACCEPT: +1 (555) 123-4567, 555-123-4567, +44 20 1234 5678, 5551234567, ext 123
   ✅ ACCEPT: International formats like +91 98765 43210, +81-3-1234-5678
   ❌ REJECT: "call me", "555" (too short), "abc-def-ghij"
   Rule: Must contain digits. Accept ANY reasonable phone format (international, extensions, various separators).
   Don't enforce a specific number of digits - different countries have different lengths!

   **URL Validation (type: "url"):**
   ✅ ACCEPT: https://example.com, http://site.com, www.company.com, company.com/page
   ❌ REJECT: "my website", "google" (just a word)
   Rule: Should look like a web address. Accept with/without http://, with/without www.

   **Date Validation (type: "date"):**
   ✅ ACCEPT: 01/15/2024, Jan 15 2024, January 15th, 2024-01-15, 15/01/2024
   ❌ REJECT: "sometime next month", "idk"
   Rule: Must be a specific date. Accept ANY reasonable date format (US, UK, ISO, written out).

   **Number Validation (type: "number"):**
   ✅ ACCEPT: 42, 3.14, 1,000, 1000, $50, 50 USD, 25%
   ❌ REJECT: "a lot", "many"
   Rule: Must contain a numeric value. Accept with currency symbols, commas, decimals, percentages.

   **When to Ask for Correction:**
   If user provides invalid format:
   - DON'T extract it
   - Politely ask them to provide it in a valid format
   - Example: "I need a valid email address to send your confirmation. Could you provide that?"
   - Give a helpful hint if needed: "Please include the @ symbol and domain, like name@example.com"

   **Be Pragmatic:**
   - ACCEPT edge cases and international formats
   - REJECT obviously wrong data like "idk" or "call me" for a phone field
   - Your job is to ensure quality data while being user-friendly

9. **CONFIRMATION PHASE - INCLUDE EVERYTHING**:
   When you move to the confirmation phase (all critical info gathered):

   **List ALL gathered information:**
   - Go through each piece of collected data
   - Present it clearly with labels
   - Include uploaded files with their filenames

   **Example - Confirmation with Files:**
   "Perfect! Let me confirm everything:
   - Name: Sarah Johnson
   - Email: sarah.j@gmail.com
   - Phone: +1 (555) 123-4567
   - Wedding Date: October 15th, 2025
   - Venue: Riverside Manor
   - Guest Count: ~150 people
   - Budget: $3,000-$4,000
   - 📄 Resume: Resume_SarahJohnson.pdf (uploaded ✓)
   - 📄 Portfolio: Portfolio_2024.pdf (uploaded ✓)

   Does everything look correct? If you need to change anything, just let me know!"

   **How to detect uploaded files:**
   - Check the conversation history for [IMAGE] or [DOCUMENT] markers
   - Extract the filename from "[DOCUMENT] url | filename" format
   - List them with a file icon emoji (📄 or 🖼️) so user knows they're included

   **Why this matters:**
   - User needs to know their files were received
   - Reduces anxiety about "did my resume upload?"
   - Professional confirmation builds trust

10. **STRICT SCHEMA ENFORCEMENT - CRITICAL**:
   ⚠️ **YOU CAN ONLY EXTRACT TO KEYS THAT EXIST IN THE SCHEMA**

   **ALLOWED extraction keys (from REQUIRED INFORMATION TO GATHER above):**
   ${allRequiredKeys.join(', ')}

   **RULES:**
   - Check if the key exists in REQUIRED INFORMATION before extracting
   - NEVER invent new field names like "skills", "position_type", "key_languages"
   - If user provides information that doesn't map to a schema field, acknowledge it in your reply but DON'T extract it
   - If information belongs to an existing field, extract it using the EXACT schema key name

   **Example - WRONG ❌:**
   Schema has: { "full_name": {...}, "email": {...}, "resume": {...} }
   User: "I'm proficient in Python, Java, and C++"
   Your extraction: { "programming_languages": "Python, Java, C++" }  // ❌ This key doesn't exist!

   **Example - CORRECT ✅:**
   Schema has: { "full_name": {...}, "email": {...}, "resume": {...} }
   User: "I'm proficient in Python, Java, and C++"
   Your extraction: {}  // ✅ No matching schema field, so don't extract
   Your reply: "That's an impressive skill set! I'll make a note of your programming expertise. Now, could you share your full name?"

11. **CONFIRMATION DETECTION - CRITICAL**:
   ⚠️ **ONLY APPLIES WHEN CURRENT PHASE IS ALREADY "confirmation"**

   **IMPORTANT - Check Phase First:**
   - This rule ONLY applies if the current phase is "confirmation"
   - If phase is "collecting", "introduction", or "answering_questions", DO NOT use this logic
   - Only move to "completed" when you're ALREADY in "confirmation" phase

   **When you're in confirmation phase and user confirms:**

   **Confirmation triggers (when ALREADY in confirmation phase):**
   - "yes" / "yep" / "yeah" / "correct" / "that's right" / "all correct"
   - "looks good" / "perfect" / "sounds good"
   - "yes that's everything" / "yes submit it"
   - Any affirmative response when you asked "Does everything look correct?"

   **What to do:**
   1. Extract NOTHING (extracted_information should be {})
   2. Set updated_phase to "completed"
   3. Give a warm closing message thanking them
   4. DO NOT repeat the confirmation list again

   **Example - CORRECT ✅:**
   [Current phase: "confirmation", you just showed the complete list]
   User: "yes"
   Your response: {
     "extracted_information": {},
     "updated_phase": "completed",
     "reply": "Wonderful! I've got all your information. We'll review everything and get back to you within 24 hours. Thanks so much!"
   }

   **Example - WRONG (Don't confuse validation confirmation with final confirmation) ❌:**
   [Current phase: "collecting", you asked "Did you mean gmail.com?"]
   User: "yes"
   Your response: {
     "updated_phase": "completed"  // ❌ WRONG! Still collecting, not in confirmation yet!
   }
   Should be: {
     "extracted_information": { "email": "user@gmail.com" },  // ✅ Extract correction
     "updated_phase": "collecting"  // ✅ Stay in collecting phase
   }

12. **VALIDATION CORRECTION PROTOCOL - CRITICAL**:
   ⚠️ **WHEN USER CORRECTS INVALID DATA, EXTRACT THE CORRECTED VALUE**

   **Scenario:** You detected invalid format and asked for correction
   **User responds:** Provides the corrected value
   **What to do:** Extract the CORRECTED value, replacing the wrong one

   **Example flow:**
   Turn 1:
   User: "My email is john at gmail dot com"
   You detect: Invalid format (no @ symbol)
   Your reply: "I need a valid email with the @ symbol, like john@gmail.com"
   Your extraction: {}  // Don't extract the invalid value

   Turn 2:
   User: "oh sorry, it's john@gmail.com"
   Your extraction: { "email": "john@gmail.com" }  // ✅ Extract the corrected value

   Another example:
   Turn 1:
   User: "Email is donny@gmial.com"
   Your extraction: { "email": "donny@gmial.com" }  // Extracted but you noticed typo
   Your reply: "I noticed 'gmial.com' - did you mean 'gmail.com'?"

   Turn 2:
   User: "yes i meant gmail.com"
   Your extraction: { "email": "donny@gmail.com" }  // ✅ Extract CORRECTED value (replaces old one)
   Your phase: "collecting"  // ✅ Stay in collecting - not done yet!
   Your reply: "Perfect! Now, could you share your phone number?"  // ✅ Continue collecting

   **CRITICAL:** After extracting a correction, continue collecting the remaining required fields!
   Don't jump to completion just because the user said "yes" to a validation question.

13. **DOCUMENT EXTRACTION FORMAT - CRITICAL**:
   ⚠️ **WHEN EXTRACTING DOCUMENTS, USE THE EXACT MARKER FORMAT**

   **RULE:** For any field of type "document", you MUST extract using this format:
   "[DOCUMENT] url | filename"

   **How to get the URL and filename:**
   - Look in the conversation history for the user's upload message
   - It will be formatted as: "[DOCUMENT] https://storage.url/path/file.pdf | Resume.pdf"
   - Extract the ENTIRE marker string, don't just extract the filename

   **Example - WRONG ❌:**
   User uploaded: "[DOCUMENT] https://supabase.co/storage/v1/abc123.pdf | Resume_John.pdf"
   Your extraction: { "resume": "Resume_John.pdf" }  // ❌ Missing URL and marker!

   **Example - CORRECT ✅:**
   User uploaded: "[DOCUMENT] https://supabase.co/storage/v1/abc123.pdf | Resume_John.pdf"
   Your extraction: { "resume": "[DOCUMENT] https://supabase.co/storage/v1/abc123.pdf | Resume_John.pdf" }  // ✅ Full marker

   **Why this matters:**
   - The submission page needs the full marker to render documents as clickable download links
   - Without the marker, it shows as plain text
   - This is how we display files properly in the dashboard

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

    // Merge extracted information into gathered_information
    const updatedGatheredInfo = {
      ...currentState.gathered_information,
      ...(parsed.extracted_information || {}),
    };

    // Recalculate missing info after extraction
    const newGatheredKeys = Object.keys(updatedGatheredInfo);
    const newMissingInfo = allRequiredKeys.filter(key => !newGatheredKeys.includes(key));
    const newCriticalMissing = newMissingInfo.filter(key => botSchema.required_info[key].critical);

    console.log('📊 Gathered so far:', Object.keys(updatedGatheredInfo).join(', '));
    console.log('⏳ Still missing:', newMissingInfo.join(', ') || 'Nothing!');
    console.log('⚠️ Critical still missing:', newCriticalMissing.join(', ') || 'None');

    // ENFORCEMENT LOGIC - Prevent premature completion
    let finalPhase = parsed.updated_phase || currentState.phase;
    let enforcementApplied = false;

    // Rule 1: Can't move to confirmation if critical fields are still missing
    if (finalPhase === 'confirmation' && newCriticalMissing.length > 0) {
      console.log('🛑 ENFORCEMENT: Blocking confirmation - still missing critical fields:', newCriticalMissing.join(', '));
      finalPhase = 'collecting';
      enforcementApplied = true;
    }

    // Rule 2: Can't move to completed unless we're already in confirmation
    if (finalPhase === 'completed' && currentState.phase !== 'confirmation') {
      console.log('🛑 ENFORCEMENT: Blocking completion - not in confirmation phase yet');
      finalPhase = currentState.phase; // Stay in current phase
      enforcementApplied = true;
    }

    // Rule 3: Can't move to completed if confirmation list wasn't shown
    // Check if the reply contains field names (simple heuristic)
    if (finalPhase === 'completed' && currentState.phase === 'confirmation') {
      const hasConfirmationList = parsed.reply.includes(':') &&
                                  (parsed.reply.toLowerCase().includes('confirm') ||
                                   parsed.reply.toLowerCase().includes('correct'));

      // This is a completion from confirmation phase - that's OK
      // We already checked confirmation in previous turn
    }

    if (enforcementApplied) {
      console.log('✅ ENFORCEMENT APPLIED: Final phase =', finalPhase);
    }

    // Build the updated state
    const updatedState: ConversationState = {
      gathered_information: updatedGatheredInfo,
      missing_info: newMissingInfo,
      phase: finalPhase,
      current_topic: parsed.current_topic || null,
      last_user_message: messages[messages.length - 1]?.content || '',
      uploaded_files: currentState.uploaded_files || [],
      uploaded_documents: uploadedDocuments,
    };

    console.log('✅ Final Phase:', updatedState.phase);

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
