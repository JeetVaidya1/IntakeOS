import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export async function POST(request: Request) {
  try {
    const { botTaskName, description, schema } = await request.json();

    console.log('📝 Finalizing bot:', botTaskName);

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

    // Generate slug from bot name
    const slug = generateSlug(botTaskName);

    console.log('🔗 Generated slug:', slug);
    console.log('🧠 Final Schema:', JSON.stringify(schema, null, 2));

    // Save to database with reviewed schema
    const { data: bot, error } = await supabase
      .from('bots')
      .insert({
        slug,
        name: botTaskName,
        description,
        schema,
        user_id: user.id,
        notification_email: user.email,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase error:', error);
      throw error;
    }

    console.log('✅ Bot finalized and created:', bot);

    return NextResponse.json({
      success: true,
      botId: bot.id,
      slug: bot.slug,
      isAgentic: true,
    });

  } catch (error) {
    console.error('❌ Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to finalize bot',
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
