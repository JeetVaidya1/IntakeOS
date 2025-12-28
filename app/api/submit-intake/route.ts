import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { isAgenticSchema, isLegacySchema } from '@/types/agentic';

// Initialize Resend with your API key
const resend = new Resend(process.env.RESEND_API_KEY);

// Helper function to get field label from schema
function getFieldLabel(key: string, schema: any): string {
  if (isLegacySchema(schema)) {
    const field = schema.find((f: any) => f.id === key);
    return field?.label || formatKey(key);
  }
  if (isAgenticSchema(schema)) {
    const info = schema.required_info[key];
    return info?.description || formatKey(key);
  }
  return formatKey(key);
}

// Helper to format keys as fallback (snake_case -> Title Case)
function formatKey(key: string): string {
  return key
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

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
    const { botId, data, conversation, uploadedFiles } = await request.json();

    console.log('📥 Receiving submission for bot:', botId);
    console.log('📎 Uploaded files:', uploadedFiles?.length || 0);

    // 1. Save submission to database
    const { data: submission, error } = await supabase
      .from('submissions')
      .insert({
        bot_id: botId,
        data: data,
        conversation: conversation,
        uploaded_files: uploadedFiles || [],
        status: 'new',
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Database error:', error);
      throw error;
    }

    console.log('✅ Submission saved:', submission.id);

    // 2. Fetch the bot owner's email and schema from the bot record
    const { data: bot, error: botError } = await supabase
      .from('bots')
      .select('notification_email, name, schema')
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
      // Use custom domain if configured, otherwise fall back to test domain
      // NOTE: onboarding@resend.dev can only send to verified emails in your Resend account
      // To send to any email, add your own verified domain in Resend and set RESEND_FROM_EMAIL
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'IntakeOS Notifications <onboarding@resend.dev>';

      await resend.emails.send({
        from: fromEmail,
        to: ownerEmail,
        subject: `New Lead from ${bot.name} - #${submission.id.slice(0, 8)}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #4F46E5;">New Lead Received! 🚀</h1>
            <p>You have a new submission from <strong>${bot.name}</strong>.</p>

            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              ${Object.entries(data).map(([key, value]) => `
                <div style="margin-bottom: 10px;">
                  <strong style="color: #374151;">${getFieldLabel(key, bot.schema)}:</strong>
                  <span style="color: #111827;">${value}</span>
                </div>
              `).join('')}
            </div>

            <p style="color: #6b7280; font-size: 14px;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/submissions/${submission.id}" style="color: #4F46E5; text-decoration: none;">View full conversation in Dashboard →</a>
            </p>
          </div>
        `
      });
      console.log('📧 Email sent successfully');
    } catch (emailError) {
      console.error('⚠️ Failed to send email:', emailError);
      // We don't throw here because we don't want to fail the submission just because email failed
    }

    // 4. Trigger Webhook Integration (if configured)
    try {
      const { data: integration, error: integrationError } = await supabase
        .from('integrations')
        .select('webhook_url, is_active')
        .eq('bot_id', botId)
        .single();

      if (!integrationError && integration && integration.is_active && integration.webhook_url) {
        console.log('🔗 Triggering webhook:', integration.webhook_url);

        // Create fields metadata with labels from schema
        const fieldsMetadata: Record<string, { label: string; value: any }> = {};
        Object.entries(data).forEach(([key, value]) => {
          fieldsMetadata[key] = {
            label: getFieldLabel(key, bot.schema),
            value: value
          };
        });

        const webhookPayload = {
          event: 'submission.created',
          bot_id: botId,
          bot_name: bot.name,
          submission_id: submission.id,
          submitted_at: submission.created_at,
          schema_version: isAgenticSchema(bot.schema) ? 'agentic_v1' : 'legacy',
          conversation: conversation || null, // Include conversation history if available
          fields_metadata: fieldsMetadata, // Field labels + values
          ...data // Spread the actual form fields for easy mapping in Zapier/Make
        };

        // Send webhook asynchronously - don't wait for response
        fetch(integration.webhook_url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'IntakeOS-Webhook/1.0'
          },
          body: JSON.stringify(webhookPayload),
        })
          .then(() => console.log('✅ Webhook triggered successfully'))
          .catch((webhookError) => console.error('⚠️ Webhook failed:', webhookError));
      }
    } catch (webhookError) {
      console.error('⚠️ Failed to process webhook:', webhookError);
      // We don't throw here - webhooks are optional and shouldn't break the submission
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