import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Helper to intelligently pick a display title for a submission
function getSubmissionTitle(data: any) {
  if (!data || typeof data !== 'object') return "Anonymous Submission";
  
  const entries = Object.entries(data);
  
  // 1. Prioritize a "Name" field
  const nameEntry = entries.find(([key]) => 
    key.toLowerCase().includes('name') || 
    key.toLowerCase().includes('full_name')
  );
  if (nameEntry) return String(nameEntry[1]);

  // 2. Fallback to "Email"
  const emailEntry = entries.find(([key]) => 
    key.toLowerCase().includes('email')
  );
  if (emailEntry) return String(emailEntry[1]);

  // 3. Fallback to the first collected value
  const firstValue = Object.values(data)[0];
  if (firstValue && typeof firstValue === 'string') return firstValue;

  return "Submission";
}

export default async function BotDetailPage({ 
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

  // Fetch bot
  const { data: bot, error: botError } = await supabase
    .from('bots')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (botError || !bot) {
    notFound();
  }

  // Fetch submissions for this bot
  const { data: submissions, error: submissionsError } = await supabase
    .from('submissions')
    .select('*')
    .eq('bot_id', bot.id)
    .order('created_at', { ascending: false });

  if (submissionsError) {
    console.error('Error fetching submissions:', submissionsError);
  }

  // Construct URLs
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const chatUrl = `${baseUrl}/chat/${bot.slug}`;
  
  // Generate the Embed Snippet
  const embedCode = `<script 
  src="${baseUrl}/widget.js" 
  data-bot-slug="${bot.slug}"
  data-color="#4F46E5"
  async
></script>`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                ← Dashboard
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-xl font-semibold">{bot.name}</h1>
              <p className="text-sm text-slate-500 font-mono text-xs">{bot.slug}</p>
            </div>
            <Badge variant={bot.is_active ? "default" : "secondary"}>
              {bot.is_active ? "Active" : "Inactive"}
            </Badge>
            <Link href="/">
              <Button variant="outline" size="sm">
                + New Bot
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-4">
            <div className="text-sm text-slate-600 mb-1">Total Submissions</div>
            <div className="text-3xl font-bold">{submissions?.length || 0}</div>
          </Card>
          
          <Card className="p-4">
            <div className="text-sm text-slate-600 mb-1">New Leads</div>
            <div className="text-3xl font-bold text-indigo-600">
              {submissions?.filter(s => s.status === 'new').length || 0}
            </div>
          </Card>

          <Card className="p-4">
            <div className="text-sm text-slate-600 mb-1">Questions Asked</div>
            <div className="text-3xl font-bold">{bot.schema.length}</div>
          </Card>
        </div>

        {/* Integration Zone: Share & Embed */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Share Link */}
          <Card className="p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <span>🔗</span> Share Direct Link
            </h2>
            <p className="text-sm text-slate-500 mb-4">
              Send this link directly to clients via SMS or email.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={chatUrl}
                readOnly
                className="flex-1 px-4 py-2 border rounded-md bg-slate-50 text-slate-900 text-sm font-mono"
              />
              <Button variant="outline">Copy</Button>
            </div>
          </Card>

          {/* Embed Code */}
          <Card className="p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <span>🌐</span> Embed on Website
            </h2>
            <p className="text-sm text-slate-500 mb-4">
              Paste this snippet into your website&apos;s <code>&lt;body&gt;</code> tag.
            </p>
            <div className="bg-slate-950 rounded-md p-3 relative group overflow-hidden">
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Badge variant="secondary" className="cursor-pointer">Copy</Badge>
              </div>
              <code className="text-xs text-slate-300 font-mono block whitespace-pre-wrap break-all">
                {embedCode}
              </code>
            </div>
          </Card>
        </div>

        {/* Submissions Table */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Leads & Submissions</h2>
            <Button variant="outline" size="sm">Export CSV</Button>
          </div>

          {!submissions || submissions.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-lg border border-dashed">
              <div className="text-4xl mb-4">📭</div>
              <h3 className="text-lg font-semibold mb-2">No submissions yet</h3>
              <p className="text-slate-600 mb-4 max-w-sm mx-auto">
                Your bot is ready! Share the link or embed it on your site to start collecting data.
              </p>
              <Link href={`/chat/${bot.slug}`} target="_blank">
                <Button>Test Your Bot →</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {submissions.map((submission: any) => {
                const title = getSubmissionTitle(submission.data);
                const email = Object.values(submission.data).find((v: any) => 
                  typeof v === 'string' && v.includes('@')
                ) as string | undefined;

                return (
                  <Link 
                    key={submission.id} 
                    href={`/dashboard/submissions/${submission.id}`}
                  >
                    <div className="p-4 border rounded-lg hover:bg-slate-50 hover:border-indigo-200 transition-all cursor-pointer bg-white group">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <span className="font-semibold text-slate-900 truncate">
                              {title}
                            </span>
                            {submission.status === 'new' && (
                              <Badge className="bg-indigo-600 hover:bg-indigo-700 h-5">
                                New
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-slate-500">
                            {email && <span>{email}</span>}
                            <span>•</span>
                            <span>{new Date(submission.created_at).toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="text-slate-400 group-hover:text-indigo-600 transition-colors">
                          View Details →
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}