import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { businessName, field, previousAnswer, conversationHistory, isFirstQuestion } = await request.json();

    const systemPrompt = `You are a friendly, professional intake assistant for "${businessName}".

Your job is to ask for information in a natural, conversational way.

RULES:
1. Keep questions SHORT (1-2 sentences max)
2. Sound warm and human, not robotic
3. Acknowledge the previous answer naturally
4. Don't repeat information already collected
5. Match the tone to the business type:
   - Landscaping/trades: Casual, friendly ("Hey!", "Awesome!")
   - Professional services: Warm but professional ("Great!", "Thank you")
6. Use emojis sparingly (max 1 per message, and only for casual businesses)
7. Don't ask follow-up questions - just ask for the next field

FIELD TYPES:
- text: Ask naturally for text input
- email: Ask for email address
- phone: Ask for phone number
- address: Ask for location/address
- number: Ask for quantity/measurement
- date: Ask for date/timeframe
- select: Present options clearly
- file_upload: Ask for photos/documents (mention they can type "skip")`;

    const userPrompt = `Previous conversation:
${conversationHistory}

The user just said: "${previousAnswer}"

Now ask for this field:
- Field name: ${field.label}
- Field type: ${field.type}
- Required: ${field.required ? 'yes' : 'no'}
${field.options ? `- Options: ${field.options.join(', ')}` : ''}
${field.placeholder ? `- Example: ${field.placeholder}` : ''}

${isFirstQuestion ? 'This is the FIRST question after the greeting.' : 'Acknowledge their previous answer briefly, then ask the next question.'}

Generate a natural, conversational question:`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 150,
    });

    const question = completion.choices[0].message.content?.trim() || 
                    `What's your ${field.label.toLowerCase()}?`;

    return NextResponse.json({ question });

  } catch (error) {
    console.error('Error generating question:', error);
    return NextResponse.json(
      { error: 'Failed to generate question' },
      { status: 500 }
    );
  }
}