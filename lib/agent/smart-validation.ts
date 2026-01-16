import type { AgenticBotSchema, ConversationState } from '@/types/agentic';

interface ValidationResult {
  isValid: boolean;
  correctedPhase: ConversationState['phase'];
  shouldShowConfirmation: boolean;
  confirmationList?: string;
  issues: string[];
}

/**
 * Smart validation using logic instead of post-processing hacks
 * This will eventually replace the guardrails system
 */
export function validateConversationPhase(
  proposedPhase: ConversationState['phase'],
  currentPhase: ConversationState['phase'],
  gatheredInfo: Record<string, string>,
  botSchema: AgenticBotSchema,
  lastUserMessage: string,
  lastBotMessage: string
): ValidationResult {
  const issues: string[] = [];
  let correctedPhase = proposedPhase;
  let shouldShowConfirmation = false;
  let confirmationList: string | undefined;

  // Get required fields
  const allRequiredKeys = Object.keys(botSchema.required_info);
  const criticalKeys = allRequiredKeys.filter(key => botSchema.required_info[key].critical);
  const gatheredKeys = Object.keys(gatheredInfo);

  const missingCritical = criticalKeys.filter(key => !gatheredKeys.includes(key));
  const missingAll = allRequiredKeys.filter(key => !gatheredKeys.includes(key));

  console.log('🔍 Smart Validation:', {
    proposedPhase,
    currentPhase,
    missingCritical: missingCritical.length,
    missingAll: missingAll.length
  });

  // RULE 1: Can't confirm if critical information is missing
  if (proposedPhase === 'confirmation' && missingCritical.length > 0) {
    issues.push(`Cannot enter confirmation - missing critical fields: ${missingCritical.join(', ')}`);
    correctedPhase = 'collecting';
    console.log('❌ Validation failed: Critical info missing');
  }

  // RULE 3: Detect "yes-man" during validation (not confirmation) - CHECK THIS FIRST!
  const userSaidYes = /^(yes|yeah|yep|yup|correct|right|sure)$/i.test(lastUserMessage.trim());
  const lastBotLower = lastBotMessage.toLowerCase();
  const isValidationQuestion = lastBotLower.includes('did you mean') ||
                                 lastBotLower.includes('is that correct') ||
                                 (lastBotLower.includes('right?') && !hasConfirmationList(lastBotMessage));

  if (userSaidYes && isValidationQuestion && proposedPhase === 'completed') {
    issues.push('Prevented yes-man completion during validation question');
    correctedPhase = 'collecting';
    console.log('❌ Prevented yes-man behavior');
    return {
      isValid: false,
      correctedPhase,
      shouldShowConfirmation: false,
      issues
    };
  }

  // RULE 2: Can't complete without going through confirmation first
  if (proposedPhase === 'completed' && currentPhase !== 'confirmation') {
    issues.push('Cannot complete without showing confirmation first');

    // If all info is gathered, show confirmation
    if (missingCritical.length === 0) {
      correctedPhase = 'confirmation';
      shouldShowConfirmation = true;
      confirmationList = buildConfirmationList(gatheredInfo, botSchema);
      console.log('🔄 Redirecting to confirmation phase');
    } else {
      correctedPhase = 'collecting';
      console.log('❌ Validation failed: Cannot complete, still missing critical info');
    }
  }

  // RULE 4: If proposing confirmation, ensure there's a confirmation list in the reply
  if (proposedPhase === 'confirmation') {
    const hasProperList = hasConfirmationList(lastBotMessage);

    if (!hasProperList) {
      issues.push('Confirmation phase requires bulleted list');
      shouldShowConfirmation = true;
      confirmationList = buildConfirmationList(gatheredInfo, botSchema);
      console.log('⚠️ Confirmation needs list, will generate');
    } else {
      console.log('✅ Confirmation list already present');
    }
  }

  // RULE 5: Can complete from confirmation if user confirmed
  const userConfirmed = /^(yes|yeah|yep|looks good|correct|that'?s right|all good|perfect)$/i.test(lastUserMessage.trim());

  if (proposedPhase === 'completed' && currentPhase === 'confirmation' && userConfirmed) {
    console.log('✅ Valid completion: User confirmed from confirmation phase');
    // Allow completion
  }

  return {
    isValid: issues.length === 0,
    correctedPhase,
    shouldShowConfirmation,
    confirmationList,
    issues
  };
}

/**
 * Check if a message contains a proper confirmation list
 */
function hasConfirmationList(message: string): boolean {
  const bulletCount = (message.match(/[-•]\s/g) || []).length;
  const hasConfirmLanguage = message.toLowerCase().includes('confirm') ||
                               message.toLowerCase().includes('does everything look') ||
                               message.toLowerCase().includes('is everything correct');

  // At least 1 bullet point (can be just 1 field) AND confirmation language
  return bulletCount >= 1 && hasConfirmLanguage;
}

/**
 * Build a proper confirmation list from gathered information
 */
function buildConfirmationList(
  gatheredInfo: Record<string, string>,
  botSchema: AgenticBotSchema
): string {
  const lines: string[] = ['Let me confirm everything:'];

  Object.entries(gatheredInfo).forEach(([key, value]) => {
    const fieldInfo = botSchema.required_info[key];
    const label = fieldInfo?.description || formatFieldName(key);
    lines.push(`- ${label}: ${value}`);
  });

  lines.push('');
  lines.push('Does everything look correct?');

  return lines.join('\n');
}

/**
 * Format a field name from snake_case to Title Case
 */
function formatFieldName(key: string): string {
  return key
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
