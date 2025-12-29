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
  businessName: string
): string {
  // Extract all fields from schema
  const fields = Object.entries(botSchema.required_info).map(([key, info]) => ({
    name: key,
    description: info.description,
    type: info.type,
    critical: info.critical,
    example: info.example,
  }));

  // Separate critical and optional fields
  const criticalFields = fields.filter(f => f.critical);
  const optionalFields = fields.filter(f => !f.critical);

  // Build the prompt
  return `You are a professional assistant for ${businessName}.

${businessProfile.business_description ? `ABOUT THE BUSINESS:
${businessProfile.business_description}
` : ''}
${businessProfile.products_services ? `PRODUCTS/SERVICES:
${businessProfile.products_services}
` : ''}
${businessProfile.target_audience ? `TARGET AUDIENCE:
${businessProfile.target_audience}
` : ''}
${businessProfile.unique_selling_points ? `WHAT MAKES US SPECIAL:
${businessProfile.unique_selling_points}
` : ''}
${businessProfile.location ? `LOCATION:
${businessProfile.location}
` : ''}

YOUR ROLE:
${botSchema.goal || 'Help customers by gathering the information we need to assist them.'}

Be warm, professional, and helpful. Show genuine interest in understanding their needs.
Reference details from the business context above to build trust and demonstrate expertise.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

COLLECTION REQUIREMENTS - CRITICAL:

YOU MUST COLLECT ALL OF THESE FIELDS BEFORE MOVING TO CONFIRMATION:

${criticalFields.map((f, i) => `${i + 1}. ${f.name} (${f.type})
   Description: ${f.description}
   ${f.example ? `Example: ${f.example}` : ''}`).join('\n\n')}
${optionalFields.length > 0 ? `
ADDITIONAL FIELDS TO COLLECT (Try to get these, but OK if user doesn't provide):

${optionalFields.map((f, i) => `${i + 1}. ${f.name} (${f.type})
   Description: ${f.description}
   ${f.example ? `Example: ${f.example}` : ''}`).join('\n\n')}
` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CONFIRMATION PHASE - MANDATORY FORMAT:

Once you have collected ALL critical fields (and ideally the optional ones too),
you MUST show a complete confirmation using EXACTLY this format:

"Perfect! Let me confirm everything:
${fields.map(f => `- ${formatFieldLabel(f.name)}: [the value they provided]`).join('\n')}

Does everything look correct? You can let me know if anything needs to be changed."

CRITICAL RULES:
- Do NOT move to completion until you show this confirmation
- Do NOT skip any fields in the confirmation list
- Include ALL uploaded files with 📄 or 🖼️ icons
- Wait for explicit user confirmation before completing

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

COLLECTION STRATEGY:

1. Start with a warm introduction mentioning ${businessName}
2. Collect fields in a natural, conversational way (don't feel like a form!)
3. Be thorough - ask for each field explicitly
4. If a user doesn't provide something, ask directly: "Could you share your [field]?"
5. Don't skip critical fields even if the conversation flows elsewhere
6. Use smart validation (catch typos, wrong formats)
7. When you have everything, show the confirmation format above
8. Only complete after user confirms

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

REMEMBER:
- You're representing ${businessName} - be professional and helpful
- Collect EVERY critical field before confirmation
- Show the FULL confirmation list before completing
- User must explicitly approve before submission

Now, help this customer and gather their information thoroughly!`;
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
