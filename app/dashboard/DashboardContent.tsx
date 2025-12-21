'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BotGenerator } from '../components/BotGenerator';
import { User } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';

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

  return (
    <div className="min-h-screen font-sans">
      {/* ✅ RESTORED: The Header with Sign Out */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">I</div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">IntakeOS</span>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500 hidden md:block">
              {user.email}
            </span>
            <Button 
              variant="ghost" 
              onClick={handleSignOut}
              className="text-slate-600 hover:text-red-600 hover:bg-red-50"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Create New Bot Section */}
        <div className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h1 className="text-3xl font-bold mb-2 tracking-tight text-slate-900">Create New Bot</h1>
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
              {bots.map((bot: any) => {
                const submissionCount = bot.submissions?.[0]?.count || 0;
                
                return (
                  <Link key={bot.id} href={`/dashboard/bots/${bot.id}`}>
                    <Card className="p-6 h-full cursor-pointer bg-white/80 backdrop-blur-sm border-slate-200 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 group relative overflow-hidden">
                      {/* Hover Gradient Line */}
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1 min-w-0 pr-4">
                          <h3 className="font-semibold text-lg mb-1 truncate text-slate-900 group-hover:text-indigo-700 transition-colors">
                            {bot.name}
                          </h3>
                          <p className="text-xs text-slate-400 font-mono truncate bg-slate-100 inline-block px-1.5 py-0.5 rounded">
                            {bot.slug}
                          </p>
                        </div>
                        <Badge 
                          variant={bot.is_active ? "default" : "secondary"} 
                          className={`ml-2 flex-shrink-0 ${bot.is_active ? 'bg-green-500/10 text-green-700 hover:bg-green-500/20 border-green-200' : ''}`}
                        >
                          {bot.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>

                      <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between text-sm group/row">
                          <span className="text-slate-500 group-hover/row:text-slate-700 transition-colors">Submissions</span>
                          <span className="font-bold text-slate-900 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                            {submissionCount}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm group/row">
                          <span className="text-slate-500 group-hover/row:text-slate-700 transition-colors">Fields</span>
                          <span className="font-medium text-slate-700">
                            {bot.schema.length}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm group/row">
                          <span className="text-slate-500 group-hover/row:text-slate-700 transition-colors">Created</span>
                          <span className="text-slate-400 text-xs" suppressHydrationWarning>
                            {new Date(bot.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-sm font-medium">
                        <span className="text-indigo-600 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 flex items-center gap-1">
                          Manage Bot →
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