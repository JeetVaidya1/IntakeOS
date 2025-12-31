import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { isAgenticSchema, isLegacySchema } from '@/types/agentic';
import OpenAI from 'openai';

// Initialize Resend with your API key
const resend = new Resend(process.env.RESEND_API_KEY);

// Initialize OpenAI for AI analysis
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

    // 2. Generate AI-powered Stellar Snapshot
    let aiInsights: {
      summary: string;
      sentiment: 'Positive' | 'Neutral' | 'Frustrated';
      urgency: 'Low' | 'Medium' | 'High';
    } | null = null;

    try {
      console.log('🤖 Generating Stellar Snapshot with AI...');

      const aiPrompt = `You are a professional sales assistant analyzing a customer submission. Based on the conversation history and submitted data below, provide a JSON analysis.

**Conversation History:**
${JSON.stringify(conversation, null, 2)}

**Submitted Data:**
${JSON.stringify(data, null, 2)}

Analyze this submission and return ONLY a valid JSON object (no markdown, no code blocks) with:
- "summary": A 2-3 sentence executive snapshot for the business owner highlighting key information and customer needs
- "sentiment": One of "Positive", "Neutral", or "Frustrated" based on the customer's tone
- "urgency": One of "Low", "Medium", or "High" based on:
  * High: Safety issues, technical failures, strict/immediate timelines, emergency situations
  * Medium: Time-sensitive requests, important concerns, business-critical needs
  * Low: General inquiries, routine requests, flexible timelines

Return only the JSON object.`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a professional sales assistant. Always respond with valid JSON only.' },
          { role: 'user', content: aiPrompt }
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      const aiResponse = completion.choices[0].message.content?.trim();
      if (aiResponse) {
        // Parse the AI response
        aiInsights = JSON.parse(aiResponse);
        console.log('✨ AI Insights generated:', aiInsights);

        // Update the submission with AI insights
        const { error: updateError } = await supabase
          .from('submissions')
          .update({
            summary: aiInsights.summary,
            sentiment: aiInsights.sentiment,
            urgency: aiInsights.urgency,
          })
          .eq('id', submission.id);

        if (updateError) {
          console.error('⚠️ Failed to update submission with AI insights:', updateError);
        } else {
          console.log('✅ Submission updated with AI insights');
        }
      }
    } catch (aiError) {
      console.error('⚠️ AI analysis failed:', aiError);
      // Continue with submission flow even if AI analysis fails
    }

    // 3. Fetch the bot owner's email and schema from the bot record
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

    // 4. Send Email Notification
    try {
      // Use custom domain if configured, otherwise fall back to test domain
      // NOTE: onboarding@resend.dev can only send to verified emails in your Resend account
      // To send to any email, add your own verified domain in Resend and set RESEND_FROM_EMAIL
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'IntakeOS Notifications <onboarding@resend.dev>';

      // Build Stellar Insights section if available
      const urgencyEmoji = aiInsights?.urgency === 'High' ? '🚨' : aiInsights?.urgency === 'Medium' ? '⚠️' : '✅';
      const urgencyColor = aiInsights?.urgency === 'High' ? '#dc2626' : aiInsights?.urgency === 'Medium' ? '#f59e0b' : '#10b981';
      const sentimentEmoji = aiInsights?.sentiment === 'Positive' ? '😊' : aiInsights?.sentiment === 'Frustrated' ? '😤' : '😐';

      const stellarInsightsSection = aiInsights ? `
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 24px; border-radius: 12px; margin: 20px 0; color: white;">
          <h2 style="margin: 0 0 16px 0; font-size: 20px; color: white;">✨ Stellar Insights</h2>

          <div style="background: rgba(255, 255, 255, 0.15); padding: 16px; border-radius: 8px; margin-bottom: 12px;">
            <div style="display: flex; align-items: center; margin-bottom: 8px;">
              <strong style="color: white;">Urgency:</strong>
              <span style="margin-left: 8px; padding: 4px 12px; background: ${urgencyColor}; border-radius: 16px; font-weight: bold; color: white;">
                ${urgencyEmoji} ${aiInsights.urgency}
              </span>
            </div>
            <div style="display: flex; align-items: center;">
              <strong style="color: white;">Sentiment:</strong>
              <span style="margin-left: 8px; color: white;">
                ${sentimentEmoji} ${aiInsights.sentiment}
              </span>
            </div>
          </div>

          <div style="background: rgba(255, 255, 255, 0.15); padding: 16px; border-radius: 8px;">
            <strong style="color: white; display: block; margin-bottom: 8px;">Stellar Snapshot:</strong>
            <p style="margin: 0; line-height: 1.6; color: white;">${aiInsights.summary}</p>
          </div>
        </div>
      ` : '';

      await resend.emails.send({
        from: fromEmail,
        to: ownerEmail,
        subject: `New Lead from ${bot.name} - #${submission.id.slice(0, 8)}${aiInsights?.urgency === 'High' ? ' 🚨 HIGH URGENCY' : ''}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #4F46E5;">New Lead Received! 🚀</h1>
            <p>You have a new submission from <strong>${bot.name}</strong>.</p>

            ${stellarInsightsSection}

            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin: 0 0 16px 0; color: #374151;">Submission Details</h3>
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

    // 5. Trigger Webhook Integration (if configured)
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