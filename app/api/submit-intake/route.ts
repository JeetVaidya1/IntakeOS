import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

// Initialize Resend with your API key
const resend = new Resend(process.env.RESEND_API_KEY);

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

    // 1. Save submission to database
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

    // 2. Fetch the bot owner's email from the bot record
    const { data: bot, error: botError } = await supabase
      .from('bots')
      .select('notification_email, name')
      .eq('id', botId)
      .single();

    if (botError || !bot || !bot.notification_email) {
      console.error('⚠️ Could not fetch bot notification email:', botError);
      // Still return success since submission was saved
      return NextResponse.json({
        success: true,
        submissionId: submission.id,
      });
    }

    const ownerEmail = bot.notification_email;

    // 3. Send Email Notification
    try {
      await resend.emails.send({
        from: 'IntakeOS Notifications <onboarding@resend.dev>', // Use resend.dev for testing
        to: ownerEmail,
        subject: `New Lead from ${bot.name} - #${submission.id.slice(0, 8)}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #4F46E5;">New Lead Received! 🚀</h1>
            <p>You have a new submission from <strong>${bot.name}</strong>.</p>
            
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              ${Object.entries(data).map(([key, value]) => `
                <div style="margin-bottom: 10px;">
                  <strong style="text-transform: capitalize; color: #374151;">${key.replace(/_/g, ' ')}:</strong>
                  <span style="color: #111827;">${value}</span>
                </div>
              `).join('')}
            </div>

            <p style="color: #6b7280; font-size: 14px;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/submissions/${submission.id}">View full conversation in Dashboard</a>
            </p>
          </div>
        `
      });
      console.log('📧 Email sent successfully');
    } catch (emailError) {
      console.error('⚠️ Failed to send email:', emailError);
      // We don't throw here because we don't want to fail the submission just because email failed
    }

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