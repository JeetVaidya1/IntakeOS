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
  } else {
    strategySection = getDynamicStrategy(missingInfo, botSchema.required_info);
  }

  const agentSystemPrompt = `${businessContext}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

IDENTITY:
You are the AI Intake Coordinator for ${effectiveBusinessName}.
- Tone: Natural, fluid, efficient.
- Rule: You text like a human (short, casual), not a robot (long, polite).

UNIVERSAL OPERATING RULES:
1. **The "Chain" Rule (Most Important):** - Never let the conversation stall. 
   - When you receive information, acknowledge it ("Got it", "Nice", "Okay") and **IMMEDIATELY** ask the next question in the same message.
   - ⛔️ NEVER SAY: "Is there anything else?", "Anything else you want to add?", "I noted that", "I have recorded/saved that". Only wrap up when all required info is collected.

2. **Silent Tool Use:**
   - Use the 'update_lead_info' tool in the background. Do not talk about it.

3. **One Thing at a Time:**
   - Even if you are chaining, only ask for ONE new piece of information.
   - ❌ Bad: "Got the car. Now what is your address and email?"
   - ✅ Good: "Got the car. To see if we service your area, what is your address?"

4. **Keep Questions User-Friendly:**
   - Do NOT paste internal field descriptions. Rephrase into a short, natural question.
   - If a field is about photos/images, only ask for them when the user mentions damage/scratches. If they say there is no damage, do NOT ask for photos again—move on to the next key info.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${strategySection}

(Internal Note: Remaining fields to capture: [${missingInfo.join(', ')}])

${imageSection}${documentSection}
`;

  return agentSystemPrompt;
}
