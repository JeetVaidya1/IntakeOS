import { Resend } from 'resend';
import { getFieldLabel } from './format-helpers';
import { AIInsights } from './generate-insights';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Build the Stellar Insights HTML section for email
 */
function buildStellarInsightsSection(aiInsights: AIInsights): string {
  const urgencyEmoji = aiInsights.urgency === 'High' ? '🚨' : aiInsights.urgency === 'Medium' ? '⚠️' : '✅';
  const urgencyColor = aiInsights.urgency === 'High' ? '#dc2626' : aiInsights.urgency === 'Medium' ? '#f59e0b' : '#10b981';
  const sentimentEmoji = aiInsights.sentiment === 'Positive' ? '😊' : aiInsights.sentiment === 'Frustrated' ? '😤' : '😐';

  return `
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
  `;
}

/**
 * Send email notification for a new submission
 */
export async function sendSubmissionNotification(
  submissionId: string,
  botName: string,
  ownerEmail: string,
  data: Record<string, any>,
  schema: any,
  aiInsights: AIInsights | null
): Promise<void> {
  try {
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'IntakeOS Notifications <onboarding@resend.dev>';
    const stellarInsightsSection = aiInsights ? buildStellarInsightsSection(aiInsights) : '';
    const urgencySuffix = aiInsights?.urgency === 'High' ? ' 🚨 HIGH URGENCY' : '';

    await resend.emails.send({
      from: fromEmail,
      to: ownerEmail,
      subject: `New Lead from ${botName} - #${submissionId.slice(0, 8)}${urgencySuffix}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #4F46E5;">New Lead Received! 🚀</h1>
          <p>You have a new submission from <strong>${botName}</strong>.</p>

          ${stellarInsightsSection}

          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 16px 0; color: #374151;">Submission Details</h3>
            ${Object.entries(data).map(([key, value]) => `
              <div style="margin-bottom: 10px;">
                <strong style="color: #374151;">${getFieldLabel(key, schema)}:</strong>
                <span style="color: #111827;">${value}</span>
              </div>
            `).join('')}
          </div>

          <p style="color: #6b7280; font-size: 14px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/submissions/${submissionId}" style="color: #4F46E5; text-decoration: none;">View full conversation in Dashboard →</a>
          </p>
        </div>
      `
    });

    console.log('📧 Email sent successfully');
  } catch (emailError) {
    console.error('⚠️ Failed to send email:', emailError);
    throw emailError;
  }
}

