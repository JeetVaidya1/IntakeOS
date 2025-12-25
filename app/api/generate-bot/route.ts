import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { description } = await request.json();

    console.log('📝 Received description:', description);

    // Get authenticated user from cookies
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: () => {},
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Step 1: Use AI to extract fields
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
- Use "number" for quantities
- Use "select" for predefined choices
- Use "date" for scheduling
- Use "file_upload" when photos mentioned
- Use "text" for everything else

Extract 5-8 fields maximum.`,
        },
        {
          role: 'user',
          content: description,
        },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }, // Enforce valid JSON output
    });

    const aiResponse = completion.choices[0].message.content;
    if (!aiResponse) throw new Error('No AI response');

    console.log('🤖 AI Response:', aiResponse);

    const schema = JSON.parse(aiResponse);
    const slug = generateSlug(schema.businessName);

    console.log('🔗 Generated slug:', slug);

    // Save to database with user_id and notification_email
    const { data: bot, error } = await supabase
      .from('bots')
      .insert({
        slug,
        name: schema.businessName,
        description,
        schema: schema.fields,
        user_id: user.id,
        notification_email: user.email,
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
    console.error('❌ Error:', error);
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
    .substring(0, 30);

  const suffix = Math.random().toString(36).substring(2, 6);
  return `${base}-${suffix}`;
}