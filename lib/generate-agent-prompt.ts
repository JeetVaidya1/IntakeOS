import type { AgenticBotSchema } from '@/types/agentic';

interface BusinessProfile {
  business_name: string;
  business_type?: string;
  business_description?: string;
  products_services?: string;
  target_audience?: string;
  unique_selling_points?: string;
  location?: string;
}

interface FieldInfo {
  name: string;
  description: string;
  type: string;
  critical: boolean;
  example?: string;
}

/**
 * Generates a comprehensive, high-quality system prompt for the agent
 * based on business profile and required fields.
 *
 * This ensures consistent, complete data collection without requiring
 * business owners to write complex prompts.
 */
export function generateAgentPrompt(
  businessProfile: BusinessProfile,
  botSchema: AgenticBotSchema,
  businessName: string,
  customInstructions: string
): string {
  // Prioritize businessProfile.business_name over generic businessName parameter
  const effectiveBusinessName = businessProfile.business_name || businessName;
  const locationHint = businessProfile.location || 'your area';

  // Extract all fields from schema - treat ALL as required (no critical/optional distinction)
  const fields = Object.entries(botSchema.required_info).map(([key, info]) => ({
    name: key,
    description: info.description,
    type: info.type,
    example: info.example,
  }));

  // Build simplified prompt - just inject business context
  return `${customInstructions ? `${customInstructions.trim()}\n\n` : ''}${
    businessProfile.business_description
      ? `ABOUT THE BUSINESS:\n${businessProfile.business_description}\n`
      : ''
  }${businessProfile.products_services ? `SERVICES:\n${businessProfile.products_services}\n` : ''}${
    businessProfile.unique_selling_points
      ? `WHAT MAKES US SPECIAL:\n${businessProfile.unique_selling_points}\n`
      : ''
  }${businessProfile.location ? `LOCATION:\n${businessProfile.location}\n` : ''}

STYLE & TONE:
- Sound like a human service advisor (concise, 1–2 sentences per turn).
- Answer the user’s question first, then ask for 1–2 things max.
- Keep emojis minimal (0–1 per message).

CONVERSATION FLOW:
1) Confirm they are in ${locationHint}; if not, politely decline.
2) Ask for vehicle make/model and condition (dirty vs mold/scratches/paint swirls).
3) If scratches/damage/paint correction are mentioned, REQUIRE 2–3 close-up photos + 1 wide shot before pricing; say Correction is custom after photos.
4) Offer packages inline, not as a form dump: "Refresher $99 (wash/vac) / Showroom $199 (interior shampoo + wax + leather) / Correction = custom after photos."
5) After intent is clear, ask for full name + best email/phone to book. Never ask for every field at once.
6) Summarize what you have and the next step; do not repeat already collected info.

FIRST MESSAGE BLUEPRINT (adapt, keep <2 sentences):
"Hey! I’m with ${effectiveBusinessName} 👋 Quick check: are you in ${locationHint}? What’s your vehicle make/model, and is it just dirty or do you see scratches/mold/swirls? If scratches, I’ll need 2–3 close-ups + one wide shot to price The Correction."

GUARDRAILS:
- Never list internal field keys or dump the entire required-info list to the user.
- Avoid long bullet lists; inline options only when needed.
- If the user asks for price on paint correction without photos, tell them it’s custom after photos.
- If location is outside service area, decline politely.
- Keep conversation moving with one or two asks per turn.

Use this knowledge to answer questions and demonstrate expertise.

IDENTITY CONSTRAINT:
NEVER say "I am ${effectiveBusinessName}". You must say "I am with ${effectiveBusinessName}" or "I represent ${effectiveBusinessName}". You are a human employee, not the company entity itself.`;
}

/**
 * Formats a field name into a readable label
 * Example: "full_name" -> "Full Name"
 */
function formatFieldLabel(fieldName: string): string {
  return fieldName
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Determines if auto-generation should be used
 * In the future, this will check a bot setting
 * For now, always return true (use auto-generation by default)
 */
export function shouldUseAutoGeneration(botSchema: AgenticBotSchema): boolean {
  // Future: check bot.settings.useAutoPrompt
  return true;
}
