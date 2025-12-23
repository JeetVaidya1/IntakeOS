import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { businessName, field, previousAnswer, conversationHistory, isFirstQuestion } = await request.json();

    // 1. Check if the user's last input was an image
    const isImageResponse = previousAnswer?.startsWith('[IMAGE] ');
    let userContent: any = conversationHistory;

    // 2. If it is an image, format the message for GPT-4 Vision
    if (isImageResponse) {
      const imageUrl = previousAnswer.replace('[IMAGE] ', '');
      userContent = [
        { 
          type: "text", 
          text: `The user just uploaded an image as their answer. 
                 Previous conversation history: \n${conversationHistory}` 
        },
        { 
          type: "image_url", 
          image_url: { 
            url: imageUrl,
            detail: "low" // 'low' is faster/cheaper, 'high' is better for detailed inspections
          } 
        }
      ];
    }

    // 3. Generate the response
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // gpt-4o-mini supports Vision natively
      messages: [
        {
          role: 'system',
          content: `You are an AI intake assistant for ${businessName}. 
Your goal is to ask the next question in the intake form.

Current Field to collect: "${field.label}" (Type: ${field.type})
Context: The user just answered the previous question.

Instructions:
1. Acknowledge the user's previous answer politely.
2. If the previous answer was an image, COMMENT ON IT specifically. (e.g., "That leak looks severe" or "Those flowers are beautiful").
3. Then, ask for the "${field.label}".
4. Keep it short, professional, and conversational.
5. Do NOT output JSON. Just output the text of the question.`,
        },
        {
          role: 'user',
          content: userContent,
        },
      ],
      temperature: 0.7,
    });

    const question = completion.choices[0].message.content;

    return NextResponse.json({ question });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate question' },
      { status: 500 }
    );
  }
}