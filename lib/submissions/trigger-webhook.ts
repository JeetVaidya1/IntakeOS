import { isAgenticSchema } from '@/types/agentic';
import { getFieldLabel } from './format-helpers';

/**
 * Trigger webhook integration for a new submission
 */
export async function triggerSubmissionWebhook(
  botId: string,
  botName: string,
  submissionId: string,
  submittedAt: string,
  data: Record<string, any>,
  schema: any,
  conversation: any,
  webhookUrl: string
): Promise<void> {
  try {
    console.log('🔗 Triggering webhook:', webhookUrl);

    // Create fields metadata with labels from schema
    const fieldsMetadata: Record<string, { label: string; value: any }> = {};
    Object.entries(data).forEach(([key, value]) => {
      fieldsMetadata[key] = {
        label: getFieldLabel(key, schema),
        value: value
      };
    });

    const webhookPayload = {
      event: 'submission.created',
      bot_id: botId,
      bot_name: botName,
      submission_id: submissionId,
      submitted_at: submittedAt,
      schema_version: isAgenticSchema(schema) ? 'agentic_v1' : 'legacy',
      conversation: conversation || null,
      fields_metadata: fieldsMetadata,
      ...data // Spread the actual form fields for easy mapping in Zapier/Make
    };

    // Send webhook asynchronously - don't wait for response
    fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'IntakeOS-Webhook/1.0'
      },
      body: JSON.stringify(webhookPayload),
    })
      .then(() => console.log('✅ Webhook triggered successfully'))
      .catch((webhookError) => console.error('⚠️ Webhook failed:', webhookError));
  } catch (webhookError) {
    console.error('⚠️ Failed to process webhook:', webhookError);
    throw webhookError;
  }
}

