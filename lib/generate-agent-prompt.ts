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

  // Extract all fields from schema - treat ALL as required (no critical/optional distinction)
  const fields = Object.entries(botSchema.required_info).map(([key, info]) => ({
    name: key,
    description: info.description,
    type: info.type,
    example: info.example,
  }));

  // Build simplified prompt - just inject business context
  return `${customInstructions ? `${customInstructions}\n\n` : ''}${businessProfile.business_description ? `ABOUT THE BUSINESS:
${businessProfile.business_description}
` : ''}${businessProfile.products_services ? `SERVICES:
${businessProfile.products_services}
` : ''}${businessProfile.unique_selling_points ? `WHAT MAKES US SPECIAL:
${businessProfile.unique_selling_points}
` : ''}${businessProfile.location ? `LOCATION:
${businessProfile.location}
` : ''}

Use this knowledge to answer questions and demonstrate expertise.`;
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
