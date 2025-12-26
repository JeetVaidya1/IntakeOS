'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import Link from 'next/link';
import { Sparkles, Building2, ChevronDown, ChevronUp, Settings } from 'lucide-react';
import { PromptExamples } from './PromptExamples';
import { createBrowserClient } from '@supabase/ssr';

export function BotGenerator({ user }: { user: User }) {
  const [description, setDescription] = useState('');
  const [businessProfile, setBusinessProfile] = useState<{ business_name: string; business_type: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [showExamples, setShowExamples] = useState(true);
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Fetch business profile from database
  useEffect(() => {
    async function loadBusinessProfile() {
      const { data: profile } = await supabase
        .from('business_profiles')
        .select('business_name, business_type')
        .eq('user_id', user.id)
        .single();

      setBusinessProfile(profile);
      setLoadingProfile(false);
    }

    loadBusinessProfile();
  }, [user.id]);

  const handleGenerate = async () => {
    if (!user) {
      router.push('/auth/signup');
      return;
    }

    if (!description.trim()) {
      alert('Please describe what information you need');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/generate-bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
      });

      const data = await response.json();

      if (data.botId) {
        router.push(`/dashboard/bots/${data.botId}`);
      } else {
        alert('Error: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Something went wrong. Check the console for details.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTemplate = (template: string) => {
    setDescription(template);
    setShowExamples(false);
    // Scroll to generator
    setTimeout(() => {
      document.getElementById('bot-generator')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  // 1. Sign Up View (Glass)
  if (!user) {
    return (
      <div className="glass-vibrant backdrop-blur-xl border-2 border-purple-200 rounded-3xl shadow-2xl shadow-purple-500/20 p-12 text-center relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 animate-gradient" />
        <div className="text-6xl mb-6 animate-bounce">🤖</div>
        <h2 className="text-4xl font-bold mb-4 gradient-text-vibrant">Ready to create your bot?</h2>
        <p className="text-slate-600 mb-10 text-lg font-medium">Sign up free to start collecting perfect data.</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/auth/signup">
            <Button size="lg" className="h-14 px-10 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 shadow-xl shadow-purple-500/30 rounded-full animate-gradient">
              Sign Up Free
            </Button>
          </Link>
          <Link href="/auth/login">
            <Button variant="outline" size="lg" className="h-14 px-10 rounded-full glass-vibrant border-2 border-purple-200 hover:border-purple-300">
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // 2. Generator View (Glass)
  return (
    <div className="space-y-8">
      {/* Show/Hide Examples Toggle */}
      <button
        onClick={() => setShowExamples(!showExamples)}
        className="w-full p-4 glass-vibrant border-2 border-purple-200 rounded-2xl hover:border-purple-300 transition-all group flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <h3 className="font-bold text-lg bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {showExamples ? 'Hide' : 'Show'} Prompt Examples & Templates
            </h3>
            <p className="text-sm text-slate-600">Learn how to create amazing bots with detailed prompts</p>
          </div>
        </div>
        {showExamples ? (
          <ChevronUp className="w-6 h-6 text-purple-600 group-hover:translate-y-[-2px] transition-transform" />
        ) : (
          <ChevronDown className="w-6 h-6 text-purple-600 group-hover:translate-y-[2px] transition-transform" />
        )}
      </button>

      {/* Examples Section */}
      {showExamples && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-500">
          <PromptExamples onSelectTemplate={handleSelectTemplate} />
        </div>
      )}

      {/* Business Profile Setup Prompt */}
      {!loadingProfile && !businessProfile && (
        <div className="glass-vibrant backdrop-blur-xl border-2 border-orange-200 rounded-3xl shadow-2xl shadow-orange-500/20 p-8 bg-gradient-to-br from-orange-50/50 to-amber-50/50">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl shadow-lg">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent mb-2">
                Set Up Your Business Profile First
              </h3>
              <p className="text-slate-700 mb-4">
                Before creating bots, please set up your business profile. This ensures all your bots are associated with your business name.
              </p>
              <Link href="/dashboard/settings">
                <Button className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 shadow-lg shadow-orange-500/30">
                  <Settings className="h-4 w-4 mr-2" />
                  Go to Settings
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Generator Form */}
      {!loadingProfile && businessProfile && (
        <div id="bot-generator" className="glass-vibrant backdrop-blur-xl border-2 border-purple-200 rounded-3xl shadow-2xl shadow-purple-500/20 p-8 relative overflow-hidden group">
        {/* Multiple Glow Effects */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-10 rounded-full blur-3xl group-hover:opacity-20 transition-all duration-500 animate-glow" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-gradient-to-r from-purple-500 to-pink-500 opacity-10 rounded-full blur-3xl group-hover:opacity-20 transition-all duration-500 animate-glow" style={{animationDelay: '1s'}} />

        <div className="relative space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Create Your Bot
            </h2>
          </div>

          {/* Business Profile Display */}
          <div className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-indigo-600" />
                <div>
                  <p className="text-xs text-slate-500 font-medium">Creating bot for:</p>
                  <p className="text-lg font-bold text-indigo-900">{businessProfile.business_name}</p>
                  <p className="text-xs text-slate-600">{businessProfile.business_type}</p>
                </div>
              </div>
              <Link href="/dashboard/settings">
                <Button variant="ghost" size="sm" className="text-indigo-600 hover:bg-indigo-100">
                  <Settings className="h-3 w-3 mr-1" />
                  Edit
                </Button>
              </Link>
            </div>
          </div>

          {/* Description Field */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              What task/use case is this bot for?
            </label>
            <div className="relative">
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Example: I need to collect wedding inquiries - couple's names, wedding date, venue location, estimated guest count, package interest (basic, premium, or luxury), budget range, whether they have a Pinterest board..."
                className="min-h-[200px] text-base p-6 rounded-2xl border-2 border-indigo-200 bg-white/80 focus:bg-white focus:border-purple-400 focus:ring-4 focus:ring-purple-500/20 transition-all resize-none shadow-lg hover:shadow-xl hover:border-indigo-300"
              />
              {/* Character count or helper text */}
              <div className="absolute bottom-3 right-3 text-xs text-slate-400 bg-white/90 px-2 py-1 rounded-full border border-slate-200">
                {description.length > 0 ? `${description.length} characters` : 'Start typing...'}
              </div>
            </div>
            <p className="text-xs text-slate-600 mt-2 flex items-start gap-2">
              <span className="text-emerald-500 flex-shrink-0 mt-0.5">✓</span>
              <span>
                <strong>Pro tip:</strong> Describe the specific information you need for this task. The bot name will be generated from this (e.g., "Wedding Inquiries", "Portrait Bookings").
              </span>
            </p>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-lg font-bold py-7 shadow-2xl shadow-purple-500/30 rounded-2xl transition-all hover:scale-[1.02] hover:shadow-purple-500/40 animate-gradient disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-3">
                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Generating AI Agent...</span>
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5" />
                <span>Generate My Bot</span>
                <span className="text-white/70 group-hover:translate-x-1 transition-transform">→</span>
              </span>
            )}
          </Button>
        </div>
        </div>
      )}
    </div>
  );
}