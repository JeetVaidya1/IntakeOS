import { createClient } from '@supabase/supabase-js';

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

/**
 * Save a new submission to the database
 */
export async function saveSubmission(
  botId: string,
  data: Record<string, any>,
  conversation: any,
  uploadedFiles: any[]
) {
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
  return submission;
}

/**
 * Update submission with AI insights
 */
export async function updateSubmissionWithInsights(
  submissionId: string,
  summary: string,
  sentiment: string,
  urgency: string
) {
  const { error } = await supabase
    .from('submissions')
    .update({
      summary,
      sentiment,
      urgency,
    })
    .eq('id', submissionId);

  if (error) {
    console.error('⚠️ Failed to update submission with AI insights:', error);
    throw error;
  }

  console.log('✅ Submission updated with AI insights');
}

/**
 * Fetch bot information for notifications
 */
export async function fetchBotForNotification(botId: string) {
  const { data: bot, error } = await supabase
    .from('bots')
    .select('notification_email, name, schema')
    .eq('id', botId)
    .single();

  if (error || !bot) {
    console.error('⚠️ Could not fetch bot notification email:', error);
    return null;
  }

  return bot;
}

/**
 * Fetch webhook integration for a bot
 */
export async function fetchBotWebhook(botId: string) {
  const { data: integration, error } = await supabase
    .from('integrations')
    .select('webhook_url, is_active')
    .eq('bot_id', botId)
    .single();

  if (error || !integration || !integration.is_active || !integration.webhook_url) {
    return null;
  }

  return integration;
}

