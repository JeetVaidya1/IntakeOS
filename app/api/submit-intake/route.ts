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

    // 2. Fetch the bot owner's email
    // We need to join the 'bots' table to get the user_id, then get the email.
    // Ideally, you would store the owner's email on the bot record or fetch it from auth.users.
    // For this MVP, we'll fetch the bot details first to find the owner.
    
    // NOTE: In a real production app with Supabase Auth, you can't easily query 'auth.users' 
    // from here without admin privileges. 
    // FOR NOW: We will send the email to YOU (the admin) or a hardcoded address for testing.
    // LATER: We will add an 'notification_email' column to the 'bots' table.

    const ownerEmail = 'vaidyajeet4@gmail.com'; // REPLACE THIS with your email for testing!

    // 3. Send Email Notification
    try {
      await resend.emails.send({
        from: 'IntakeOS Notifications <onboarding@resend.dev>', // Use resend.dev for testing
        to: ownerEmail, 
        subject: `New Lead: Submission #${submission.id.slice(0, 8)}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #4F46E5;">New Lead Received! 🚀</h1>
            <p>You have a new submission from your IntakeOS bot.</p>
            
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