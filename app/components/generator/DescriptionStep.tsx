'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, ChevronDown, ChevronUp, Building2, Settings } from 'lucide-react';
import { PromptExamples } from '../PromptExamples';

interface DescriptionStepProps {
  businessProfile: { business_name: string; business_type: string } | null;
  onGenerate: (description: string) => void;
  loading: boolean;
  loadingProfile: boolean;
}

export function DescriptionStep({
  businessProfile,
  onGenerate,
  loading,
  loadingProfile,
}: DescriptionStepProps) {
  const [description, setDescription] = useState('');
  const [showExamples, setShowExamples] = useState(false);

  const handleSelectTemplate = (template: string) => {
    setDescription(template);
    setShowExamples(false);
    // Scroll to generator
    setTimeout(() => {
      document.getElementById('bot-generator')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleGenerateClick = () => {
    onGenerate(description);
  };

  return (
    <div className="space-y-8">
      {/* Show/Hide Examples Toggle */}
      <button
        onClick={() => setShowExamples(!showExamples)}
        className="w-full p-4 bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl hover:bg-white/10 hover:border-indigo-500/50 transition-all group flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg shadow-lg shadow-indigo-500/50">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <h3 className="font-bold text-lg text-white">
              {showExamples ? 'Hide' : 'Show'} Prompt Examples & Templates
            </h3>
            <p className="text-sm text-slate-400">Learn how to create amazing bots with detailed prompts</p>
          </div>
        </div>
        {showExamples ? (
          <ChevronUp className="w-6 h-6 text-indigo-400 group-hover:translate-y-[-2px] transition-transform" />
        ) : (
          <ChevronDown className="w-6 h-6 text-indigo-400 group-hover:translate-y-[2px] transition-transform" />
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
        <div className="bg-white/5 backdrop-blur-xl border border-orange-500/30 rounded-3xl shadow-2xl shadow-orange-500/20 p-8">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl shadow-lg shadow-orange-500/50">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-2">
                Set Up Your Business Profile First
              </h3>
              <p className="text-slate-300 mb-4">
                Before creating bots, please set up your business profile. This ensures all your bots are associated with your business name.
              </p>
              <Link href="/dashboard/settings">
                <Button className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-lg shadow-orange-500/50">
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
        <div id="bot-generator" className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-8 relative overflow-hidden group">
          {/* Multiple Glow Effects */}
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-10 rounded-full blur-3xl group-hover:opacity-20 transition-all duration-500 animate-glow" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-gradient-to-r from-purple-500 to-pink-500 opacity-10 rounded-full blur-3xl group-hover:opacity-20 transition-all duration-500 animate-glow" style={{animationDelay: '1s'}} />

          <div className="relative space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg shadow-lg shadow-indigo-500/50">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">
                Create Your Bot
              </h2>
            </div>

            {/* Business Profile Display */}
            <div className="p-4 bg-white/10 backdrop-blur-lg border border-indigo-500/30 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-indigo-400" />
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Creating bot for:</p>
                    <p className="text-lg font-bold text-white">{businessProfile.business_name}</p>
                    <p className="text-xs text-slate-300">{businessProfile.business_type}</p>
                  </div>
                </div>
                <Link href="/dashboard/settings">
                  <Button variant="ghost" size="sm" className="text-indigo-400 hover:bg-white/10">
                    <Settings className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                </Link>
              </div>
            </div>

            {/* Description Field */}
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                What task/use case is this bot for?
              </label>
              <div className="relative">
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Example: I need to collect wedding inquiries - couple's names, wedding date, venue location, estimated guest count, package interest (basic, premium, or luxury), budget range, whether they have a Pinterest board..."
                  className="min-h-[200px] text-base p-6 rounded-2xl border border-white/10 bg-black/20 text-white placeholder:text-slate-400 focus:bg-black/30 focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/20 transition-all resize-none shadow-lg hover:shadow-xl hover:border-white/20"
                />
                {/* Character count or helper text */}
                <div className="absolute bottom-3 right-3 text-xs text-slate-400 bg-black/40 backdrop-blur-lg px-2 py-1 rounded-full border border-white/10">
                  {description.length > 0 ? `${description.length} characters` : 'Start typing...'}
                </div>
              </div>
              <p className="text-xs text-slate-300 mt-2 flex items-start gap-2">
                <span className="text-emerald-400 flex-shrink-0 mt-0.5">✓</span>
                <span>
                  <strong>Pro tip:</strong> Describe the specific information you need for this task. The bot name will be generated from this (e.g., "Wedding Inquiries", "Portrait Bookings").
                </span>
              </p>
            </div>

            <Button
              onClick={handleGenerateClick}
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 hover:from-indigo-600 hover:via-purple-600 hover:to-cyan-600 text-lg font-bold py-7 shadow-2xl shadow-indigo-500/50 rounded-2xl transition-all hover:scale-[1.02] hover:shadow-indigo-500/60 disabled:opacity-50 disabled:cursor-not-allowed group"
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

