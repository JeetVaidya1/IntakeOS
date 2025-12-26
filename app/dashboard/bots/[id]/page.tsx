import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BotSettings } from '@/app/components/BotSettings';
import { Users, TrendingUp, Check, Code, ExternalLink, Copy, Calendar } from 'lucide-react';

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
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Vibrant Background Shapes */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        {/* Large colorful circles with blur for atmospheric effect */}
        <div className="absolute top-20 left-10 w-96 h-96 bg-indigo-500 rounded-full opacity-60 blur-3xl animate-float"></div>
        <div className="absolute top-40 right-20 w-[500px] h-[500px] bg-purple-500 rounded-full opacity-50 blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-32 left-1/4 w-[450px] h-[450px] bg-pink-500 rounded-full opacity-55 blur-3xl animate-float" style={{animationDelay: '4s'}}></div>
        <div className="absolute top-1/3 right-1/3 w-[400px] h-[400px] bg-cyan-500 rounded-full opacity-50 blur-3xl animate-float" style={{animationDelay: '1s'}}></div>

        {/* Geometric squares with blur */}
        <div className="absolute bottom-40 right-10 w-64 h-64 bg-orange-500 opacity-55 blur-3xl rotate-45 animate-float" style={{animationDelay: '3s'}}></div>
        <div className="absolute top-1/2 left-20 w-72 h-72 bg-teal-500 rounded-full opacity-50 blur-3xl animate-float" style={{animationDelay: '5s'}}></div>

        {/* Pattern overlay - reduced opacity */}
        <div className="absolute inset-0 bg-pattern-dots opacity-10"></div>
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
            {/* KPI Cards - Vibrant & Colorful */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 hover:border-indigo-300 transition-all shadow-lg hover:shadow-xl hover:scale-105 duration-300 group">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-indigo-600 mb-1">Total Leads</p>
                    <p className="text-4xl font-bold text-indigo-900 mb-2">{submissions?.length || 0}</p>
                    <p className="text-xs text-slate-500">All-time submissions</p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 hover:border-emerald-300 transition-all shadow-lg hover:shadow-xl hover:scale-105 duration-300 group">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-emerald-600 mb-1">Completion Rate</p>
                    <p className="text-4xl font-bold text-emerald-900 mb-2">—%</p>
                    <p className="text-xs text-slate-500">Coming soon</p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-cyan-50 to-blue-50 border-2 border-cyan-200 hover:border-cyan-300 transition-all shadow-lg hover:shadow-xl hover:scale-105 duration-300 group">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-cyan-600 mb-1">Status</p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 animate-pulse shadow-lg shadow-emerald-500/50" />
                      <span className="text-2xl font-bold text-cyan-900">Active</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">Accepting submissions</p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                    <Check className="h-6 w-6 text-white" />
                  </div>
                </div>
              </Card>
            </div>

            {/* Install Section - More Visual */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6 border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 hover:shadow-xl transition-all group">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                    <ExternalLink className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-purple-900">Option A: Direct Link</h3>
                </div>
                <p className="text-sm text-purple-700 mb-4">Great for SMS, Email, or Social Media bios.</p>
                <div className="flex gap-2">
                  <code className="flex-1 bg-white/80 border border-purple-200 p-3 rounded-lg text-xs overflow-x-auto whitespace-nowrap flex items-center font-mono text-purple-900">
                    {chatUrl}
                  </code>
                  <Button variant="outline" size="sm" className="border-purple-300 text-purple-700 hover:bg-purple-100">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </Card>

              <Card className="p-6 border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-cyan-50 hover:shadow-xl transition-all group">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-lg">
                    <Code className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-indigo-900">Option B: Website Embed</h3>
                </div>
                <p className="text-sm text-indigo-700 mb-4">Paste this into your website&apos;s footer.</p>
                <div className="bg-slate-900 rounded-lg p-4 relative group">
                  <code className="text-xs text-slate-300 font-mono block break-all">
                    {embedCode}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 hover:text-white hover:bg-slate-800"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* TAB 2: SUBMISSIONS - More Visual */}
          <TabsContent value="submissions" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            {!submissions || submissions.length === 0 ? (
              <Card className="border-2 border-dashed border-purple-200 bg-gradient-to-br from-purple-50/50 to-pink-50/50">
                <div className="p-16 text-center">
                  <div className="inline-block p-6 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full mb-4">
                    <div className="text-6xl">📭</div>
                  </div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">No leads yet</h3>
                  <p className="text-slate-600 text-sm">Share your link to start collecting submissions!</p>
                </div>
              </Card>
            ) : (
              <div className="space-y-3">
                {submissions.map((sub: any, index: number) => {
                  const colors = [
                    { from: 'from-indigo-50', to: 'to-purple-50', border: 'border-indigo-200', hover: 'hover:border-indigo-300', text: 'text-indigo-600' },
                    { from: 'from-emerald-50', to: 'to-teal-50', border: 'border-emerald-200', hover: 'hover:border-emerald-300', text: 'text-emerald-600' },
                    { from: 'from-cyan-50', to: 'to-blue-50', border: 'border-cyan-200', hover: 'hover:border-cyan-300', text: 'text-cyan-600' },
                    { from: 'from-orange-50', to: 'to-amber-50', border: 'border-orange-200', hover: 'hover:border-orange-300', text: 'text-orange-600' },
                  ];
                  const colorSet = colors[index % colors.length];

                  return (
                    <Link key={sub.id} href={`/dashboard/submissions/${sub.id}`}>
                      <Card className={`p-5 bg-gradient-to-br ${colorSet.from} ${colorSet.to} border-2 ${colorSet.border} ${colorSet.hover} hover:shadow-lg transition-all duration-300 cursor-pointer group`}>
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-semibold text-lg text-slate-900 group-hover:text-indigo-600 transition-colors">{getSubmissionTitle(sub.data)}</div>
                            <div className={`text-xs ${colorSet.text} mt-1 flex items-center gap-2`}>
                              <Calendar className="h-3 w-3" />
                              {new Date(sub.created_at).toLocaleString()}
                            </div>
                          </div>
                          <div className={`text-slate-400 group-hover:${colorSet.text} transition-colors flex items-center gap-2`}>
                            <span className="text-sm font-medium">View</span>
                            <ExternalLink className="h-4 w-4" />
                          </div>
                        </div>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            )}
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