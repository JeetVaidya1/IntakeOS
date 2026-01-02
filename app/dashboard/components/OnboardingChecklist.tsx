'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, X, CheckCircle2, Circle } from 'lucide-react';

export function OnboardingChecklist({
  businessProfile,
  bots,
  totalSubmissions,
  onCreateBot,
}: {
  businessProfile: any;
  bots: any[] | null;
  totalSubmissions: number;
  onCreateBot: () => void;
}) {
  const [isDismissed, setIsDismissed] = useState(false);

  // Load dismissed state from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const dismissed = localStorage.getItem('intakeos_onboarding_dismissed');
      setIsDismissed(dismissed === 'true');
    }
  }, []);

  // Calculate progress
  const step1Complete = businessProfile && businessProfile.business_description && businessProfile.business_description.length > 0;
  const step2Complete = bots && bots.length > 0;
  const step3Complete = totalSubmissions > 0;
  const step4Complete = step3Complete; // Fallback: if they've tested, assume deployed

  const completedSteps = [step1Complete, step2Complete, step3Complete, step4Complete].filter(Boolean).length;
  const allComplete = completedSteps === 4;

  const handleDismiss = () => {
    localStorage.setItem('intakeos_onboarding_dismissed', 'true');
    setIsDismissed(true);
  };

  // Don't show if dismissed
  if (isDismissed) return null;

  const firstBotId = bots && bots.length > 0 ? bots[0].id : null;

  return (
    <Card className="p-6 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-500/30 backdrop-blur-xl shadow-2xl shadow-indigo-500/20 animate-in fade-in slide-in-from-top-4 duration-700">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg shadow-lg shadow-indigo-500/50">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Getting Started with IntakeOS</h3>
            <div className="flex items-center gap-2 mt-1">
              <div className="h-2 w-48 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                  style={{ width: `${(completedSteps / 4) * 100}%` }}
                />
              </div>
              <span className="text-sm font-medium text-indigo-300">{completedSteps}/4 Complete</span>
            </div>
          </div>
        </div>
        {allComplete && (
          <Button
            onClick={handleDismiss}
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-white hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Step 1: Complete Business Profile */}
        <div className={`p-4 rounded-lg border transition-all ${step1Complete ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/10'}`}>
          <div className="flex items-start gap-3">
            {step1Complete ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            ) : (
              <Circle className="h-5 w-5 text-slate-400 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-white mb-1">Complete Business Profile</h4>
              <p className="text-xs text-slate-400 mb-2">Tell us about your business so AI can create smarter bots</p>
              {!step1Complete && (
                <Link href="/dashboard/settings">
                  <Button size="sm" variant="outline" className="text-xs bg-white/5 border-white/20 hover:bg-white/10 hover:border-indigo-500/50">
                    Go to Settings →
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Step 2: Create First Bot */}
        <div className={`p-4 rounded-lg border transition-all ${step2Complete ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/10'}`}>
          <div className="flex items-start gap-3">
            {step2Complete ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            ) : (
              <Circle className="h-5 w-5 text-slate-400 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-white mb-1">Create Your First AI Bot</h4>
              <p className="text-xs text-slate-400 mb-2">Generate an intake form that talks like a human</p>
              {!step2Complete && (
                <Button
                  onClick={onCreateBot}
                  size="sm"
                  variant="outline"
                  className="text-xs bg-white/5 border-white/20 hover:bg-white/10 hover:border-indigo-500/50"
                >
                  Create Bot →
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Step 3: Test Drive */}
        <div className={`p-4 rounded-lg border transition-all ${step3Complete ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/10'}`}>
          <div className="flex items-start gap-3">
            {step3Complete ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            ) : (
              <Circle className="h-5 w-5 text-slate-400 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-white mb-1">Run a Test Drive</h4>
              <p className="text-xs text-slate-400 mb-2">Try your bot in simulator mode before going live</p>
              {!step3Complete && firstBotId && (
                <Link href={`/dashboard/bots/${firstBotId}?tab=settings`}>
                  <Button size="sm" variant="outline" className="text-xs bg-white/5 border-white/20 hover:bg-white/10 hover:border-indigo-500/50">
                    Open Test Drive →
                  </Button>
                </Link>
              )}
              {!step3Complete && !firstBotId && (
                <span className="text-xs text-slate-500 italic">Create a bot first</span>
              )}
            </div>
          </div>
        </div>

        {/* Step 4: Deploy to Website */}
        <div className={`p-4 rounded-lg border transition-all ${step4Complete ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/10'}`}>
          <div className="flex items-start gap-3">
            {step4Complete ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            ) : (
              <Circle className="h-5 w-5 text-slate-400 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-white mb-1">Deploy to Your Website</h4>
              <p className="text-xs text-slate-400 mb-2">Get the embed code and start collecting leads</p>
              {!step4Complete && firstBotId && (
                <Link href={`/dashboard/bots/${firstBotId}`}>
                  <Button size="sm" variant="outline" className="text-xs bg-white/5 border-white/20 hover:bg-white/10 hover:border-indigo-500/50">
                    Get Embed Code →
                  </Button>
                </Link>
              )}
              {!step4Complete && !firstBotId && (
                <span className="text-xs text-slate-500 italic">Create a bot first</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Pro Tip Footer */}
      <div className="pt-4 border-t border-white/10">
        <div className="flex items-start gap-2 text-sm">
          <span className="text-lg">💡</span>
          <p className="text-slate-300">
            <span className="font-semibold text-indigo-300">Pro Tip:</span> Upload a PDF of your price list in the Business Profile so your bot can handle quote inquiries automatically!
          </p>
        </div>
      </div>
    </Card>
  );
}

