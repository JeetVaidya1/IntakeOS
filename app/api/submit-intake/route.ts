import { NextResponse } from 'next/server';
import { saveSubmission, updateSubmissionWithInsights, fetchBotForNotification, fetchBotWebhook } from '@/lib/submissions/save-submission';
import { generateSubmissionInsights } from '@/lib/submissions/generate-insights';
import { sendSubmissionNotification } from '@/lib/submissions/send-notification';
import { triggerSubmissionWebhook } from '@/lib/submissions/trigger-webhook';

export async function POST(request: Request) {
  try {
    const { botId, data, conversation, uploadedFiles } = await request.json();

    console.log('📥 Receiving submission for bot:', botId);
    console.log('📎 Uploaded files:', uploadedFiles?.length || 0);

    // 1. Save submission to database
    const submission = await saveSubmission(botId, data, conversation, uploadedFiles);

    // 2. Generate AI-powered Stellar Snapshot
    let aiInsights = await generateSubmissionInsights(conversation, data);

    if (aiInsights) {
      // Update the submission with AI insights
      try {
        await updateSubmissionWithInsights(
          submission.id,
          aiInsights.summary,
          aiInsights.sentiment,
          aiInsights.urgency
        );
      } catch (updateError) {
        console.error('⚠️ Failed to update submission with AI insights:', updateError);
        // Continue with submission flow even if update fails
      }
    }

    // 3. Fetch the bot owner's email and schema from the bot record
    const bot = await fetchBotForNotification(botId);

    if (!bot || !bot.notification_email) {
      // Still return success since submission was saved
      return NextResponse.json({
        success: true,
        submissionId: submission.id,
      });
    }

    // 4. Send Email Notification
    try {
      await sendSubmissionNotification(
        submission.id,
        bot.name,
        bot.notification_email,
        data,
        bot.schema,
        aiInsights
      );
    } catch (emailError) {
      console.error('⚠️ Failed to send email:', emailError);
      // We don't throw here because we don't want to fail the submission just because email failed
    }

    // 5. Trigger Webhook Integration (if configured)
    const integration = await fetchBotWebhook(botId);
    if (integration) {
      try {
        await triggerSubmissionWebhook(
          botId,
          bot.name,
          submission.id,
          submission.created_at,
          data,
          bot.schema,
          conversation,
          integration.webhook_url
        );
      } catch (webhookError) {
        console.error('⚠️ Failed to process webhook:', webhookError);
        // We don't throw here - webhooks are optional and shouldn't break the submission
      }
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
