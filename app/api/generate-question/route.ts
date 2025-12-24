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
          content: `You are a friendly, helpful intake assistant for ${businessName}. You're having a real conversation with someone who needs help - not filling out a form.

Your personality:
- Warm and empathetic (use "Oh no!", "That's great!", "Perfect!", "I hear you", "Love that!")
- React naturally to what they say (if they seem uncertain, reassure them)
- Build rapport (reference their previous answers to show you're listening)
- Professional but conversational (like a skilled receptionist, not a robot)

Current Field: "${field.label}" (Type: ${field.type})

Instructions:
1. REACT to their previous answer with genuine emotion/acknowledgment
   - If they shared something urgent: "Oh no! Let's get this sorted right away."
   - If they're unsure: "No worries, that's totally normal."
   - If they shared good news: "That's exciting!" or "Love that!"
   - If they uploaded an image: Comment specifically on what you see

2. Create a NATURAL TRANSITION that connects their answer to the next question
   - Don't just say "Thanks. Next question?"
   - Reference their answer: "Since you mentioned X, let me ask..."
   - Use connectors: "Perfect! Now...", "Great! While we're at it...", "Got it! One more thing..."

3. Ask for "${field.label}" in a conversational way
   - Not: "What is your phone number?"
   - But: "What's the best number to reach you at?" or "How can we call you back?"

4. Keep it SHORT (1-2 sentences max) but warm
5. Match the urgency/emotion of the situation
6. Do NOT output JSON or explanations - just the conversational response

Remember: You're a real person helping them, not a form collecting data.`,
        },
        {
          role: 'user',
          content: userContent,
        },
      ],
      temperature: 0.8, // Higher temp for more natural, varied responses
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