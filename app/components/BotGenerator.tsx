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
      <div className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl shadow-indigo-500/10 p-12 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500" />
        <h2 className="text-3xl font-bold mb-4 text-slate-900">Ready to create your bot?</h2>
        <p className="text-slate-600 mb-8 text-lg">Sign up free to start collecting perfect data.</p>
        <div className="flex gap-4 justify-center">
          <Link href="/auth/signup">
            <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20">
              Sign Up Free
            </Button>
          </Link>
          <Link href="/auth/login">
            <Button variant="outline" size="lg" className="bg-white/50">
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // 2. Generator View (Glass)
  return (
    <div className="bg-white/80 backdrop-blur-xl border border-white/50 rounded-2xl shadow-xl shadow-indigo-500/10 p-8 relative overflow-hidden group">
      {/* Glow Effect behind */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all duration-500" />
      
      <label className="block text-base font-semibold text-slate-800 mb-3 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-indigo-500" />
        Describe your perfect assistant:
      </label>
      
      <div className="relative">
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Example: I'm a wedding photographer. I need the couple's names, wedding date, venue location, estimated guest count, and their budget. I also want to ask if they have a Pinterest board..."
          className="min-h-[160px] mb-6 text-lg p-6 rounded-xl border-slate-200 bg-white/50 focus:bg-white focus:border-indigo-500 focus:ring-indigo-500/20 transition-all resize-none shadow-sm"
        />
      </div>

      <Button
        onClick={handleGenerate}
        disabled={loading}
        className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-lg py-6 shadow-lg shadow-indigo-500/25 rounded-xl transition-all hover:scale-[1.01]"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Generating AI Agent...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            Generate My Bot <span className="text-white/60">→</span>
          </span>
        )}
      </Button>
    </div>
  );
}