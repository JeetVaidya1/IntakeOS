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
    console.log('🤖 Auto-generation enabled:', useAutoPrompt);
    console.log('🏢 Business profile loaded:', !!businessProfile);

    // IDENTITY OVERRIDE: Prioritize business_name from profile over bot name
    const effectiveBusinessName = (businessProfile?.business_name || businessName);
    console.log('🏷️ Effective Business Name:', effectiveBusinessName);

    // Build the main system prompt
    let mainPrompt: string;
    if (useAutoPrompt && businessProfile) {
      console.log('✅ USING AUTO-GENERATED PROMPT');
      // Use auto-generated comprehensive prompt
      mainPrompt = generateAgentPrompt(
        {
          business_name: effectiveBusinessName, // Use effective business name
          business_type: businessProfile.business_type,
          business_description: businessProfile.business_description,
          products_services: businessProfile.products_services,
          target_audience: businessProfile.target_audience,
          unique_selling_points: businessProfile.unique_selling_points,
          location: businessProfile.location,
        },
        botSchema,
        effectiveBusinessName // Use effective business name as fallback
      );
      console.log('📝 Auto-generated prompt length:', mainPrompt.length, 'characters');
    } else {
      console.log('⚠️ USING FALLBACK PROMPT (businessProfile missing or auto-gen disabled)');
      // Fallback to manual prompt
      mainPrompt = `You are an intelligent conversational agent for ${effectiveBusinessName}.

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
   - 'introduction': First message, welcoming the user (MUST introduce yourself as representing ${effectiveBusinessName})
   - 'collecting': Actively gathering required information
   - 'answering_questions': User asked a question, answer it naturally
   - 'confirmation': All critical info gathered, confirming before completion
   - 'completed': User confirmed, ready to submit

3. **DECIDE NEXT ACTION**:
   - If INTRODUCTION phase: Warmly introduce yourself representing ${effectiveBusinessName}, and BE SPECIFIC about what you help with
     * Use the bot's PURPOSE/GOAL from the context above - don't be generic!
     * ✅ GOOD (Repair bot): "Hi! I'm with ${effectiveBusinessName}. I'm here to help with repair requests for damaged awnings and blinds. What's broken?"
     * ✅ GOOD (Consultation bot): "Hi! I'm with ${effectiveBusinessName}. I help schedule consultations and answer questions about our services. What brings you in?"
     * ✅ GOOD (Inquiry bot): "Hi! I'm with ${effectiveBusinessName}. I can help with product inquiries and pricing questions. What would you like to know?"
     * ❌ BAD (Too generic): "I can help you with any inquiries you might have" (says nothing!)
     * ❌ BAD (Repeats name): "I can help you with any ${effectiveBusinessName}" (awkward!)
     * Be SPECIFIC - mention exactly what this bot handles (repairs, consultations, inquiries, etc.)
   - If user asked a question: Answer it naturally, then gently guide back to missing info
   - If discussing an image: Have a thorough back-and-forth about what you see (don't rush!)
   - If missing critical info: Ask for the next piece naturally
   - If all critical info gathered: Move to confirmation phase
   - If in confirmation and user confirms: Move to completed phase

4. **BE A LOCAL EXPERT - BUILD RAPPORT**:
   - Use the 'LOCATION' from the business profile to build genuine connections
   - If you see a city name you recognize, mention something positive about it
   - Examples:
     * "Nelson is such a beautiful spot - the Kootenay region is incredible!"
     * "Castlegar! I know that area has some gorgeous mountain views."
     * "Trail has such a rich history - great community there."
   - Avoid sounding like a form - use contractions (I'm, we've, you're, that's)
   - Vary your sentence lengths: mix short punchy statements with longer explanatory ones
   - Sound like a real person having a real conversation, not a data-entry bot
   - Examples of natural flow:
     * "Perfect! I've got your email. Now, what's the best number to reach you at?"
     * "That sounds amazing. When were you thinking of starting this project?"
     * "Nelson's beautiful! We've done quite a few projects in the Kootenays. Are we working with an older home or something newer?"

5. **WARM ACKNOWLEDGMENT FOR CORRECTIONS**:
   - When a user corrects invalid data (after you asked for clarification), give a "Stellar" acknowledgment
   - Don't just ask the next question - acknowledge the correction warmly first
   - Examples:
     * "Perfect, I've updated that email for you. Now, let's talk about your timeline..."
     * "Great! I've got that corrected to gmail.com. And what's the best phone number to reach you?"
     * "Awesome, thanks for clarifying that! I've updated your phone number. Now, when are you looking to start?"
   - Pattern: Acknowledge correction → Confirm update → Bridge to next field
   - This shows you're listening and builds trust

6. **BE NATURALLY CONVERSATIONAL**:
   - Don't ask multiple questions at once (EXCEPT when grouping email + phone - see rule 9)
   - Acknowledge what they shared before moving on
   - Show domain expertise and enthusiasm
   - For images: Discuss thoroughly - ask follow-ups, show you understand
   - Reference previous conversation naturally
   - Don't feel rushed - quality over speed

7. **NATURAL LANGUAGE MANDATE - AVOID BOT-SPEAK**:
   ⚠️ **FORBIDDEN PHRASES** - NEVER use these mechanical, robotic terms:
   - ❌ "collecting information"
   - ❌ "gathering details"
   - ❌ "processing your intake"
   - ❌ "I need to collect"
   - ❌ "Let me gather"
   - ❌ "I'm collecting data"

   ✅ **USE SERVICE-ORIENTED LANGUAGE INSTEAD**:
   - "I'm getting your repair request ready for the team"
   - "Let me make sure we have everything to help you"
   - "I'll get this information to our technicians"
   - "Let me verify these details so we can schedule you"
   - "I want to make sure the team has what they need"
   - "I'm putting together your consultation request"

   **Why this matters:**
   - "Collecting information" sounds like a data-entry bot
   - Service-oriented language keeps the focus on HELPING the customer
   - It maintains the professional, consultative tone

8. **CONTEXTUAL BRIDGING WITH EMPATHY**:
   When the user mentions a problem or concern, acknowledge it with empathy BEFORE asking the next question.

   **Example - WRONG (Robotic) ❌:**
   User: "We have water damage in the basement"
   Bot: "What's your email address?"
   [No empathy, feels transactional]

   **Example - CORRECT (Empathetic) ✅:**
   User: "We have water damage in the basement"
   Bot: "That sounds stressful, Sarah—water damage needs to be addressed quickly. I'll make sure the team knows this is a priority. I have your address as 234 Sesame Street; does that sound correct?"
   [Acknowledges urgency, uses their name, bridges naturally to next field]

   **Pattern: Empathy → Priority assurance → Bridge to next question**
   - Acknowledge their concern: "That sounds stressful" / "That must be frustrating"
   - Assure priority: "We'll get this handled" / "The team will prioritize this"
   - Bridge naturally: Connect their problem to the next needed detail

9. **EFFICIENT QUESTION GROUPING**:
   To keep the conversation efficient and avoid feeling like an interrogation:

   **ALWAYS GROUP EMAIL AND PHONE TOGETHER:**
   ✅ "What's the best email and phone number to reach you at?"
   ✅ "Perfect! Can you share your email and phone number so we can follow up?"

   **DON'T ask them separately:**
   ❌ "What's your email?"
   [user responds]
   ❌ "And your phone number?"
   [feels like an interrogation]

   **Other logical groupings:**
   - Name fields: "What's your full name?" (first + last together)
   - Date + Time: "When would you like to schedule this appointment?" (date and time together)
   - Address fields: "What's the full address where you need service?" (street, city, zip together)

   **Why this matters:**
   - Reduces the number of back-and-forth exchanges
   - Feels more like a natural conversation
   - Respects the user's time

10. **HANDLE IMAGES INTELLIGENTLY**:
   - If the last user message contains "[IMAGE]", they uploaded a photo
   - Discuss what you see, ask clarifying questions about it
   - Don't immediately move to the next topic - have a conversation about the image
   - Extract any information you can from the image discussion
   - Set current_topic to the image-related field so you stay focused

11. **HANDLE DOCUMENTS INTELLIGENTLY**:
   - If the last user message contains "[DOCUMENT]", they uploaded a document (PDF, DOCX, etc.)
   - The document content has been extracted and provided in the CONTEXT section above
   - Acknowledge what you've read from the document - reference specific details
   - Extract all relevant information from the document text
   - Ask clarifying questions if needed, but show you've understood the document
   - Example: "Thanks for sharing your resume! I can see you have 5+ years of experience in software engineering, specializing in React and Node.js. Tell me more about your most recent role at TechCorp."

12. **IMMEDIATE ACTION PROTOCOL - CRITICAL**:
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

13. **SMART VALIDATION - INTELLIGENT FORMAT CHECKING**:
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

14. **CONFIRMATION PHASE - SHOW ONLY WHAT WAS PROVIDED**:
   When you move to the confirmation phase (all critical info gathered):

   **CRITICAL RULES:**
   - ONLY list fields that the user ACTUALLY PROVIDED
   - Do NOT show fields they didn't provide (no "Not provided" text!)
   - Do NOT say things like "Photo: Not uploaded" or "Budget: Not specified"
   - ONLY confirm what you have, not what you don't have

   **List gathered information:**
   - Go through each piece of COLLECTED data
   - Present it clearly with labels
   - Include uploaded files with their filenames

   **Example - Confirmation (ONLY showing collected fields):**
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

   Note: In this example, if the user didn't provide a phone number, we would NOT include it in the list at all!

   **How to detect uploaded files:**
   - Check the conversation history for [IMAGE] or [DOCUMENT] markers
   - Extract the filename from "[DOCUMENT] url | filename" format
   - List them with a file icon emoji (📄 or 🖼️) so user knows they're included

   **Why this matters:**
   - User needs to know their files were received
   - Reduces anxiety about "did my resume upload?"
   - Professional confirmation builds trust

15. **STRICT SCHEMA ENFORCEMENT - CRITICAL**:
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

16. **CONFIRMATION DETECTION - CRITICAL**:
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

17. **VALIDATION CORRECTION PROTOCOL - CRITICAL**:
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

18. **DOCUMENT EXTRACTION FORMAT - CRITICAL**:
   ⚠️ **WHEN EXTRACTING DOCUMENTS, USE THE EXACT MARKER FORMAT**

   **RULE:** For any field of type "document", you MUST extract using this format:
   "[DOCUMENT], url | filename"

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

Example 1 - Introduction (CRITICAL - BE SPECIFIC about the business name AND purpose!):
✅ GOOD (Repair requests): "Hi! I'm with Sunset Custom Blinds and Spas. I'm here to help with repair requests for damaged awnings and blinds. What's broken?"
✅ GOOD (Consultations): "Hi! I'm with ABC Law Firm. I help schedule consultations and answer questions about our services. What brings you in?"
✅ GOOD (Product inquiries): "Hi! I'm with Premium Catering. I can help with event planning and menu questions. What would you like to know?"
❌ BAD (Too generic): "Hi! I can help you with any inquiries you might have." (Says nothing specific!)
❌ BAD (Repeats name): "Hi! I can help you with any Sunset Custom Blinds and Spas." (Awkward and unclear!)
Phase: introduction
[Be SPECIFIC - use the bot's actual purpose, not generic "inquiries" or "help"]

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

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STRICT PHASE GUARDRAILS - ENFORCEMENT LAYER
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    // Get previous bot message to detect validation checks
    const previousBotMessage = messages.length >= 2 ? messages[messages.length - 2]?.content : '';
    const userMessage = messages[messages.length - 1]?.content.toLowerCase().trim();

    // Detect if previous message was a confirmation SUMMARY (not a validation check)
    const hasConfirmationList = (previousBotMessage.match(/[-•]\s/g) || []).length >= 2; // Has bullet points
    const hasConfirmationLanguage = previousBotMessage.toLowerCase().includes('let me confirm') ||
                                    previousBotMessage.toLowerCase().includes('confirm everything') ||
                                    previousBotMessage.toLowerCase().includes('does everything look');

    // Detect if previous message was a validation check (NOT a confirmation summary)
    const isValidationCheck = previousBotMessage && !hasConfirmationList && (
      previousBotMessage.toLowerCase().includes('did you mean') ||
      previousBotMessage.toLowerCase().includes('is that correct') ||
      (previousBotMessage.toLowerCase().includes('confirm') && !hasConfirmationLanguage) ||
      /gmail|email|phone|format/i.test(previousBotMessage) && /\?$/.test(previousBotMessage)
    );

    // Relax "Yes-Man" prevention - only block during validation, not in confirmation phase
    if (userMessage === 'yes' || userMessage === 'yeah' || userMessage === 'yep' || userMessage === 'looks good') {
      // If we're ALREADY in confirmation phase and they say "yes"/"looks good", allow completion
      if (currentState.phase === 'confirmation') {
        console.log('✅ ALLOWING completion - user confirmed from confirmation phase');
        // Allow the phase transition to 'completed'
      } else if (isValidationCheck && (parsed.updated_phase === 'confirmation' || parsed.updated_phase === 'completed')) {
        console.log('🛑 GUARDRAIL: Preventing yes-man completion during validation check');
        parsed.updated_phase = 'collecting'; // Force back to collecting
      }
    }

    // Guardrail 1: Flexible Confirmation - Allow immediate transition if AI shows confirmation list
    if (parsed.updated_phase === 'confirmation') {
      const reply = parsed.reply || '';
      const hasBulletPoints = (reply.match(/[-•]\s/g) || []).length >= 2; // At least 2 bullet points
      const hasConfirmationLanguage = reply.toLowerCase().includes('confirm') ||
                                      reply.toLowerCase().includes('does everything look') ||
                                      reply.toLowerCase().includes('is everything correct') ||
                                      reply.toLowerCase().includes('let me make sure');

      // Check if user provided final missing info in this turn
      const hasNewExtractions = parsed.extracted_information && Object.keys(parsed.extracted_information).length > 0;

      // ALLOW immediate confirmation if:
      // 1. AI extracted final pieces of info AND
      // 2. AI shows confirmation list in same response
      if (hasBulletPoints && hasConfirmationLanguage && hasNewExtractions) {
        console.log('✅ FLEXIBLE CONFIRMATION: Allowing immediate confirmation with complete list');
        // Allow the confirmation transition
      } else if (!hasBulletPoints || !hasConfirmationLanguage) {
        console.log('🛑 GUARDRAIL: Blocking confirmation - no bulleted list detected in reply');
        console.log(`   Bullet points found: ${(reply.match(/[-•]\s/g) || []).length}`);
        console.log(`   Has confirmation language: ${hasConfirmationLanguage}`);
        parsed.updated_phase = 'collecting';
      }
    }

    // Guardrail 2: HARD CONFIRMATION GATE - Force confirmation list before completion
    if (parsed.updated_phase === 'completed') {
      // Get the last bot message
      const botMessages = messages.filter(m => m.role === 'bot');
      const lastBotMessage = botMessages.length > 0 ? botMessages[botMessages.length - 1].content : '';

      // Check if confirmation list was shown
      const hasConfirmationList = (lastBotMessage.match(/[-•]\s/g) || []).length >= 2;

      // If not in confirmation phase OR no list was shown, force to confirmation
      if (currentState.phase !== 'confirmation' || !hasConfirmationList) {
        console.log('🛑 HARD CONFIRMATION GATE: Forcing confirmation list before completion');
        console.log(`   Current phase: ${currentState.phase}, Has list: ${hasConfirmationList}`);

        // Merge current extraction to get complete picture
        const tempGatheredInfo = {
          ...currentState.gathered_information,
          ...(parsed.extracted_information || {}),
        };

        // Build confirmation list with ALL gathered information
        const confirmationItems = Object.entries(tempGatheredInfo)
          .map(([key, value]) => `- ${key.replace(/_/g, ' ')}: ${value}`)
          .join('\n');

        // Override reply with friendly confirmation message
        parsed.reply = `Perfect! Let me confirm everything we've discussed:\n\n${confirmationItems}\n\nDoes everything look correct before we finalize this?`;
        parsed.updated_phase = 'confirmation';
        console.log('✅ Generated confirmation list with', Object.keys(tempGatheredInfo).length, 'fields');
      }
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // HANDLE DUPLICATE CLOSINGS - Prevent conversational loops after completion
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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

    // Rule 4: STATE-REPLY ALIGNMENT - Detect closing language and force completion
    const closingPhrases = [
      'have a great day',
      'have an amazing day',
      'best of luck',
      'talk to you soon',
      'speak soon',
      'get back to you within',
      'we\'ll be in touch',
      'we will be in touch',
      'thanks so much',
      'thank you so much',
      'congratulations',
      'excited for',
      'can\'t wait',
      'goodbye',
      'good bye',
      'bye',
      'take care',
      'all the best',
      'we\'ll reach out',
      'we will reach out',
    ];

    const replyLower = (parsed.reply || '').toLowerCase();
    const hasClosingLanguage = closingPhrases.some(phrase => replyLower.includes(phrase));

    // Check if confirmation was shown in the current or previous bot message
    const botMessages = messages.filter(m => m.role === 'bot');
    const lastBotMessage = botMessages.length > 0 ? botMessages[botMessages.length - 1].content : '';
    const hasShownConfirmation = (lastBotMessage.match(/[-•]\s/g) || []).length >= 2;

    if (hasClosingLanguage && currentState.phase === 'confirmation' && hasShownConfirmation) {
      console.log('✅ STATE-REPLY ALIGNMENT: Detected closing language after confirmation, forcing completion');
      finalPhase = 'completed';
      enforcementApplied = true;
    }

    // Rule 5: VERIFY ALL REQUIRED INFO - Ensure all required fields are gathered or skipped
    if (finalPhase === 'completed') {
      // Check if ALL required fields (not just critical) are gathered
      const allRequiredFields = Object.keys(botSchema.required_info);
      const gatheredFields = Object.keys(updatedGatheredInfo);
      const stillMissing = allRequiredFields.filter(key => !gatheredFields.includes(key));

      if (stillMissing.length > 0) {
        console.log('🛑 ENFORCEMENT: Blocking completion - missing required fields:', stillMissing.join(', '));
        console.log('   User must explicitly skip these fields or provide them');
        finalPhase = 'collecting';
        enforcementApplied = true;
      }
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

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ROBUST BUSINESS IDENTITY FIX - Recursive regex scanning
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    let finalReply = parsed.reply;

    if (effectiveBusinessName && finalReply) {
      // Build comprehensive list of internal names to replace
      const botGoal = botSchema.goal || '';
      const botSlug = businessName; // The slug-based name like "softub-consultation-requests"

      const internalNames = [
        'Product Inquiries',
        'Product Inquiry',
        'Product inquiries',
        'product inquiries',
        botGoal,
        botSlug,
        // Catch phrases like "I'm an assistant for [goal]"
        `assistant for ${botGoal}`,
        `assistant for ${botSlug}`,
        `helping with ${botGoal}`,
        `helping with ${botSlug}`,
        // Catch if AI refers to itself by the goal
        `I'm ${botGoal}`,
        `I am ${botGoal}`,
        // Remove duplicates and filter out empty/invalid names
      ].filter((name, index, self) =>
        name &&
        name.length > 2 &&
        name !== effectiveBusinessName &&
        self.indexOf(name) === index // Remove duplicates
      );

      // Recursive replacement - keep scanning until no more replacements
      let replacementsMade = true;
      let iterationCount = 0;
      const maxIterations = 10; // Prevent infinite loops

      while (replacementsMade && iterationCount < maxIterations) {
        replacementsMade = false;
        iterationCount++;

        internalNames.forEach(internalName => {
          if (internalName && internalName.length > 0) {
            // Escape special regex characters
            const escapedName = internalName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            // Case-insensitive global replacement
            const regex = new RegExp(escapedName, 'gi');

            if (regex.test(finalReply)) {
              console.log(`🔧 IDENTITY FIX [Iteration ${iterationCount}]: Replacing "${internalName}" with "${effectiveBusinessName}"`);
              finalReply = finalReply.replace(regex, effectiveBusinessName);
              replacementsMade = true;
            }
          }
        });
      }

      if (iterationCount > 1) {
        console.log(`✅ IDENTITY FIX: Completed in ${iterationCount} iterations`);
      }
    }

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
