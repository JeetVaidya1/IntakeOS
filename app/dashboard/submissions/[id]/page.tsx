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
        {/* Stellar Snapshot Card */}
        {submission.summary && (
          <Card className="p-8 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/30 backdrop-blur-lg shadow-2xl mb-8 relative overflow-hidden">
            {/* Aurora orbs */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl -z-10"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl -z-10"></div>

            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl shadow-lg shadow-indigo-500/50">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-2">✨ Stellar Snapshot</h2>
                <p className="text-slate-300 text-sm">AI-generated executive summary</p>
              </div>
              <div className="flex gap-2">
                {submission.urgency && (
                  <div className={`px-4 py-2 rounded-lg ${urgencyDisplay.bgColor} border ${urgencyDisplay.borderColor}`}>
                    <div className="text-xs text-slate-400 mb-1">Urgency</div>
                    <div className="font-bold text-white flex items-center gap-1">
                      <span>{urgencyDisplay.emoji}</span>
                      <span>{submission.urgency}</span>
                    </div>
                  </div>
                )}
                {submission.sentiment && (
                  <div className={`px-4 py-2 rounded-lg bg-white/5 border border-white/10`}>
                    <div className="text-xs text-slate-400 mb-1">Sentiment</div>
                    <div className="font-bold text-white flex items-center gap-1">
                      <span>{sentimentDisplay.emoji}</span>
                      <span>{sentimentDisplay.label}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6">
              <p className="text-lg text-white leading-relaxed">{submission.summary}</p>
            </div>
          </Card>
        )}

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
          <div>
            <Card className="p-6 bg-white/5 backdrop-blur-lg border border-white/10 shadow-xl">
              <h2 className="text-xl font-bold text-white mb-6">Conversation Transcript</h2>
              <div className="space-y-3">
                {submission.conversation && submission.conversation.length > 0 ? (
                  submission.conversation.map((message: any, index: number) => {
                    // Check if message contains an image or document
                    const isImage = message.content.startsWith('[IMAGE] ');
                    const isDocument = message.content.startsWith('[DOCUMENT] ');

                    const imageUrl = isImage ? message.content.replace('[IMAGE] ', '') : null;

                    let documentUrl = null;
                    let documentName = 'Document';
                    if (isDocument) {
                      const parts = message.content.split(' | ');
                      documentUrl = parts[0].replace('[DOCUMENT] ', '').trim();
                      documentName = parts[1] || 'Document';
                    }

                    return (
                      <div
                        key={index}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-lg px-4 py-3 ${
                            message.role === 'user'
                              ? 'bg-indigo-500/20 text-indigo-100 border border-indigo-500/30'
                              : 'bg-slate-800 text-slate-200 border border-white/5'
                          }`}
                        >
                          {/* Timestamp in mono font for technical feel */}
                          <div className={`text-xs font-mono mb-1 ${message.role === 'user' ? 'text-indigo-300' : 'text-slate-500'}`}>
                            {new Date(submission.created_at).toLocaleTimeString()}
                          </div>
                          {isImage && imageUrl ? (
                            <div>
                              <img
                                src={imageUrl}
                                alt="Uploaded image"
                                className="max-w-full max-h-64 rounded-lg border border-white/20 mb-1"
                              />
                              <p className="text-xs opacity-70">Image uploaded</p>
                            </div>
                          ) : isDocument && documentUrl ? (
                            <a
                              href={documentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 p-3 bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 hover:border-indigo-500/50 transition-all group"
                            >
                              <div className="p-2 bg-white/20 rounded-lg">
                                <FileText className="h-5 w-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{documentName}</p>
                                <p className="text-xs opacity-70">Document uploaded</p>
                              </div>
                              <Download className="h-4 w-4 opacity-70 group-hover:opacity-100 transition-opacity" />
                            </a>
                          ) : (
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    <p className="text-sm">No conversation history available.</p>
                    <p className="text-xs mt-2 text-slate-500">This may be a legacy submission created before conversational tracking was enabled.</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
