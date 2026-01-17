import type {
  AgenticBotSchema,
  ConversationState,
  UploadedDocument,
} from '@/types/agentic';

// Local BusinessProfile helper (types/agentic does not export one)
interface BusinessProfile {
  business_name?: string;
  name?: string;
  industry?: string;
  description?: string;
  services?: string[];
}

// 1. Universal "Next Step" Calculator
// This works for ANY industry by looking at the specific missing keys
function getDynamicStrategy(
  missingInfo: string[],
  requiredInfoSchema: Record<string, any>
): string {
  // A. Categorize the missing fields
  const contactKeywords = ['email', 'phone', 'name', 'contact', 'full_name'];

  // "Core" = Business questions (Location, Symptoms, Budget, Car Model)
  const coreFields = missingInfo.filter(
    (key) => !contactKeywords.some((k) => key.toLowerCase().includes(k))
  );

  // "Contact" = Closing details (Name, Email)
  const contactFields = missingInfo.filter((key) =>
    contactKeywords.some((k) => key.toLowerCase().includes(k))
  );

  // B. Strategy: The "Double-Barrel" Instruction
  // We tell the bot exactly what to do NOW and what to do NEXT in the same turn.

  // Scenario 1: Still discovering business info (e.g., Real Estate: Needs Location & Budget)
  if (coreFields.length > 0) {
    const currentKey = coreFields[0];
    const nextKey = coreFields.length > 1 ? coreFields[1] : contactFields[0] || 'finish';

    const currentDesc =
      requiredInfoSchema[currentKey]?.description || currentKey.replace(/_/g, ' ');
    const nextDesc = requiredInfoSchema[nextKey]?.description || 'finalize the booking';

    return `🧠 BATTLE PLAN:
    1. CURRENT TARGET: You need "${currentDesc}".
    2. THE CHAIN MOVE: As soon as the user answers that, acknowledge it briefly and IMMEDIATELY ask for "${nextDesc}".
    3. RULE: Do not say "Is there anything else?" -> Ask the next question instead. Keep it specific: ask directly for "${nextDesc}".`;
  }

  // Scenario 2: Moving to the Close (Business info done, needs Name/Email)
  if (contactFields.length > 0) {
    const currentKey = contactFields[0];
    return `🧠 BATTLE PLAN:
    1. STATUS: You have all the project details. Now secure the contact info.
    2. ACTION: Ask for "${requiredInfoSchema[currentKey]?.description || currentKey}".
    3. TONE: Confident and closing. (e.g., "Great, to get this booked, what is your name?"). Do not ask "anything else" here—ask for this specific contact item.`;
  }

  // Scenario 3: All Done
  return `🧠 BATTLE PLAN:
  1. STATUS: Mission Accomplished.
  2. ACTION: Summarize what you have collected and confirm the next steps (e.g., "I'll have a team member reach out"). Do not ask "anything else"—propose the concrete next step.`;
}

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
  // Context builders
  const displayName = businessProfile?.name || businessProfile?.business_name || effectiveBusinessName;

  const businessContext = businessProfile
    ? `BUSINESS CONTEXT: ${businessProfile.name || businessProfile.business_name} is a ${businessProfile.industry || 'services'} business.
About: ${businessProfile.description || 'No description provided'}
Services: ${businessProfile.services?.join(', ') || 'General Services'}`
    : `BUSINESS CONTEXT: You represent ${effectiveBusinessName}.`;

  const imageSection = imageAnalysis
    ? `\n\nIMAGE CONTEXT: User uploaded image analysis: ${imageAnalysis}`
    : '';

  const documentSection =
    uploadedDocuments.length > 0
      ? `\n\nDOCUMENTS: User uploaded: ${uploadedDocuments
          .map((d) => (d as any).name || d.filename)
          .join(', ')}.`
      : '';

  // 2. Generate the Dynamic Strategy
  const isFirstMessage = !messages || messages.length === 0;
  let strategySection = '';

  if (isFirstMessage) {
    strategySection = `🧠 BATTLE PLAN:
    - Start with a high-energy Greeting.
    - Ask ONE open-ended question to get the ball rolling (e.g., "How can I help?" or specific to the industry).
    - Do NOT ask for contact info yet.`;
  } else if (missingInfo.length === 0) {
    // ALL information collected - time for confirmation
    strategySection = `🧠 BATTLE PLAN - CONFIRMATION REQUIRED:
    - ALL required information has been collected!
    - You MUST show a bulleted confirmation list of everything gathered
    - Format: "Let me confirm everything:\n- Field 1: value\n- Field 2: value\n\nDoes everything look correct?"
    - Do NOT complete until user confirms "yes" or "looks good"
    - Use the update_lead_info tool with _conversation_status: 'completed' ONLY after user confirms`;
  } else {
    strategySection = getDynamicStrategy(missingInfo, botSchema.required_info);
  }

  const agentSystemPrompt = `${businessContext}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

IDENTITY:
You are the AI Intake Coordinator for ${effectiveBusinessName}.
- Tone: Natural, fluid, efficient.
- Rule: You text like a human (short, casual), not a robot (long, polite).

CONVERSATIONAL GUIDELINES - Learn from these examples:

EXAMPLE 1 - Natural Chaining (Do this):
User: "I need help with my roof"
You: "I'd be happy to help! Is this for a residential or commercial property?"
User: "Residential"
You: "Perfect! What's the property address?"

EXAMPLE 2 - Handling Uncertainty (Do this):
User: "Not sure about my budget yet"
You: "No worries - we can discuss that later. What type of service are you looking for?"
User: "Roof repair"
You: "Got it! Where's the property located?"

EXAMPLE 3 - Multi-Part Natural Response (Do this):
User: "I saw your wedding packages online"
You: "How exciting! Congrats on the upcoming wedding! When's the big day?"
User: "June 15th next year"
You: "Beautiful! Summer weddings are amazing. What venue are you thinking?"

EXAMPLE 4 - Asking One Thing at a Time (Do this):
User: "2015 Honda Accord"
You: "Got it, Honda Accord. To see if we service your area, what's the address?"
(NOT: "Got it. What's your address and email?")

EXAMPLE 5 - User Exploring (Do this):
User: "Just looking at options right now"
You: "Perfect! I can help with that. What kind of project are you planning?"

EXAMPLE 6 - Handling Documents/Images (Do this):
User: [uploads roof image]
You: "Thanks for the photo! I can see the shingles on the south side. Is this the main area of concern, or are there other spots too?"

WHAT NOT TO DO - Avoid these patterns:
❌ "Thank you for that information. Is there anything else you'd like to add?"
❌ "I have noted your response in our system."
❌ "Let me record that. Do you have any other details?"
❌ Asking multiple questions at once: "What's your name, email, phone, and address?"
❌ Robotic confirmations: "Acknowledged. Information saved."

KEY PRINCIPLES:
- Use the 'update_lead_info' tool silently in the background - never mention it
- Acknowledge briefly ("Got it", "Perfect", "Great"), then immediately ask the next question
- Ask for ONE piece of information at a time
- Keep it conversational and natural, like the examples above
- Rephrase internal field names into user-friendly questions

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${strategySection}

(Internal Note:
 - Remaining fields to capture: [${missingInfo.join(', ')}]
 - Already asked (don't ask again): [${currentState.asked_fields?.join(', ') || 'none'}]
 - CRITICAL: Never ask for the same field twice! Check the "Already asked" list before asking questions.)

${imageSection}${documentSection}
`;

  return agentSystemPrompt;
}
