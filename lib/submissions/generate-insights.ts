import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface AIInsights {
  summary: string;
  sentiment: 'Positive' | 'Neutral' | 'Frustrated';
  urgency: 'Low' | 'Medium' | 'High';
}

/**
 * Generate AI-powered insights for a submission
 */
export async function generateSubmissionInsights(
  conversation: any,
  data: Record<string, any>
): Promise<AIInsights | null> {
  try {
    console.log('🤖 Generating Stellar Snapshot with AI...');

    const aiPrompt = `You are a professional sales assistant analyzing a customer submission. Based on the conversation history and submitted data below, provide a JSON analysis.

**Conversation History:**
${JSON.stringify(conversation, null, 2)}

**Submitted Data:**
${JSON.stringify(data, null, 2)}

Analyze this submission and return ONLY a valid JSON object (no markdown, no code blocks) with:
- "summary": A 2-3 sentence executive snapshot for the business owner highlighting key information and customer needs
- "sentiment": One of "Positive", "Neutral", or "Frustrated" based on the customer's tone
- "urgency": One of "Low", "Medium", or "High" based on:
  * High: Safety issues, technical failures, strict/immediate timelines, emergency situations
  * Medium: Time-sensitive requests, important concerns, business-critical needs
  * Low: General inquiries, routine requests, flexible timelines

Return only the JSON object.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-5-nano',
      messages: [
        { role: 'system', content: 'You are a professional sales assistant. Always respond with valid JSON only.' },
        { role: 'user', content: aiPrompt }
      ],
      max_completion_tokens: 500,
    });

    const aiResponse = completion.choices[0].message.content?.trim();
    if (aiResponse) {
      const insights = JSON.parse(aiResponse) as AIInsights;
      console.log('✨ AI Insights generated:', insights);
      return insights;
    }

    return null;
  } catch (aiError) {
    console.error('⚠️ AI analysis failed:', aiError);
    return null;
  }
}

