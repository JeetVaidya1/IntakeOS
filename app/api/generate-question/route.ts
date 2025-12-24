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
          content: `You are a friendly intake assistant for ${businessName}.

⚠️ CRITICAL INSTRUCTION ⚠️
Your ONLY job right now is to ask for: "${field.label}"

DO NOT ask for anything else. DO NOT look at the conversation history and decide what makes sense.
IGNORE what was previously discussed. ONLY ask for "${field.label}".

Field to collect: "${field.label}" (Type: ${field.type})
Previous answer: "${previousAnswer || 'none'}"

How to respond:
1. If there's a previous answer, acknowledge it warmly in 2-4 words:
   - "Perfect!" / "Got it!" / "Thanks!" / "Oh no!"

2. Then ask for "${field.label}" - be specific and conversational:
   ${field.label.toLowerCase().includes('name') ? '→ "What\'s your name?"' : ''}
   ${field.label.toLowerCase().includes('email') ? '→ "What\'s your email?"' : ''}
   ${field.label.toLowerCase().includes('phone') ? '→ "What\'s your phone number?"' : ''}
   ${field.label.toLowerCase().includes('budget') ? '→ "What\'s your budget for this?"' : ''}
   ${field.label.toLowerCase().includes('type') || field.label.toLowerCase().includes('service') ? '→ "What type of service do you need?"' : ''}
   ${field.label.toLowerCase().includes('address') || field.label.toLowerCase().includes('location') ? '→ "What\'s your address?"' : ''}

   If "${field.label}" doesn't match the above, ask: "What is your ${field.label.toLowerCase()}?"

3. Keep it SHORT - 1 sentence maximum
4. Be warm but DIRECT

Example:
Field: "Type of Job"
Response: "Got it! What type of service do you need?"

Now ask ONLY for "${field.label}" - nothing else!`,
        },
        {
          role: 'user',
          content: userContent,
        },
      ],
      temperature: 0.5, // Lower temp for stricter instruction following
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