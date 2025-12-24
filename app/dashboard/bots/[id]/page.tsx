import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BotSettings } from '@/app/components/BotSettings';

// Helper to intelligently pick a display title for a submission
function getSubmissionTitle(data: any) {
  if (!data || typeof data !== 'object') return "Anonymous Submission";
  const entries = Object.entries(data);
  
  const nameEntry = entries.find(([key]) => key.toLowerCase().includes('name'));
  if (nameEntry) return String(nameEntry[1]);

  const emailEntry = entries.find(([key]) => key.toLowerCase().includes('email'));
  if (emailEntry) return String(emailEntry[1]);

  const firstValue = Object.values(data)[0];
  if (firstValue && typeof firstValue === 'string') return firstValue;

  return "Submission";
}

export default async function BotDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: bot } = await supabase.from('bots').select('*').eq('id', id).single();
  if (!bot) notFound();

  const { data: submissions } = await supabase
    .from('submissions')
    .select('*')
    .eq('bot_id', bot.id)
    .order('created_at', { ascending: false });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const chatUrl = `${baseUrl}/chat/${bot.slug}`;
  const embedCode = `<script src="${baseUrl}/widget.js" data-bot-slug="${bot.slug}" data-color="#4F46E5" async></script>`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-cyan-50/30 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-20 right-1/4 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 left-1/4 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl animate-float" style={{animationDelay: '3s'}}></div>
        <div className="absolute inset-0 bg-pattern-dots"></div>
      </div>

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-purple-200/50 sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-slate-600 hover:text-indigo-600 transition-colors font-medium">
              ← Back
            </Link>
            <div className="h-6 w-px bg-purple-200" />
            <div className="flex items-center gap-3">
              <span className="font-bold text-xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">{bot.name}</span>
              <Badge variant="secondary" className="font-mono text-xs bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200">{bot.slug}</Badge>
            </div>
          </div>
          <a href={chatUrl} target="_blank" rel="noopener noreferrer">
            <Button size="sm" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-500/30">
              Open Chat ↗
            </Button>
          </a>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-white border p-1 h-auto rounded-lg">
            <TabsTrigger value="overview" className="px-4 py-2">Overview & Install</TabsTrigger>
            <TabsTrigger value="submissions" className="px-4 py-2">Submissions ({submissions?.length || 0})</TabsTrigger>
            <TabsTrigger value="settings" className="px-4 py-2">Settings</TabsTrigger>
          </TabsList>

          {/* TAB 1: OVERVIEW */}
          <TabsContent value="overview" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-5 flex flex-col justify-between hover:border-indigo-200 transition-colors">
                <span className="text-sm text-slate-500 font-medium">Total Leads</span>
                <span className="text-3xl font-bold text-indigo-900 mt-2">{submissions?.length || 0}</span>
              </Card>
              <Card className="p-5 flex flex-col justify-between hover:border-indigo-200 transition-colors">
                <span className="text-sm text-slate-500 font-medium">Completion Rate</span>
                <span className="text-3xl font-bold text-slate-700 mt-2">—%</span>
              </Card>
              <Card className="p-5 flex flex-col justify-between hover:border-indigo-200 transition-colors">
                 <span className="text-sm text-slate-500 font-medium">Status</span>
                 <div className="mt-2 flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-lg font-semibold text-slate-700">Active</span>
                 </div>
              </Card>
            </div>

            {/* Install Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="font-semibold mb-2">Option A: Direct Link</h3>
                <p className="text-sm text-slate-500 mb-4">Great for SMS, Email, or Social Media bios.</p>
                <div className="flex gap-2">
                  <code className="flex-1 bg-slate-100 p-2 rounded text-xs overflow-x-auto whitespace-nowrap flex items-center">
                    {chatUrl}
                  </code>
                  <Button variant="outline" size="sm">Copy</Button>
                </div>
              </Card>

              <Card className="p-6 border-indigo-100 bg-indigo-50/30">
                <h3 className="font-semibold mb-2 text-indigo-900">Option B: Website Embed</h3>
                <p className="text-sm text-indigo-700/70 mb-4">Paste this into your website&apos;s footer.</p>
                <div className="bg-slate-900 rounded-lg p-3 relative group">
                  <code className="text-xs text-slate-300 font-mono block break-all">
                    {embedCode}
                  </code>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* TAB 2: SUBMISSIONS */}
          <TabsContent value="submissions" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <Card>
              {!submissions || submissions.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="text-4xl mb-3">📭</div>
                  <h3 className="text-lg font-medium">No leads yet</h3>
                  <p className="text-slate-500 text-sm mt-1">Share your link to get started!</p>
                </div>
              ) : (
                <div className="divide-y">
                  {submissions.map((sub: any) => (
                    <Link key={sub.id} href={`/dashboard/submissions/${sub.id}`}>
                      <div className="p-4 hover:bg-slate-50 cursor-pointer flex items-center justify-between group transition-colors">
                         <div>
                            <div className="font-medium text-slate-900">{getSubmissionTitle(sub.data)}</div>
                            <div className="text-xs text-slate-500 mt-0.5">
                               {new Date(sub.created_at).toLocaleString()}
                            </div>
                         </div>
                         <div className="text-slate-400 group-hover:text-indigo-600 text-sm">
                            View →
                         </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* TAB 3: SETTINGS */}
          <TabsContent value="settings" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
             <BotSettings bot={bot} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}