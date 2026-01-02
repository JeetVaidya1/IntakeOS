'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { BotGenerator } from '../components/BotGenerator';
import { User } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';
import { Building2, Plus, X } from 'lucide-react';
import { OnboardingChecklist } from './components/OnboardingChecklist';
import { StatsOverview } from './components/StatsOverview';
import { SubmissionChart } from './components/SubmissionChart';
import { BotList } from './components/BotList';
import { ActivityFeed } from './components/ActivityFeed';

export function DashboardContent({
  user,
  bots,
  recentSubmissions = [],
  submissionTrend = [],
  businessProfile = null
}: {
  user: User;
  bots: any[] | null;
  recentSubmissions?: any[];
  submissionTrend?: Array<{ date: string; submissions: number; label: string }>;
  businessProfile?: any;
}) {
  const router = useRouter();
  const [showBotModal, setShowBotModal] = useState(false);

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

  const handleBotSuccess = () => {
    setShowBotModal(false);
    router.refresh();
  };

  // Calculate total submissions for OnboardingChecklist
  const totalSubmissions = bots?.reduce((sum, bot) => sum + (bot.submissions?.[0]?.count || 0), 0) || 0;

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
            {/* Onboarding Checklist */}
            <OnboardingChecklist
              businessProfile={businessProfile}
              bots={bots}
              totalSubmissions={totalSubmissions}
              onCreateBot={() => setShowBotModal(true)}
            />

            {/* Statistics Dashboard */}
            <StatsOverview bots={bots} />

            {/* Submission Performance Chart */}
            <SubmissionChart submissionTrend={submissionTrend} />

            {/* Bot List */}
            <BotList
              bots={bots}
              onCreateBot={() => setShowBotModal(true)}
            />
          </div>

          {/* Live Activity Feed - Right Sidebar */}
          <div className="lg:col-span-1">
            <ActivityFeed recentSubmissions={recentSubmissions} />
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
