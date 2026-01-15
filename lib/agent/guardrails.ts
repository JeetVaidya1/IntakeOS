import type { AgenticBotSchema, ConversationState } from '@/types/agentic';

interface ParsedAgentDecision {
  reply?: string;
  extracted_information?: Record<string, string>;
  updated_phase?: string;
  current_topic?: string | null;
  reasoning?: string;
}

/**
 * Enforces guardrails on the agent's phase transitions and decisions
 */
export function enforceGuardrails(
  parsed: ParsedAgentDecision,
  currentState: ConversationState,
  messages: Array<{ role: string; content: string }>,
  botSchema: AgenticBotSchema,
  updatedGatheredInfo: Record<string, string>,
  allRequiredKeys: string[]
): { finalPhase: string; enforcementApplied: boolean } {
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
  // BUT: Skip this for service mismatches (they should exit immediately)
  const isServiceMismatch = (parsed as any).service_mismatch === true;
  
  if (parsed.updated_phase === 'completed' && !isServiceMismatch) {
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
  } else if (isServiceMismatch) {
    console.log('✅ SERVICE MISMATCH: Allowing immediate completion without confirmation');
  }

  // Recalculate missing info after extraction (needed for enforcement rules)
  const newGatheredKeys = Object.keys(updatedGatheredInfo);
  const newMissingInfo = allRequiredKeys.filter(key => !newGatheredKeys.includes(key));
  const newCriticalMissing = newMissingInfo.filter(key => botSchema.required_info[key].critical);

  // ENFORCEMENT LOGIC - Prevent premature completion
  let finalPhase: ConversationState['phase'] = (parsed.updated_phase || currentState.phase) as ConversationState['phase'];
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
    const hasConfirmationList = parsed.reply?.includes(':') &&
                                (parsed.reply?.toLowerCase().includes('confirm') ||
                                 parsed.reply?.toLowerCase().includes('correct'));

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

  return { 
    finalPhase, 
    enforcementApplied 
  };
}

