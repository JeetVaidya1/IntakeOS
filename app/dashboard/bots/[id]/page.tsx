import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BotSettings } from '@/app/components/BotSettings';
import { QRCode } from '@/app/preview/[id]/QRcode';
import { Users, TrendingUp, Check, Code, ExternalLink, Copy, Calendar, QrCode } from 'lucide-react';

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
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Deep Mesh Background Elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-10 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-10 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-float" style={{animationDelay: '3s'}}></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl animate-float" style={{animationDelay: '1.5s'}}></div>
        <div className="absolute inset-0 bg-grid-pattern opacity-20"></div>
      </div>

      {/* Header */}
      <header className="bg-slate-950/70 backdrop-blur-xl border-b border-white/10 sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-slate-300 hover:text-white transition-colors font-medium">
              ← Back
            </Link>
            <div className="h-6 w-px bg-white/10" />
            <div className="flex items-center gap-3">
              <span className="font-bold text-xl text-white">{bot.name}</span>
              <Badge variant="secondary" className="font-mono text-xs bg-white/10 border-white/10 text-slate-300">{bot.slug}</Badge>
            </div>
          </div>
          <a href={chatUrl} target="_blank" rel="noopener noreferrer">
            <Button size="sm" className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 shadow-lg shadow-indigo-500/50">
              Open Chat ↗
            </Button>
          </a>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Hero Bot Name */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 mb-2">{bot.name}</h1>
          <p className="text-slate-400">Manage your AI intake bot</p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-white/5 p-1 border border-white/10 h-auto rounded-lg backdrop-blur-lg">
            <TabsTrigger value="overview" className="px-4 py-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-300">Overview & Install</TabsTrigger>
            <TabsTrigger value="submissions" className="px-4 py-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-300">Submissions ({submissions?.length || 0})</TabsTrigger>
            <TabsTrigger value="settings" className="px-4 py-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-300">Settings</TabsTrigger>
          </TabsList>

          {/* TAB 1: OVERVIEW */}
          <TabsContent value="overview" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* KPI Cards - Dark Glass */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6 bg-white/5 border border-white/10 hover:border-indigo-500/50 transition-all shadow-xl hover:shadow-indigo-500/20 backdrop-blur-lg group">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-400 mb-1">Total Leads</p>
                    <p className="text-4xl font-bold text-white mb-2">{submissions?.length || 0}</p>
                    <p className="text-xs text-slate-500">All-time submissions</p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl shadow-lg shadow-indigo-500/50 group-hover:scale-110 transition-transform">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-white/5 border border-white/10 hover:border-emerald-500/50 transition-all shadow-xl hover:shadow-emerald-500/20 backdrop-blur-lg group">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-400 mb-1">Completion Rate</p>
                    <p className="text-4xl font-bold text-white mb-2">—%</p>
                    <p className="text-xs text-slate-500">Coming soon</p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl shadow-lg shadow-emerald-500/50 group-hover:scale-110 transition-transform">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-white/5 border border-white/10 hover:border-cyan-500/50 transition-all shadow-xl hover:shadow-cyan-500/20 backdrop-blur-lg group">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-400 mb-1">Status</p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 animate-pulse shadow-lg shadow-emerald-500/50" />
                      <span className="text-2xl font-bold text-white">Active</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">Accepting submissions</p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl shadow-lg shadow-cyan-500/50 group-hover:scale-110 transition-transform">
                    <Check className="h-6 w-6 text-white" />
                  </div>
                </div>
              </Card>
            </div>

            {/* Install Section - Dark Glass */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6 border border-purple-500/30 bg-white/5 backdrop-blur-lg hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-500/20 transition-all group">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg shadow-lg shadow-purple-500/50">
                    <ExternalLink className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-white">Option A: Direct Link</h3>
                </div>
                <p className="text-sm text-slate-300 mb-4">Great for SMS, Email, or Social Media bios.</p>
                <div className="flex gap-2">
                  <code className="flex-1 bg-black/20 border border-white/10 p-3 rounded-lg text-xs overflow-x-auto whitespace-nowrap flex items-center font-mono text-slate-200">
                    {chatUrl}
                  </code>
                  <Button variant="outline" size="sm" className="border-white/10 text-slate-300 hover:bg-white/10 hover:text-white">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </Card>

              <Card className="p-6 border border-indigo-500/30 bg-white/5 backdrop-blur-lg hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/20 transition-all group">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-lg shadow-lg shadow-indigo-500/50">
                    <Code className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-white">Option B: Website Embed</h3>
                </div>
                <p className="text-sm text-slate-300 mb-4">Paste this into your website&apos;s footer.</p>
                <div className="bg-black/40 border border-white/10 rounded-lg p-4 relative group">
                  <code className="text-xs text-slate-300 font-mono block break-all">
                    {embedCode}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 hover:text-white hover:bg-white/10"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </Card>
            </div>

            {/* Option C: QR Code - Full Width */}
            <Card className="p-6 border border-indigo-500/30 bg-white/5 backdrop-blur-lg hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/20 transition-all group">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg shadow-lg shadow-indigo-500/50">
                  <QrCode className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-semibold text-white">Option C: QR Code</h3>
              </div>
              <p className="text-sm text-slate-300 mb-6">
                Download or print this QR code to give clients instant access via their mobile devices.
              </p>
              <div className="flex justify-center">
                <QRCode url={chatUrl} />
              </div>
            </Card>
          </TabsContent>

          {/* TAB 2: SUBMISSIONS - Dark Glass */}
          <TabsContent value="submissions" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            {!submissions || submissions.length === 0 ? (
              <Card className="border-2 border-dashed border-white/10 bg-white/5 backdrop-blur-lg">
                <div className="p-16 text-center">
                  <div className="inline-block p-6 bg-purple-500/10 rounded-full mb-4 relative">
                    <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-xl"></div>
                    <div className="text-6xl relative">📭</div>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">No leads yet</h3>
                  <p className="text-slate-400 text-sm">Share your link to start collecting submissions!</p>
                </div>
              </Card>
            ) : (
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden">
                {/* Header Row */}
                <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/10 text-slate-400 text-sm font-medium">
                  <div className="col-span-6">Contact</div>
                  <div className="col-span-4">Submitted</div>
                  <div className="col-span-2 text-right">Action</div>
                </div>

                {/* Data Rows */}
                <div className="divide-y divide-white/5">
                  {submissions.map((sub: any) => (
                    <Link key={sub.id} href={`/dashboard/submissions/${sub.id}`}>
                      <div className="grid grid-cols-12 gap-4 p-4 hover:bg-white/5 transition-colors cursor-pointer group">
                        <div className="col-span-6">
                          <div className="font-semibold text-white group-hover:text-indigo-400 transition-colors">{getSubmissionTitle(sub.data)}</div>
                        </div>
                        <div className="col-span-4 text-slate-300 text-sm flex items-center gap-2">
                          <Calendar className="h-3 w-3 text-slate-500" />
                          {new Date(sub.created_at).toLocaleString()}
                        </div>
                        <div className="col-span-2 text-right text-slate-400 group-hover:text-indigo-400 transition-colors flex items-center justify-end gap-2">
                          <span className="text-sm font-medium">View</span>
                          <ExternalLink className="h-4 w-4" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
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
