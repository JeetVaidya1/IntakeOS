import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabase } from '@/lib/supabase';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { description } = await request.json();

    console.log('📝 Received description:', description);

    // Step 1: Use AI to extract fields from description
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an intake form analyzer. Extract structured fields from a business description.

Output valid JSON only with this structure:
{
  "businessName": "extracted or generic name",
  "fields": [
    {
      "id": "unique_snake_case_id",
      "type": "text|email|phone|address|number|select|date|file_upload",
      "label": "User-friendly label",
      "required": true|false,
      "placeholder": "example input",
      "options": ["option1", "option2"]
    }
  ]
}

Field type rules:
- Use "email" for email addresses
- Use "phone" for phone numbers  
- Use "address" for locations/addresses
- Use "number" for quantities (lawn size, budget)
- Use "select" for predefined choices (add options array)
- Use "date" for scheduling/dates
- Use "file_upload" when photos/documents mentioned
- Use "text" for everything else

Extract 5-8 fields maximum. Include only essential information.
Always include: name, email or phone, and at least one field specific to their business.`,
        },
        {
          role: 'user',
          content: description,
        },
      ],
      temperature: 0.3,
    });

    const aiResponse = completion.choices[0].message.content;
    if (!aiResponse) {
      throw new Error('No AI response');
    }

    console.log('🤖 AI Response:', aiResponse);

    // Parse AI response
    const schema = JSON.parse(aiResponse);

    // Step 2: Generate unique slug
    const slug = generateSlug(schema.businessName);

    console.log('🔗 Generated slug:', slug);

    // Step 3: Save to database
    const { data: bot, error } = await supabase
      .from('bots')
      .insert({
        slug,
        name: schema.businessName,
        description,
        schema: schema.fields,
        user_id: null, // We'll add auth later
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase error:', error);
      throw error;
    }

    console.log('✅ Bot created:', bot);

    return NextResponse.json({
      success: true,
      botId: bot.id,
      slug: bot.slug,
      schema: schema.fields,
    });

  } catch (error) {
    console.error('❌ Error generating bot:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate bot',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

function generateSlug(businessName: string): string {
  const base = businessName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 30); // Limit length

  // Add random suffix to ensure uniqueness
  const suffix = Math.random().toString(36).substring(2, 6);
  return `${base}-${suffix}`;
}