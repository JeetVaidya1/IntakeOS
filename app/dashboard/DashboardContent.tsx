'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BotGenerator } from '../components/BotGenerator';
import { User } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';
import { isAgenticSchema, isLegacySchema } from '@/types/agentic';

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

export function DashboardContent({ 
  user, 
  bots 
}: { 
  user: User; 
  bots: any[] | null;
}) {
  const router = useRouter();
  
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

  // Calculate statistics
  const totalBots = bots?.length || 0;
  const totalSubmissions = bots?.reduce((sum, bot) => sum + (bot.submissions?.[0]?.count || 0), 0) || 0;
  const activeBots = bots?.filter(bot => bot.is_active).length || 0;
  const averageFields = totalBots > 0 && bots
    ? Math.round(bots.reduce((sum: number, bot: any) => sum + getFieldCount(bot.schema), 0) / totalBots)
    : 0;

  return (
    <div className="min-h-screen font-sans relative overflow-hidden">
      {/* Snowfall Effect */}
      <div className="snowfall-container">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="snowflake">❄</div>
        ))}
      </div>

      {/* Animated Background Elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-10 right-1/4 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-10 left-1/4 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl animate-float" style={{animationDelay: '3s'}}></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-400/10 rounded-full blur-3xl animate-float" style={{animationDelay: '1.5s'}}></div>
        <div className="absolute inset-0 bg-pattern-dots"></div>
      </div>

      {/* ✅ RESTORED: The Header with Sign Out */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-purple-200/50 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/30 animate-gradient">I</div>
            <span className="text-xl font-bold gradient-text-vibrant">IntakeOS</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500 hidden md:block">
              {user.email}
            </span>
            <Link href="/dashboard/settings">
              <Button
                variant="ghost"
                className="text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
              >
                Settings
              </Button>
            </Link>
            <Button
              variant="ghost"
              onClick={handleSignOut}
              className="text-slate-600 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl relative">
        {/* Statistics Dashboard */}
        {bots && bots.length > 0 && (
          <div className="mb-12 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Your Dashboard
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Total Bots */}
              <Card className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 hover:border-indigo-300 transition-all shadow-lg hover:shadow-xl hover:scale-105 duration-300 group">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-indigo-600 mb-1">Total Bots</p>
                    <p className="text-4xl font-bold text-indigo-900 mb-2">{totalBots}</p>
                    <p className="text-xs text-slate-500">AI intake forms created</p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                    <span className="text-2xl">🤖</span>
                  </div>
                </div>
              </Card>

              {/* Total Submissions */}
              <Card className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 hover:border-emerald-300 transition-all shadow-lg hover:shadow-xl hover:scale-105 duration-300 group">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-emerald-600 mb-1">Total Submissions</p>
                    <p className="text-4xl font-bold text-emerald-900 mb-2">{totalSubmissions}</p>
                    <p className="text-xs text-slate-500">Client responses collected</p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                    <span className="text-2xl">📊</span>
                  </div>
                </div>
              </Card>

              {/* Active Bots */}
              <Card className="p-6 bg-gradient-to-br from-cyan-50 to-blue-50 border-2 border-cyan-200 hover:border-cyan-300 transition-all shadow-lg hover:shadow-xl hover:scale-105 duration-300 group">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-cyan-600 mb-1">Active Bots</p>
                    <p className="text-4xl font-bold text-cyan-900 mb-2">{activeBots}</p>
                    <p className="text-xs text-slate-500">Currently accepting responses</p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                    <span className="text-2xl">✓</span>
                  </div>
                </div>
              </Card>

              {/* Average Fields */}
              <Card className="p-6 bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200 hover:border-orange-300 transition-all shadow-lg hover:shadow-xl hover:scale-105 duration-300 group">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-orange-600 mb-1">Avg Fields/Bot</p>
                    <p className="text-4xl font-bold text-orange-900 mb-2">{averageFields}</p>
                    <p className="text-xs text-slate-500">Questions per intake form</p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                    <span className="text-2xl">📝</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Create New Bot Section */}
        <div className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-3 mb-3">
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">Create New Bot</h1>
            <div className="flex h-2 w-2 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 animate-pulse"></div>
          </div>
          <p className="text-slate-600 mb-6 text-lg">Describe what information you need and AI will build your intake form</p>
          <BotGenerator user={user} />
        </div>

        {/* Existing Bots Grid */}
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Your Bots</h2>
            {bots && bots.length > 0 && (
              <span className="text-sm font-medium px-3 py-1 bg-white rounded-full border shadow-sm text-slate-600">
                {bots.length} active
              </span>
            )}
          </div>

          {!bots || bots.length === 0 ? (
            <Card className="p-16 text-center bg-white/50 border-dashed border-2 border-slate-200 hover:bg-white/80 transition-colors">
              <div className="text-6xl mb-4 grayscale opacity-50">👆</div>
              <h3 className="text-xl font-semibold mb-2 text-slate-900">Create your first bot above</h3>
              <p className="text-slate-500">Once created, it will appear here</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bots.map((bot: any, index: number) => {
                const submissionCount = bot.submissions?.[0]?.count || 0;

                // Cycle through vibrant color schemes
                const colorSchemes = [
                  {
                    gradient: 'from-indigo-500 via-purple-500 to-pink-500',
                    bg: 'bg-gradient-to-br from-indigo-50 to-purple-50',
                    border: 'border-indigo-200',
                    text: 'text-indigo-600',
                    shadow: 'shadow-indigo-glow',
                    hoverBorder: 'hover:border-indigo-400'
                  },
                  {
                    gradient: 'from-cyan-500 via-blue-500 to-indigo-500',
                    bg: 'bg-gradient-to-br from-cyan-50 to-blue-50',
                    border: 'border-cyan-200',
                    text: 'text-cyan-600',
                    shadow: 'shadow-cyan-glow',
                    hoverBorder: 'hover:border-cyan-400'
                  },
                  {
                    gradient: 'from-pink-500 via-rose-500 to-red-500',
                    bg: 'bg-gradient-to-br from-pink-50 to-rose-50',
                    border: 'border-pink-200',
                    text: 'text-pink-600',
                    shadow: 'shadow-pink-glow',
                    hoverBorder: 'hover:border-pink-400'
                  },
                  {
                    gradient: 'from-orange-500 via-amber-500 to-yellow-500',
                    bg: 'bg-gradient-to-br from-orange-50 to-amber-50',
                    border: 'border-orange-200',
                    text: 'text-orange-600',
                    shadow: 'shadow-orange-glow',
                    hoverBorder: 'hover:border-orange-400'
                  },
                  {
                    gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
                    bg: 'bg-gradient-to-br from-emerald-50 to-teal-50',
                    border: 'border-emerald-200',
                    text: 'text-emerald-600',
                    shadow: 'shadow-lg',
                    hoverBorder: 'hover:border-emerald-400'
                  },
                  {
                    gradient: 'from-purple-500 via-fuchsia-500 to-pink-500',
                    bg: 'bg-gradient-to-br from-purple-50 to-fuchsia-50',
                    border: 'border-purple-200',
                    text: 'text-purple-600',
                    shadow: 'shadow-purple-glow',
                    hoverBorder: 'hover:border-purple-400'
                  },
                ];

                const colors = colorSchemes[index % colorSchemes.length];

                return (
                  <Link key={bot.id} href={`/dashboard/bots/${bot.id}`}>
                    <Card className={`p-6 h-full cursor-pointer ${colors.bg} backdrop-blur-sm border-2 ${colors.border} ${colors.hoverBorder} hover:shadow-2xl ${colors.shadow} transition-all duration-300 group relative overflow-hidden`}>
                      {/* Animated Gradient Top Line */}
                      <div className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r ${colors.gradient} opacity-80 group-hover:opacity-100 transition-opacity duration-300 animate-gradient`} />

                      <div className="flex items-start justify-between mb-4 mt-2">
                        <div className="flex-1 min-w-0 pr-4">
                          <h3 className={`font-bold text-xl mb-2 truncate ${colors.text} group-hover:scale-105 transition-transform origin-left`}>
                            {bot.name}
                          </h3>
                          <p className={`text-xs text-slate-500 font-mono truncate ${colors.bg} inline-block px-2 py-1 rounded border ${colors.border}`}>
                            {bot.slug}
                          </p>
                        </div>
                        <Badge
                          variant={bot.is_active ? "default" : "secondary"}
                          className={`ml-2 flex-shrink-0 ${bot.is_active ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0 shadow-lg shadow-emerald-500/30' : 'bg-slate-200 text-slate-600'}`}
                        >
                          {bot.is_active ? "✓ Active" : "Inactive"}
                        </Badge>
                      </div>

                      <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between text-sm p-2 bg-white/50 rounded-lg border border-white/60">
                          <span className="text-slate-600 font-medium">Submissions</span>
                          <span className={`font-bold text-lg ${colors.text} bg-white px-3 py-1 rounded-full shadow-sm`}>
                            {submissionCount}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm p-2 bg-white/30 rounded-lg">
                          <span className="text-slate-600 font-medium">Fields</span>
                          <span className="font-bold text-slate-800">
                            {getFieldCount(bot.schema)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm p-2 bg-white/30 rounded-lg">
                          <span className="text-slate-600 font-medium">Created</span>
                          <span className="text-slate-500 text-xs font-medium" suppressHydrationWarning>
                            {new Date(bot.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="mt-6 pt-4 border-t border-white/60">
                        <span className={`${colors.text} opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 flex items-center gap-2 font-semibold text-sm`}>
                          Manage Bot
                          <span className="text-lg">→</span>
                        </span>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}