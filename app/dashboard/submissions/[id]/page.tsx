import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Sparkles, TrendingUp } from 'lucide-react';
import { EnhancedSubmissionActions } from './EnhancedSubmissionActions';
import { isAgenticSchema, isLegacySchema } from '@/types/agentic';

// Helper function to get a human-readable label from either schema type
function getFieldLabel(key: string, schema: any): string {
  // Legacy schema (array of fields)
  if (isLegacySchema(schema)) {
    const field = schema.find((f: any) => f.id === key);
    return field?.label || formatKey(key);
  }

  // Agentic schema (object with required_info)
  if (isAgenticSchema(schema)) {
    const info = schema.required_info[key];
    return info?.description || formatKey(key);
  }

  // Fallback: format the key nicely
  return formatKey(key);
}

// Format snake_case keys into Title Case
function formatKey(key: string): string {
  return key
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Helper to get urgency emoji and color
function getUrgencyDisplay(urgency: string | null | undefined) {
  if (urgency === 'High') return { emoji: '🚨', color: 'from-red-500 to-rose-600', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/30' };
  if (urgency === 'Medium') return { emoji: '⚠️', color: 'from-amber-500 to-orange-500', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/30' };
  if (urgency === 'Low') return { emoji: '✅', color: 'from-emerald-500 to-teal-500', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/30' };
  return { emoji: '❓', color: 'from-slate-500 to-slate-600', bgColor: 'bg-slate-500/10', borderColor: 'border-slate-500/30' };
}

// Helper to get sentiment emoji and color
function getSentimentDisplay(sentiment: string | null | undefined) {
  if (sentiment === 'Positive') return { emoji: '😊', color: 'from-emerald-500 to-teal-500', label: 'Positive' };
  if (sentiment === 'Frustrated') return { emoji: '😤', color: 'from-red-500 to-rose-600', label: 'Frustrated' };
  if (sentiment === 'Neutral') return { emoji: '😐', color: 'from-slate-500 to-slate-600', label: 'Neutral' };
  return { emoji: '❓', color: 'from-slate-500 to-slate-600', label: 'Unknown' };
}

// Helper to calculate time since submission
function getTimeSinceSubmission(createdAt: string) {
  const now = new Date();
  const submitted = new Date(createdAt);
  const diffMs = now.getTime() - submitted.getTime();

  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  return `${days} day${days !== 1 ? 's' : ''} ago`;
}

// Helper to detect noteworthy flags in submission data
function getNoteworthyFlags(data: Record<string, any>, schema: any) {
  const flags: { emoji: string; text: string; color: string }[] = [];

  // Check for urgent keywords
  const urgentKeywords = ['asap', 'urgent', 'emergency', 'immediately', 'broken', 'leak', 'safety', 'danger', 'hazard'];
  const dataString = JSON.stringify(data).toLowerCase();

  if (urgentKeywords.some(keyword => dataString.includes(keyword))) {
    flags.push({
      emoji: '⚠️',
      text: 'Urgent language detected in responses',
      color: 'text-red-400'
    });
  }

  // Check for high-value indicators
  const highValueKeywords = ['budget', 'quote', 'estimate', 'price', 'cost', 'buy', 'purchase', 'invest'];
  if (highValueKeywords.some(keyword => dataString.includes(keyword))) {
    flags.push({
      emoji: '💰',
      text: 'Budget/pricing discussion mentioned',
      color: 'text-emerald-400'
    });
  }

  // Check for time constraints
  const timeKeywords = ['today', 'tomorrow', 'deadline', 'by end of', 'this week', 'urgent'];
  if (timeKeywords.some(keyword => dataString.includes(keyword))) {
    flags.push({
      emoji: '⏰',
      text: 'Time-sensitive request detected',
      color: 'text-amber-400'
    });
  }

  // Check for competitor mentions
  const competitorKeywords = ['other company', 'competitor', 'alternative', 'comparing', 'quote from'];
  if (competitorKeywords.some(keyword => dataString.includes(keyword))) {
    flags.push({
      emoji: '🎯',
      text: 'Comparing with competitors',
      color: 'text-purple-400'
    });
  }

  // Check for referrals
  const referralKeywords = ['recommended', 'referred', 'friend told', 'review', 'heard about'];
  if (referralKeywords.some(keyword => dataString.includes(keyword))) {
    flags.push({
      emoji: '⭐',
      text: 'Came via referral or recommendation',
      color: 'text-cyan-400'
    });
  }

  return flags;
}

export default async function SubmissionDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;

  // Get authenticated user
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

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Fetch submission with bot info
  const { data: submission, error } = await supabase
    .from('submissions')
    .select(`
      *,
      bot:bots(*)
    `)
    .eq('id', id)
    .single();

  if (error || !submission) {
    console.error('Error:', error);
    notFound();
  }

  // Verify ownership
  if (submission.bot.user_id !== user.id) {
    notFound();
  }

  const urgencyDisplay = getUrgencyDisplay(submission.urgency);
  const sentimentDisplay = getSentimentDisplay(submission.sentiment);
  const timeSinceSubmission = getTimeSinceSubmission(submission.created_at);
  const noteworthyFlags = getNoteworthyFlags(submission.data, submission.bot.schema);

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Deep Mesh Background Elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-10 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-10 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-float" style={{animationDelay: '3s'}}></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl animate-float" style={{animationDelay: '1.5s'}}></div>
        <div className="absolute inset-0 bg-grid-pattern opacity-20"></div>
      </div>

      {/* Header */}
      <header className="border-b border-white/10 bg-slate-950/70 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href={`/dashboard/bots/${submission.bot.id}`}>
              <Button variant="ghost" size="sm" className="hover:bg-white/10 text-slate-300 hover:text-white">
                ← Back to Bot
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white">Submission Details</h1>
              <p className="text-sm text-slate-400 font-mono font-medium">
                {new Date(submission.created_at).toLocaleString()}
              </p>
            </div>
            <div className="flex gap-2">
              {submission.urgency && (
                <Badge className={`bg-gradient-to-r ${urgencyDisplay.color} border-0 text-white shadow-lg`}>
                  <span className="mr-1">{urgencyDisplay.emoji}</span>
                  {submission.urgency}
                </Badge>
              )}
              {submission.sentiment && (
                <Badge className={`bg-gradient-to-r ${sentimentDisplay.color} border-0 text-white shadow-lg`}>
                  <span className="mr-1">{sentimentDisplay.emoji}</span>
                  {sentimentDisplay.label}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Enhanced Actions */}
        <div className="mb-8">
          <EnhancedSubmissionActions
            submissionId={submission.id}
            botId={submission.bot.id}
            botName={submission.bot.name}
            currentStatus={submission.status}
            submissionData={submission.data}
            botSchema={submission.bot.schema}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Collected Data Metadata */}
          <div>
            <Card className="p-6 bg-white/5 backdrop-blur-lg border border-white/10 shadow-xl">
              <h2 className="text-xl font-bold text-white mb-6">Collected Information</h2>
              <div className="space-y-4">
                {Object.entries(submission.data).map(([key, value]) => {
                  // Get label using helper function (handles both legacy and agentic schemas)
                  const label = getFieldLabel(key, submission.bot.schema);

                  // Check if value is an image or document
                  const isImage = typeof value === 'string' && value.startsWith('[IMAGE] ');
                  const isDocument = typeof value === 'string' && value.startsWith('[DOCUMENT] ');

                  const imageUrl = isImage ? value.replace('[IMAGE] ', '') : null;

                  let documentUrl = null;
                  let documentName = 'Document';
                  if (isDocument) {
                    const parts = value.split(' | ');
                    documentUrl = parts[0].replace('[DOCUMENT] ', '').trim();
                    documentName = parts[1] || 'Document';
                  }

                  return (
                    <div key={key} className="border-b border-white/10 pb-4">
                      <div className="text-sm text-slate-400 mb-1">{label}</div>
                      {isImage && imageUrl ? (
                        <div className="mt-2">
                          <img
                            src={imageUrl}
                            alt={label}
                            className="max-w-full max-h-96 rounded-lg border border-white/10 shadow-lg"
                          />
                          <a
                            href={imageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block mt-2 text-sm text-indigo-400 hover:text-indigo-300 hover:underline"
                          >
                            Open full size →
                          </a>
                        </div>
                      ) : isDocument && documentUrl ? (
                        <a
                          href={documentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-4 bg-white/10 hover:bg-white/20 rounded-lg border border-white/10 hover:border-indigo-500/50 transition-all group mt-2"
                        >
                          <div className="p-2 bg-indigo-500/20 rounded-lg group-hover:bg-indigo-500/30 transition-colors">
                            <FileText className="h-5 w-5 text-indigo-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{documentName}</p>
                            <p className="text-xs text-slate-400">Click to download</p>
                          </div>
                          <Download className="h-4 w-4 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                        </a>
                      ) : (
                        <div className="font-medium text-white">{String(value)}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Right Column: Full Conversation - Secure Log Style */}
          <div className="space-y-6">
            {/* AI Deep Dive Card */}
            {submission.summary && (
              <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 backdrop-blur-lg shadow-xl">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <span className="text-2xl">🔍</span>
                  AI Deep Dive
                </h2>

                <div className="space-y-4">
                  {/* Executive Summary */}
                  <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                    <h3 className="text-sm font-bold text-purple-300 mb-2 uppercase tracking-wide">Executive Summary</h3>
                    <p className="text-white leading-relaxed">{submission.summary}</p>
                  </div>

                  {/* Key Metrics Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {submission.urgency && (
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <div className="text-xs text-slate-400 mb-1">Priority Level</div>
                        <div className="text-lg font-bold text-white flex items-center gap-2">
                          {getUrgencyDisplay(submission.urgency).emoji}
                          <span>{submission.urgency}</span>
                        </div>
                      </div>
                    )}
                    {submission.sentiment && (
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <div className="text-xs text-slate-400 mb-1">Customer Mood</div>
                        <div className="text-lg font-bold text-white flex items-center gap-2">
                          {getSentimentDisplay(submission.sentiment).emoji}
                          <span>{getSentimentDisplay(submission.sentiment).label}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Noteworthy Flags */}
                  {noteworthyFlags.length > 0 && (
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                      <h3 className="text-sm font-bold text-purple-300 mb-2 uppercase tracking-wide">🚩 Noteworthy Flags</h3>
                      <ul className="space-y-2 text-sm">
                        {noteworthyFlags.map((flag, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="mt-0.5">{flag.emoji}</span>
                            <span className={flag.color}>{flag.text}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Recommended Actions */}
                  <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                    <h3 className="text-sm font-bold text-purple-300 mb-2 uppercase tracking-wide">Recommended Next Steps</h3>
                    <ul className="space-y-2 text-sm text-slate-300">
                      {submission.urgency === 'High' && (
                        <li className="flex items-start gap-2">
                          <span className="text-red-400 mt-0.5">🚨</span>
                          <span><strong className="text-white">Immediate follow-up required.</strong> Contact within 1 hour to maximize conversion.</span>
                        </li>
                      )}
                      {submission.urgency === 'Medium' && (
                        <li className="flex items-start gap-2">
                          <span className="text-amber-400 mt-0.5">⚡</span>
                          <span><strong className="text-white">Follow up soon.</strong> Respond within 24 hours while interest is high.</span>
                        </li>
                      )}
                      {submission.urgency === 'Low' && (
                        <li className="flex items-start gap-2">
                          <span className="text-emerald-400 mt-0.5">✅</span>
                          <span><strong className="text-white">Standard follow-up.</strong> Respond within 48 hours with detailed information.</span>
                        </li>
                      )}
                      {submission.sentiment === 'Frustrated' && (
                        <li className="flex items-start gap-2">
                          <span className="text-red-400 mt-0.5">💬</span>
                          <span><strong className="text-white">Address concerns immediately.</strong> Empathize with frustration and provide solutions.</span>
                        </li>
                      )}
                      {submission.sentiment === 'Positive' && (
                        <li className="flex items-start gap-2">
                          <span className="text-emerald-400 mt-0.5">😊</span>
                          <span><strong className="text-white">Build on positive momentum.</strong> Strike while the iron is hot for best results.</span>
                        </li>
                      )}
                      <li className="flex items-start gap-2">
                        <span className="text-indigo-400 mt-0.5">📋</span>
                        <span><strong className="text-white">Review collected information</strong> below and prepare personalized response.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </Card>
            )}

            <Card className="p-6 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 backdrop-blur-lg shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <span className="text-2xl">✅</span>
                  Action Checklist
                </h2>
                <div className="text-sm text-slate-400 font-mono">
                  ⏱️ {timeSinceSubmission}
                </div>
              </div>

              <div className="space-y-3">
                {/* Time-based response deadline */}
                {submission.urgency === 'High' && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">⏰</span>
                      <div>
                        <p className="text-white font-semibold mb-1">Response Deadline</p>
                        <p className="text-sm text-red-300">
                          High urgency lead - respond within <strong>1 hour</strong> of submission
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          Submitted: {new Date(submission.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Smart checklist items based on context */}
                <div className="space-y-2">
                  {/* Contact customer */}
                  <label className="flex items-start gap-3 p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg cursor-pointer transition-all group">
                    <input type="checkbox" className="mt-1 h-4 w-4 rounded border-white/20 bg-white/10 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0" />
                    <div className="flex-1">
                      <p className="text-white font-medium group-hover:text-cyan-300 transition-colors">
                        Contact customer via {submission.data.phone || submission.data.phone_number ? 'phone' : 'email'}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {submission.sentiment === 'Frustrated' ? 'Address concerns with empathy' : 'Introduce yourself and confirm details'}
                      </p>
                    </div>
                  </label>

                  {/* Review urgency level */}
                  {submission.urgency && (
                    <label className="flex items-start gap-3 p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg cursor-pointer transition-all group">
                      <input type="checkbox" className="mt-1 h-4 w-4 rounded border-white/20 bg-white/10 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0" />
                      <div className="flex-1">
                        <p className="text-white font-medium group-hover:text-cyan-300 transition-colors">
                          Review {submission.urgency.toLowerCase()} urgency details
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {submission.urgency === 'High' ? 'Immediate attention required - prioritize this lead' :
                           submission.urgency === 'Medium' ? 'Follow up within 24 hours' :
                           'Standard follow-up timeline applies'}
                        </p>
                      </div>
                    </label>
                  )}

                  {/* Prepare quote/estimate */}
                  <label className="flex items-start gap-3 p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg cursor-pointer transition-all group">
                    <input type="checkbox" className="mt-1 h-4 w-4 rounded border-white/20 bg-white/10 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0" />
                    <div className="flex-1">
                      <p className="text-white font-medium group-hover:text-cyan-300 transition-colors">
                        Prepare quote or estimate
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Based on collected information in the left panel
                      </p>
                    </div>
                  </label>

                  {/* Schedule site visit or appointment */}
                  <label className="flex items-start gap-3 p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg cursor-pointer transition-all group">
                    <input type="checkbox" className="mt-1 h-4 w-4 rounded border-white/20 bg-white/10 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0" />
                    <div className="flex-1">
                      <p className="text-white font-medium group-hover:text-cyan-300 transition-colors">
                        Schedule site visit or consultation
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {submission.data.availability || submission.data.preferred_time ?
                          `Customer availability: ${submission.data.availability || submission.data.preferred_time}` :
                          'Coordinate timing with customer'}
                      </p>
                    </div>
                  </label>

                  {/* Send follow-up confirmation */}
                  <label className="flex items-start gap-3 p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg cursor-pointer transition-all group">
                    <input type="checkbox" className="mt-1 h-4 w-4 rounded border-white/20 bg-white/10 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0" />
                    <div className="flex-1">
                      <p className="text-white font-medium group-hover:text-cyan-300 transition-colors">
                        Send follow-up confirmation
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Confirm next steps and timeline via {submission.data.email ? 'email' : 'preferred contact method'}
                      </p>
                    </div>
                  </label>

                  {/* Update status */}
                  <label className="flex items-start gap-3 p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg cursor-pointer transition-all group">
                    <input type="checkbox" className="mt-1 h-4 w-4 rounded border-white/20 bg-white/10 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0" />
                    <div className="flex-1">
                      <p className="text-white font-medium group-hover:text-cyan-300 transition-colors">
                        Update submission status
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Move to 'Contacted' or 'Booked' when appropriate
                      </p>
                    </div>
                  </label>
                </div>

                {/* Helpful note */}
                <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-lg p-4 mt-4">
                  <p className="text-sm text-slate-300 italic">
                    💡 <strong className="text-cyan-300">Pro tip:</strong> Use the WhatsApp and Call buttons above for instant Speed-to-Lead action!
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
