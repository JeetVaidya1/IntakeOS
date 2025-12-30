'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BotGenerator } from '../components/BotGenerator';
import { User } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';
import { isAgenticSchema, isLegacySchema } from '@/types/agentic';
import { Building2, Plus, BarChart3, Settings, Link2, Clock, X, Download, TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Helper to get field count from either schema type
function getFieldCount(schema: any): number {
  if (isLegacySchema(schema)) {
    return schema.length;
  }
  if (isAgenticSchema(schema)) {
    return Object.keys(schema.required_info).length;
  }
  return 0;
}

// Helper to format time ago
function getTimeAgo(date: string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins === 1) return '1 min ago';
  if (diffMins < 60) return `${diffMins} mins ago`;
  if (diffHours === 1) return '1 hour ago';
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return '1 day ago';
  return `${diffDays} days ago`;
}

export function DashboardContent({
  user,
  bots,
  recentSubmissions = [],
  submissionTrend = []
}: {
  user: User;
  bots: any[] | null;
  recentSubmissions?: any[];
  submissionTrend?: Array<{ date: string; submissions: number; label: string }>;
}) {
  const router = useRouter();
  const [showBotModal, setShowBotModal] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  // Client-side Supabase for signing out
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
    router.push('/');
  };

  const handleCopyLink = (e: React.MouseEvent, slug: string) => {
    e.preventDefault();
    e.stopPropagation();
    const link = `${window.location.origin}/chat/${slug}`;
    navigator.clipboard.writeText(link);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const handleBotSuccess = () => {
    setShowBotModal(false);
    router.refresh();
  };

  const handleExportCSV = () => {
    if (!bots || bots.length === 0) return;

    // CSV Header
    const headers = ['Bot Name', 'Slug', 'Total Submissions', 'Fields', 'Creation Date', 'Status'];
    const csvRows = [headers.join(',')];

    // CSV Data
    bots.forEach((bot: any) => {
      const submissionCount = bot.submissions?.[0]?.count || 0;
      const fieldCount = getFieldCount(bot.schema);
      const createdDate = new Date(bot.created_at).toLocaleDateString();
      const status = bot.is_active ? 'Active' : 'Inactive';

      const row = [
        `"${bot.name}"`,
        `"${bot.slug}"`,
        submissionCount,
        fieldCount,
        `"${createdDate}"`,
        status
      ];
      csvRows.push(row.join(','));
    });

    // Create CSV string
    const csvString = csvRows.join('\n');

    // Trigger download
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'intakeos-bots-summary.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculate statistics
  const totalBots = bots?.length || 0;
  const totalSubmissions = bots?.reduce((sum, bot) => sum + (bot.submissions?.[0]?.count || 0), 0) || 0;
  const activeBots = bots?.filter(bot => bot.is_active).length || 0;
  const averageFields = totalBots > 0 && bots
    ? Math.round(bots.reduce((sum: number, bot: any) => sum + getFieldCount(bot.schema), 0) / totalBots)
    : 0;

  return (
    <div className="min-h-screen font-sans bg-slate-950 relative overflow-hidden">
      {/* Deep Mesh Background Elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-10 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-10 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-float" style={{animationDelay: '3s'}}></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl animate-float" style={{animationDelay: '1.5s'}}></div>
        <div className="absolute inset-0 bg-grid-pattern opacity-20"></div>
      </div>

      {/* Header - Command Center Style */}
      <header className="bg-slate-950/70 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-500 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/50">I</div>
            <span className="text-xl font-bold text-white">IntakeOS</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-400 hidden md:block">
              {user.email}
            </span>
            <Button
              onClick={() => setShowBotModal(true)}
              className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 shadow-lg shadow-indigo-500/50 hover:shadow-xl transition-all"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Bot
            </Button>
            <Link href="/dashboard/settings">
              <Button
                variant="outline"
                className="bg-white/5 border-white/10 text-slate-200 hover:bg-white/10 hover:border-indigo-500/50 transition-all font-medium shadow-sm hover:shadow-indigo-500/20"
              >
                <Building2 className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Business Profile</span>
              </Button>
            </Link>
            <Button
              variant="ghost"
              onClick={handleSignOut}
              className="text-slate-300 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl relative">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Left Side */}
          <div className="lg:col-span-2 space-y-8">
            {/* Statistics Dashboard */}
            {bots && bots.length > 0 && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                <h2 className="text-2xl font-bold mb-6 text-white">
                  Your Dashboard
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Total Bots */}
                  <Card className="p-6 bg-white/5 border border-white/10 hover:border-indigo-500/50 transition-all shadow-xl hover:shadow-indigo-500/20 backdrop-blur-lg group">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-400 mb-1">Total Bots</p>
                        <p className="text-4xl font-bold text-white mb-2">{totalBots}</p>
                        <p className="text-xs text-slate-500">AI intake forms created</p>
                      </div>
                      <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl shadow-lg shadow-indigo-500/50 group-hover:scale-110 transition-transform">
                        <span className="text-2xl">🤖</span>
                      </div>
                    </div>
                  </Card>

                  {/* Total Submissions */}
                  <Card className="p-6 bg-white/5 border border-white/10 hover:border-emerald-500/50 transition-all shadow-xl hover:shadow-emerald-500/20 backdrop-blur-lg group">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-400 mb-1">Total Submissions</p>
                        <p className="text-4xl font-bold text-white mb-2">{totalSubmissions}</p>
                        <p className="text-xs text-slate-500">Client responses collected</p>
                      </div>
                      <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl shadow-lg shadow-emerald-500/50 group-hover:scale-110 transition-transform">
                        <span className="text-2xl">📊</span>
                      </div>
                    </div>
                  </Card>

                  {/* Active Bots */}
                  <Card className="p-6 bg-white/5 border border-white/10 hover:border-cyan-500/50 transition-all shadow-xl hover:shadow-cyan-500/20 backdrop-blur-lg group">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-400 mb-1">Active Bots</p>
                        <p className="text-4xl font-bold text-white mb-2">{activeBots}</p>
                        <p className="text-xs text-slate-500">Currently accepting responses</p>
                      </div>
                      <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl shadow-lg shadow-cyan-500/50 group-hover:scale-110 transition-transform">
                        <span className="text-2xl">✓</span>
                      </div>
                    </div>
                  </Card>

                  {/* Average Fields */}
                  <Card className="p-6 bg-white/5 border border-white/10 hover:border-orange-500/50 transition-all shadow-xl hover:shadow-orange-500/20 backdrop-blur-lg group">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-400 mb-1">Avg Fields/Bot</p>
                        <p className="text-4xl font-bold text-white mb-2">{averageFields}</p>
                        <p className="text-xs text-slate-500">Questions per intake form</p>
                      </div>
                      <div className="p-3 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl shadow-lg shadow-orange-500/50 group-hover:scale-110 transition-transform">
                        <span className="text-2xl">📝</span>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {/* Submission Performance Chart */}
            {bots && bots.length > 0 && submissionTrend.length > 0 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
                <Card className="p-6 bg-white/5 border border-white/10 backdrop-blur-lg shadow-xl">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg shadow-lg shadow-indigo-500/50">
                      <TrendingUp className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Submission Performance</h3>
                      <p className="text-sm text-slate-400">Last 7 days at a glance</p>
                    </div>
                  </div>

                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={submissionTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="submissionGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#6366f1" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis
                          dataKey="label"
                          stroke="#94a3b8"
                          tick={{ fill: '#94a3b8', fontSize: 12 }}
                        />
                        <YAxis
                          stroke="#94a3b8"
                          tick={{ fill: '#94a3b8', fontSize: 12 }}
                          allowDecimals={false}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'rgba(15, 23, 42, 0.9)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '8px',
                            color: '#fff'
                          }}
                          labelStyle={{ color: '#94a3b8' }}
                        />
                        <Area
                          type="monotone"
                          dataKey="submissions"
                          stroke="#6366f1"
                          strokeWidth={2}
                          fill="url(#submissionGradient)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                        <span className="text-slate-300">Daily Submissions</span>
                      </div>
                      <span className="text-slate-400">
                        Total this week: <span className="font-bold text-white">{submissionTrend.reduce((sum, day) => sum + day.submissions, 0)}</span>
                      </span>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Existing Bots Grid */}
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold tracking-tight text-white">Your Bots</h2>
                <div className="flex items-center gap-3">
                  {bots && bots.length > 0 && (
                    <>
                      <Button
                        onClick={handleExportCSV}
                        variant="outline"
                        size="sm"
                        className="bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-emerald-500/50 hover:text-emerald-300 transition-all"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Quick Export (CSV)
                      </Button>
                      <span className="text-sm font-medium px-3 py-1 bg-white/10 backdrop-blur-lg rounded-full border border-white/10 text-slate-300">
                        {bots.length} total
                      </span>
                    </>
                  )}
                </div>
              </div>

              {!bots || bots.length === 0 ? (
                <Card className="p-16 text-center bg-white/5 backdrop-blur-lg border-dashed border-2 border-white/10 hover:bg-white/10 transition-colors">
                  <div className="text-6xl mb-4 grayscale opacity-50">🤖</div>
                  <h3 className="text-xl font-semibold mb-2 text-white">No bots yet</h3>
                  <p className="text-slate-400 mb-6">Create your first AI intake bot to get started</p>
                  <Button
                    onClick={() => setShowBotModal(true)}
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 shadow-lg shadow-indigo-500/50"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Bot
                  </Button>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {bots.map((bot: any, index: number) => {
                    const submissionCount = bot.submissions?.[0]?.count || 0;

                    // Cycle through vibrant color schemes - Now for borders and glows
                    const colorSchemes = [
                      {
                        border: 'border-indigo-500/30',
                        hoverBorder: 'hover:border-indigo-500/60',
                        shadow: 'hover:shadow-indigo-500/20',
                        text: 'text-indigo-400',
                        gradient: 'from-indigo-500 via-purple-500 to-pink-500',
                      },
                      {
                        border: 'border-cyan-500/30',
                        hoverBorder: 'hover:border-cyan-500/60',
                        shadow: 'hover:shadow-cyan-500/20',
                        text: 'text-cyan-400',
                        gradient: 'from-cyan-500 via-blue-500 to-indigo-500',
                      },
                      {
                        border: 'border-pink-500/30',
                        hoverBorder: 'hover:border-pink-500/60',
                        shadow: 'hover:shadow-pink-500/20',
                        text: 'text-pink-400',
                        gradient: 'from-pink-500 via-rose-500 to-red-500',
                      },
                      {
                        border: 'border-orange-500/30',
                        hoverBorder: 'hover:border-orange-500/60',
                        shadow: 'hover:shadow-orange-500/20',
                        text: 'text-orange-400',
                        gradient: 'from-orange-500 via-amber-500 to-yellow-500',
                      },
                      {
                        border: 'border-emerald-500/30',
                        hoverBorder: 'hover:border-emerald-500/60',
                        shadow: 'hover:shadow-emerald-500/20',
                        text: 'text-emerald-400',
                        gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
                      },
                      {
                        border: 'border-purple-500/30',
                        hoverBorder: 'hover:border-purple-500/60',
                        shadow: 'hover:shadow-purple-500/20',
                        text: 'text-purple-400',
                        gradient: 'from-purple-500 via-fuchsia-500 to-pink-500',
                      },
                    ];

                    const colors = colorSchemes[index % colorSchemes.length];

                    return (
                      <div key={bot.id}>
                        <Card className={`p-6 bg-slate-900/40 backdrop-blur-lg border ${colors.border} ${colors.hoverBorder} hover:shadow-2xl ${colors.shadow} transition-all duration-300 group relative overflow-hidden flex flex-col`}>
                          {/* Animated Gradient Top Line */}
                          <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${colors.gradient} opacity-60 group-hover:opacity-100 transition-opacity duration-300 animate-gradient`} />

                          {/* Main clickable area */}
                          <div
                            onClick={() => router.push(`/dashboard/bots/${bot.id}`)}
                            className="cursor-pointer"
                          >
                            <div className="flex items-start justify-between mb-4 mt-2">
                              <div className="flex-1 min-w-0 pr-4">
                                <h3 className={`font-bold text-xl mb-2 truncate text-white group-hover:scale-105 transition-transform origin-left`}>
                                  {bot.name}
                                </h3>
                                <p className={`text-xs text-slate-400 font-mono truncate bg-black/20 inline-block px-2 py-1 rounded border border-white/10`}>
                                  {bot.slug}
                                </p>
                              </div>
                              <Badge
                                variant={bot.is_active ? "default" : "secondary"}
                                className={`ml-2 flex-shrink-0 ${bot.is_active ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0 shadow-lg shadow-emerald-500/30' : 'bg-slate-700 text-slate-300'}`}
                              >
                                {bot.is_active ? "✓ Active" : "Inactive"}
                              </Badge>
                            </div>

                            <div className="space-y-3 pt-2 flex-1">
                              <div className="flex items-center justify-between text-sm p-2 bg-white/5 backdrop-blur-lg rounded-lg border border-white/10">
                                <span className="text-slate-300 font-medium">Submissions</span>
                                <span className={`font-bold text-lg ${colors.text} bg-white/10 px-3 py-1 rounded-full`}>
                                  {submissionCount}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-sm p-2 bg-white/5 backdrop-blur-lg rounded-lg border border-white/10">
                                <span className="text-slate-300 font-medium">Fields</span>
                                <span className="font-bold text-white">
                                  {getFieldCount(bot.schema)}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-sm p-2 bg-white/5 backdrop-blur-lg rounded-lg border border-white/10">
                                <span className="text-slate-300 font-medium">Created</span>
                                <span className="text-slate-400 text-xs font-medium" suppressHydrationWarning>
                                  {new Date(bot.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Quick Actions Footer */}
                          <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between gap-2">
                              <Link
                                href={`/dashboard/bots/${bot.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-indigo-500/50 rounded-lg transition-all text-slate-300 hover:text-white text-sm font-medium group/action"
                              >
                                <BarChart3 className="h-4 w-4 group-hover/action:scale-110 transition-transform" />
                                <span>Activity</span>
                              </Link>
                              <Link
                                href={`/dashboard/bots/${bot.id}?tab=settings`}
                                onClick={(e) => e.stopPropagation()}
                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/50 rounded-lg transition-all text-slate-300 hover:text-white text-sm font-medium group/action"
                              >
                                <Settings className="h-4 w-4 group-hover/action:rotate-90 transition-transform" />
                                <span>Settings</span>
                              </Link>
                              <button
                                onClick={(e) => handleCopyLink(e, bot.slug)}
                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500/50 rounded-lg transition-all text-slate-300 hover:text-white text-sm font-medium group/action"
                              >
                                <Link2 className={`h-4 w-4 transition-transform ${copiedSlug === bot.slug ? 'scale-125 text-green-400' : 'group-hover/action:scale-110'}`} />
                                <span>{copiedSlug === bot.slug ? 'Copied!' : 'Copy'}</span>
                              </button>
                            </div>
                        </Card>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Live Activity Feed - Right Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="flex items-center gap-2 mb-6">
                <Clock className="h-5 w-5 text-indigo-400" />
                <h2 className="text-xl font-bold text-white">Live Activity</h2>
              </div>

              <Card className="bg-white/5 backdrop-blur-lg border border-white/10 p-6 shadow-xl">
                {recentSubmissions && recentSubmissions.length > 0 ? (
                  <div className="space-y-3">
                    {recentSubmissions.map((submission: any) => (
                      <Link
                        key={submission.id}
                        href={`/dashboard/submissions/${submission.id}`}
                        className="block p-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-indigo-500/50 rounded-lg transition-all group"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 rounded-full bg-emerald-400 mt-2 flex-shrink-0 animate-pulse"></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white font-medium truncate group-hover:text-indigo-300 transition-colors">
                              New submission for{' '}
                              <span className="font-bold">{submission.bots?.name || 'Unknown Bot'}</span>
                            </p>
                            <p className="text-xs text-slate-400 mt-1" suppressHydrationWarning>
                              {getTimeAgo(submission.created_at)}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                      <Clock className="h-8 w-8 text-slate-500" />
                    </div>
                    <p className="text-slate-400 text-sm">No recent activity</p>
                    <p className="text-slate-500 text-xs mt-1">New submissions will appear here</p>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Bot Generator Modal */}
      {showBotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowBotModal(false)}
          />

          {/* Modal Content */}
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="sticky top-0 bg-slate-900/95 backdrop-blur-xl border-b border-white/10 p-6 flex items-center justify-between z-10">
              <div>
                <h2 className="text-2xl font-bold text-white">Create New Bot</h2>
                <p className="text-slate-400 text-sm mt-1">Describe what information you need and AI will build your intake form</p>
              </div>
              <button
                onClick={() => setShowBotModal(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <BotGenerator user={user} onSuccess={handleBotSuccess} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
