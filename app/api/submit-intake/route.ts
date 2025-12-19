import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role key to bypass RLS for public submissions
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST(request: Request) {
  try {
    const { botId, data, conversation } = await request.json();

    console.log('📥 Receiving submission for bot:', botId);
    console.log('📋 Data:', data);

    // Save submission to database
    const { data: submission, error } = await supabase
      .from('submissions')
      .insert({
        bot_id: botId,
        data: data,
        conversation: conversation,
        status: 'new',
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Database error:', error);
      throw error;
    }

    console.log('✅ Submission saved:', submission.id);

    return NextResponse.json({
      success: true,
      submissionId: submission.id,
    });

  } catch (error) {
    console.error('❌ Error saving submission:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to save submission' 
      },
      { status: 500 }
    );
  }
}