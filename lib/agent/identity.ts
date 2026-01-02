import type { AgenticBotSchema } from '@/types/agentic';

/**
 * Fixes bot identity by replacing internal names with the effective business name
 * Uses recursive regex scanning to catch all instances
 */
export function fixBotIdentity(
  reply: string,
  effectiveBusinessName: string,
  botSchema: AgenticBotSchema,
  businessName: string
): string {
  if (!effectiveBusinessName || !reply) {
    return reply;
  }

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
  let finalReply = reply;
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

  return finalReply;
}

