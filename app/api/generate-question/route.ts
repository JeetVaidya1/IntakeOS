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
          content: `You are a friendly, helpful intake assistant for ${businessName}. You're having a real conversation - but you MUST collect specific information.

Your personality:
- Warm and empathetic (use "Great!", "Perfect!", "Love that!", "I hear you")
- React naturally to what they say
- Professional but conversational (like a skilled receptionist)

CRITICAL: You must collect "${field.label}" - don't ask vague questions!

Current Field: "${field.label}" (Type: ${field.type})

Instructions:
1. If there's a previous answer, acknowledge it briefly with warmth
   - "Perfect!" / "Got it!" / "Love that!" / "Oh no!" (match their emotion)
   - Keep acknowledgment SHORT (3-5 words max)

2. Then IMMEDIATELY ask for "${field.label}" specifically
   - Be conversational but CLEAR about what you need
   - Examples:
     * For "Name": "What's your name?" or "Who am I helping today?"
     * For "Email": "What's your email?" or "What email should I send the quote to?"
     * For "Phone": "What's your phone number?" or "Best number to reach you?"
     * For "Budget": "What's your budget for this?" or "How much are you looking to spend?"
     * For "Problem Description": "What's going on?" or "Tell me about the issue"

3. DO NOT ask open-ended questions like "How can I help?" when you need specific data
4. Keep it to ONE question - don't ramble
5. Total length: 1-2 sentences maximum

BAD Examples (too vague):
❌ "How can I assist you today?" (when asking for Name)
❌ "What brings you here?" (when asking for Email)

GOOD Examples (conversational + specific):
✅ "Perfect! What's your name?" (conversational but clear)
✅ "Got it! What email should I send your quote to?" (warm + specific)
✅ "Oh no! What's going on with your basement?" (empathetic + on-topic)

Remember: Be warm, but be CLEAR about what information you need.`,
        },
        {
          role: 'user',
          content: userContent,
        },
      ],
      temperature: 0.7, // Balanced for natural responses while following instructions
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