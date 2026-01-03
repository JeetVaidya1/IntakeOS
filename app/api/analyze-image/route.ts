import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { imageUrl, businessName, fieldLabel, conversationHistory } = await request.json();

    console.log('🖼️  Analyzing image:', imageUrl);

    // Use GPT-5 Vision to analyze the image
    const completion = await openai.chat.completions.create({
      model: 'gpt-5-nano',
      messages: [
        {
          role: 'system',
          content: `You are a visual triage expert for ${businessName}. Analyze uploaded images like an experienced professional in the relevant industry.

Your job is to:
1. **Identify what's in the image** (e.g., water damage, equipment, venue, product, etc.)
2. **Assess urgency or severity** if relevant (e.g., "Is this leaking right now?", "How long has this been happening?")
3. **Ask intelligent follow-up questions** based on what you see
4. **Show domain expertise** by noticing details a professional would catch

Context from conversation:
${conversationHistory || 'Just started'}

Current field: "${fieldLabel}"

Examples of great visual triage:
- Leaky pipe photo → "I can see water damage on the ceiling. Is this actively leaking right now, or has it stopped?"
- Wedding venue photo → "Beautiful space! I notice it's outdoors - do you have a backup plan for weather?"
- Equipment photo → "That looks like industrial HVAC equipment. Is this for replacement or repair?"
- Injury photo → "I can see swelling - when did this happen? Has it gotten worse?"
- Product damage → "That damage looks fresh - did this happen during shipping or was it already damaged?"

Generate a response that:
1. Acknowledges what you see in the image with professional insight
2. Asks 1-2 intelligent follow-up questions to gather critical information
3. Shows you understand the context (construction, legal, medical, creative, etc.)
4. Keeps it conversational and empathetic

Be brief (2-3 sentences max) but insightful.`,
        },
        {
          role: 'user',
          content: [
            {
              type: "text",
              text: `The user just uploaded an image for "${fieldLabel}". Analyze it and ask intelligent follow-up questions.`
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
                detail: "high" // Use high detail for better analysis
              }
            }
          ]
        },
      ],
    });

    const analysis = completion.choices[0].message.content;

    console.log('✅ Image analysis:', analysis);

    return NextResponse.json({
      success: true,
      analysis,
      imageUrl
    });

  } catch (error) {
    console.error('❌ Image analysis error:', error);
    return NextResponse.json(
      {
        error: 'Failed to analyze image',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
