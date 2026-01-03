import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import OpenAI from 'openai';
import { buildBotGenerationPrompt } from '@/lib/bot-generation/prompt-template';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate a URL-safe slug from a bot name
 */
function generateSlug(businessName: string): string {
  const base = businessName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 30);

  const suffix = Math.random().toString(36).substring(2, 6);
  return `${base}-${suffix}`;
}

export async function POST(request: Request) {
  try {
    const { description, previewOnly } = await request.json();

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

    // Fetch user's business profile with all enhanced fields
    const { data: businessProfile, error: profileError} = await supabase
      .from('business_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profileError || !businessProfile) {
      return NextResponse.json(
        { error: 'Please set up your business profile in Settings first' },
        { status: 400 }
      );
    }

    console.log('🏢 Business Profile:', businessProfile);

    // Step 1: Generate Agentic Bot Schema using AI
    const systemPrompt = buildBotGenerationPrompt(businessProfile);
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-5-mini',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: description,
        },
      ],
      reasoning_effort: 'medium',
      response_format: { type: "json_object" },
    });

    const aiResponse = completion.choices[0].message.content;
    if (!aiResponse) throw new Error('No AI response');

    console.log('🤖 AI Response:', aiResponse);

    const parsedResponse = JSON.parse(aiResponse);
    const botTaskName = parsedResponse.botTaskName || 'Intake Bot';
    const slug = generateSlug(botTaskName);

    // Build the Agentic Schema
    const agenticSchema = {
      goal: parsedResponse.goal,
      system_prompt: parsedResponse.system_prompt,
      required_info: parsedResponse.required_info,
      schema_version: 'agentic_v1'
    };

    console.log('🔗 Generated slug:', slug);
    console.log('📝 Bot Task Name:', botTaskName);
    console.log('🧠 Agentic Schema:', JSON.stringify(agenticSchema, null, 2));

    // If preview only, return the schema without saving
    if (previewOnly) {
      console.log('👁️ Preview mode - returning schema without saving');
      return NextResponse.json({
        success: true,
        botTaskName,
        schema: agenticSchema,
        isAgentic: true,
      });
    }

    // Save to database with AGENTIC schema
    const { data: bot, error } = await supabase
      .from('bots')
      .insert({
        slug,
        name: botTaskName,
        description,
        schema: agenticSchema, // NEW: Storing agentic schema instead of field array
        user_id: user.id,
        notification_email: user.email,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase error:', error);
      throw error;
    }

    console.log('✅ Agentic Bot created:', bot);

    return NextResponse.json({
      success: true,
      botId: bot.id,
      slug: bot.slug,
      schema: agenticSchema,
      isAgentic: true,
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
