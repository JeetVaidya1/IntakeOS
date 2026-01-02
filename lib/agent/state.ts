import type { AgenticBotSchema, ConversationState } from '@/types/agentic';

/**
 * Updates conversation state by merging extracted information and recalculating missing info
 */
export function updateConversationState(
  currentState: ConversationState,
  extractedInformation: Record<string, string> | undefined,
  allRequiredKeys: string[],
  botSchema: AgenticBotSchema
): {
  updatedGatheredInfo: Record<string, string>;
  newMissingInfo: string[];
  newCriticalMissing: string[];
} {
  // Merge extracted information into gathered_information
  const updatedGatheredInfo = {
    ...currentState.gathered_information,
    ...(extractedInformation || {}),
  };

  // Recalculate missing info after extraction
  const newGatheredKeys = Object.keys(updatedGatheredInfo);
  const newMissingInfo = allRequiredKeys.filter(key => !newGatheredKeys.includes(key));
  const newCriticalMissing = newMissingInfo.filter(key => botSchema.required_info[key].critical);

  return {
    updatedGatheredInfo,
    newMissingInfo,
    newCriticalMissing,
  };
}

