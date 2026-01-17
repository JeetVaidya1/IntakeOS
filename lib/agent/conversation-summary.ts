import OpenAI from 'openai';

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

interface SummarizationResult {
  shouldSummarize: boolean;
  summarizedMessages?: Array<{ role: string; content: string }>;
  recentMessages?: Array<{ role: string; content: string }>;
}

/**
 * Summarize long conversations to reduce token usage while preserving context
 *
 * Strategy:
 * - Keep last 10 messages verbatim (recent context is most important)
 * - Summarize older messages into a condensed system message
 * - Preserve all gathered information in the summary
 */
export async function summarizeConversation(
  messages: Array<{ role: string; content: string }>,
  gatheredInfo: Record<string, string>,
  threshold: number = 20
): Promise<SummarizationResult> {
  // Don't summarize if conversation is short
  if (messages.length < threshold) {
    return {
      shouldSummarize: false
    };
  }

  console.log(`📚 Conversation has ${messages.length} messages, summarizing...`);

  // Split messages: old ones to summarize, recent ones to keep
  const recentMessages = messages.slice(-10);
  const oldMessages = messages.slice(0, -10);

  try {
    const openai = getOpenAIClient();
    const summaryResponse = await openai.chat.completions.create({
      model: 'gpt-5-mini', // Use mini for summarization (better at this task)
      messages: [
        {
          role: 'user',
          content: `Summarize this conversation history concisely while preserving all important context and information gathered.

Conversation to summarize:
${oldMessages.map(m => `${m.role}: ${m.content}`).join('\n')}

Information gathered so far:
${JSON.stringify(gatheredInfo, null, 2)}

Provide a 2-3 paragraph summary that captures:
1. What the user initially requested
2. Key topics discussed
3. Any important context or details mentioned
4. The conversation flow and progression

Be concise but preserve all critical information.`
        }
      ],
      max_completion_tokens: 500,
      temperature: 0.3 // Lower temperature for more focused summaries
    });

    const summary = summaryResponse.choices[0].message.content || '';

    // Create new message array with summary + recent messages
    const summarizedMessages = [
      {
        role: 'system',
        content: `Previous conversation summary (${oldMessages.length} messages):\n\n${summary}\n\nThe conversation continues below with recent messages.`
      },
      ...recentMessages
    ];

    console.log(`✅ Summarized ${oldMessages.length} messages into ${summary.length} characters`);

    return {
      shouldSummarize: true,
      summarizedMessages,
      recentMessages
    };

  } catch (error) {
    console.error('❌ Summarization failed:', error);
    // Return original messages on error
    return {
      shouldSummarize: false
    };
  }
}

/**
 * Estimate token count for messages (rough approximation)
 */
export function estimateTokenCount(messages: Array<{ role: string; content: string }>): number {
  const totalChars = messages.reduce((sum, m) => sum + m.content.length, 0);
  // Rough estimate: 1 token ≈ 4 characters
  return Math.ceil(totalChars / 4);
}
