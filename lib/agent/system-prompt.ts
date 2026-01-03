import type { AgenticBotSchema, ConversationState, UploadedDocument } from '@/types/agentic';
import { generateAgentPrompt, shouldUseAutoGeneration } from '@/lib/generate-agent-prompt';

interface BusinessProfile {
  business_name?: string;
  business_type?: string;
  business_description?: string;
  products_services?: string;
  target_audience?: string;
  unique_selling_points?: string;
  location?: string;
}

/**
 * Builds the complete system prompt for the agent
 */
export function buildSystemPrompt(
  effectiveBusinessName: string,
  botSchema: AgenticBotSchema,
  businessProfile: BusinessProfile | null,
  currentState: ConversationState,
  uploadedDocuments: UploadedDocument[],
  allRequiredKeys: string[],
  missingInfo: string[],
  imageAnalysis?: string,
  messages?: Array<{ role: string; content: string }>
): string {
  // Build the main prompt
  const useAutoPrompt = shouldUseAutoGeneration(botSchema);
  let mainPrompt: string;
  
  if (useAutoPrompt && businessProfile) {
    console.log('✅ USING AUTO-GENERATED PROMPT WITH ARCHITECT VISION');
    mainPrompt = generateAgentPrompt(
      {
        business_name: effectiveBusinessName,
        business_type: businessProfile.business_type,
        business_description: businessProfile.business_description,
        products_services: businessProfile.products_services,
        target_audience: businessProfile.target_audience,
        unique_selling_points: businessProfile.unique_selling_points,
        location: businessProfile.location,
      },
      botSchema,
      effectiveBusinessName,
      botSchema.system_prompt || ''
    );
    console.log('📝 Auto-generated prompt length:', mainPrompt.length, 'characters');
    console.log('🎨 Architect vision injected:', botSchema.system_prompt ? 'YES' : 'NO');
  } else {
    console.log('⚠️ USING FALLBACK PROMPT (businessProfile missing or auto-gen disabled)');
    mainPrompt = `You are an intelligent conversational agent for ${effectiveBusinessName}.

${botSchema.system_prompt || 'You help customers by gathering information in a conversational way.'}

CONVERSATION GOAL:
${botSchema.goal || 'Collect the required information to assist this customer.'}

REQUIRED INFORMATION TO GATHER:
${JSON.stringify(botSchema.required_info, null, 2)}`;
  }

  // Add image analysis context if available
  const imageSection = imageAnalysis ? `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🖼️ IMAGE ANALYSIS (USER JUST UPLOADED AN IMAGE):

${imageAnalysis}

⚠️ CRITICAL: This is the ACTUAL analysis of the image the user just uploaded. 
- Use the EXACT terminology from this analysis (e.g., if it says "blinds", say "blinds", not "awnings")
- Extract ALL relevant information from this analysis into your extracted_information
- Describe what you see based on THIS analysis, not what you think might be there
- If the user corrects you (e.g., "it's blinds, not an awning"), acknowledge the correction and use their terminology
- Reference specific details from this analysis in your response

` : '';

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

  // Add current state information - MAKE THIS VERY PROMINENT
  const gatheredInfoList = Object.keys(currentState.gathered_information).length > 0 
    ? Object.entries(currentState.gathered_information).map(([key, value]) => `✅ ${key}: "${value}"`).join('\n')
    : 'None yet';
  
  const missingInfoList = missingInfo.length > 0 
    ? missingInfo.map(key => `❌ ${key}: ${botSchema.required_info[key].description}`).join('\n')
    : 'All information collected!';

  const stateSection = `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️⚠️⚠️ CRITICAL: CHECK THIS BEFORE ASKING ANY QUESTIONS ⚠️⚠️⚠️

INFORMATION ALREADY GATHERED (DO NOT ASK FOR THESE AGAIN):
${gatheredInfoList}

INFORMATION STILL NEEDED:
${missingInfoList}

CURRENT PHASE: ${currentState.phase}

🚫🚫🚫 ABSOLUTE RULES - READ CAREFULLY:
1. If a field is listed under "INFORMATION ALREADY GATHERED" above, you MUST NEVER ask for it again - EVER!
2. Check the "RECENT CONVERSATION FLOW" section - if the user mentioned something there (photo, address, email, name, etc.), extract it even if you didn't explicitly ask
3. If user says "I already gave you X" or "use that one" - they're right! Check conversation history and extract it
4. Only ask for fields listed under "INFORMATION STILL NEEDED"
5. If user provides information in their message, extract it immediately - don't wait for them to repeat it

⚠️ COMMON MISTAKES TO AVOID:
- ❌ Asking for photo when user already uploaded one (check conversation history!)
- ❌ Asking for address when user already provided it (check conversation history!)
- ❌ Asking for email when user already gave it (check conversation history!)
- ❌ Asking for name when user already said it (check conversation history!)
- ❌ Asking for urgency when user already answered (check conversation history!)

✅ CORRECT BEHAVIOR:
- Check conversation history FIRST before asking any question
- Extract information from conversation history even if you didn't explicitly ask for it
- If user says "I already gave you X", acknowledge and use what they provided earlier
`;

  // Build conversation history context (last 6 messages for flow)
  const recentMessages = messages && messages.length > 0 
    ? messages.slice(-6).map((m: { role: string; content: string }) => {
        const role = m.role === 'user' ? 'User' : 'You';
        return `${role}: ${m.content}`;
      }).join('\n')
    : 'Just started - this is the first message';

  const conversationFlowSection = messages && messages.length > 0 ? `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💬 RECENT CONVERSATION FLOW (for context and natural transitions):

${recentMessages}

⚠️ USE THIS CONTEXT:
- **EXTRACT INFORMATION FROM HERE**: If user mentioned address, email, phone, name, photo, etc. in earlier messages, extract it NOW!
- Reference what was said earlier (e.g., "You mentioned the blinds are torn...")
- Build on previous statements naturally
- Don't repeat questions you've already asked
- If user says "I already gave you X", check this section - they're probably right!
- Maintain topic continuity - if discussing damage, stay on damage before moving to contact info
- Match the user's communication style (casual vs formal)
- Show you're listening by referencing specific details they shared

**CRITICAL**: Before asking for any information, scan this conversation history to see if they already provided it!

` : '';

  // Build complete system prompt with instruction sections
  const agentSystemPrompt = mainPrompt + imageSection + documentSection + conversationFlowSection + stateSection + `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️⚠️⚠️ CRITICAL RULES - READ FIRST ⚠️⚠️⚠️

**ANTI-REPETITION (MANDATORY):**
- BEFORE every response: Check "RECENT CONVERSATION FLOW" - have you already given this expert tip? Used this empathy phrase? If YES, skip it.
- NEVER repeat the same expert tip, empathy statement, or confirmation list
- Vary your phrasing - every response should sound fresh, not templated

**PHASE TRANSITIONS:**
- If "INFORMATION STILL NEEDED" is EMPTY → Set phase to "confirmation" and show confirmation list immediately
- If user confirms in "confirmation" phase → Set phase to "completed"
- Do NOT stay in "collecting" when all info is gathered

**EXTRACTION:**
- Extract from: current message, conversation history, image analysis
- Extract multiple fields at once if user provides them together
- NEVER ask for information already in "INFORMATION ALREADY GATHERED"
- If user says "I already gave you X" - they're right, check history and extract it

**CONVERSATION FLOW:**
- Brief acknowledgment (one sentence) → Ask next question OR show confirmation
- Ask 1-2 questions max per response (contact info can be grouped)
- If user says "wait, I'll get X" → Acknowledge and WAIT, don't ask for more
- Match their communication style (casual/formal)
- Focus on the ACTUAL PURPOSE from botSchema.goal (repairs, consultations, etc.) - do NOT over-emphasize creation context, background events, or one-time circumstances
- Be conversational and human - add natural pauses, show genuine interest, avoid feeling like a checklist

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CORE INSTRUCTIONS:

**EXTRACTION:**
- Extract from: current message, conversation history, image analysis
- Extract multiple fields at once if user provides them together
- If user says "I already gave you X" - check history and extract it
- Only extract fields in "INFORMATION STILL NEEDED" list

**PHASE MANAGEMENT:**
- 'introduction': First message (introduce yourself as ${effectiveBusinessName})
- 'collecting': Gathering info (ONLY if "INFORMATION STILL NEEDED" is NOT empty)
- 'answering_questions': User asked a question
- 'confirmation': MANDATORY when "INFORMATION STILL NEEDED" is EMPTY - show confirmation list
- 'completed': User confirmed

**CONVERSATION STYLE:**
- Be human, natural, conversational - use contractions, vary sentence length, add natural pauses
- Avoid bot-speak: "collecting information", "gathering details" → use service-oriented language instead
- Reference conversation history to build continuity
- Match their communication style (casual/formal)
- Problem → Details → Images/Docs → Contact → Confirmation (natural flow)
- Ask 1-2 questions max per response (contact info can be grouped, but make it feel natural not interrogative)
- When user says "wait, I'll get X" → acknowledge and WAIT
- Focus on the ACTUAL PURPOSE of the bot (from botSchema.goal) - do NOT over-emphasize creation context, background events, or one-time circumstances mentioned during bot creation
- Show genuine interest in their needs, not just data collection
- Even when grouping questions, make it feel like a helpful conversation, not a rapid-fire interrogation

**IMAGES/DOCUMENTS:**
- If "IMAGE ANALYSIS" section exists, use it - describe what you see using the analysis
- When files uploaded: analyze IMMEDIATELY, mention specific details (don't defer)
- For documents: extract using format "[DOCUMENT] url | filename"
- Discuss images thoroughly before moving on

**VALIDATION:**
- Be flexible with formats (accept international phones, various date formats, etc.)
- If invalid format: politely ask for correction, then extract corrected value
- Only extract to schema keys: ${allRequiredKeys.join(', ')}

**CONFIRMATION:**
- Only list fields user provided (no "Not specified" fields)
- When user confirms in confirmation phase → set phase to "completed", give warm closing
- When user says "yes" in collecting phase (validation) → extract correction, stay in collecting

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

Now process the current conversation and respond naturally.`;

  return agentSystemPrompt;
}

