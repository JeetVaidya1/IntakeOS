'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js'; 
import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export function BotGenerator({ user }: { user: User }) {
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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
    <div className="glass-vibrant backdrop-blur-xl border-2 border-purple-200 rounded-3xl shadow-2xl shadow-purple-500/20 p-8 relative overflow-hidden group">
      {/* Multiple Glow Effects */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-10 rounded-full blur-3xl group-hover:opacity-20 transition-all duration-500 animate-glow" />
      <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-gradient-to-r from-purple-500 to-pink-500 opacity-10 rounded-full blur-3xl group-hover:opacity-20 transition-all duration-500 animate-glow" style={{animationDelay: '1s'}} />

      <label className="block text-xl font-bold mb-4 flex items-center gap-3">
        <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Describe your perfect assistant
        </span>
      </label>

      <div className="relative mb-6">
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Example: I'm a wedding photographer. I need the couple's names, wedding date, venue location, estimated guest count, and their budget. I also want to ask if they have a Pinterest board..."
          className="min-h-[180px] text-lg p-6 rounded-2xl border-2 border-indigo-200 bg-white/80 focus:bg-white focus:border-purple-400 focus:ring-4 focus:ring-purple-500/20 transition-all resize-none shadow-lg hover:shadow-xl hover:border-indigo-300"
        />
        {/* Character count or helper text */}
        <div className="absolute bottom-3 right-3 text-xs text-slate-400 bg-white/90 px-2 py-1 rounded-full border border-slate-200">
          {description.length > 0 ? `${description.length} characters` : 'Start typing...'}
        </div>
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

      {/* Example suggestions */}
      {!description && (
        <div className="mt-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl">
          <p className="text-xs font-semibold text-indigo-700 mb-2">💡 Try these examples:</p>
          <div className="flex flex-wrap gap-2">
            {[
              "Wedding photographer intake",
              "Legal consultation form",
              "Service quote request"
            ].map((example, idx) => (
              <button
                key={idx}
                onClick={() => setDescription(`Create a bot for ${example.toLowerCase()}`)}
                className="text-xs px-3 py-1.5 bg-white border border-indigo-200 rounded-full hover:bg-indigo-50 hover:border-indigo-300 transition-colors font-medium text-indigo-700"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}