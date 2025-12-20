'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js'; 
import Link from 'next/link';

// 👇 THIS CHANGE FIXES THE ERROR
export function BotGenerator({ user }: { user: User }) {
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleGenerate = async () => {
    // 1. Use the prop we just passed in
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
        // Redirect to the new bot detail page
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

  // 2. If user is missing, show the "Sign Up" CTA
  if (!user) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Ready to create your bot?</h2>
        <p className="text-slate-600 mb-6">Sign up free to start collecting perfect data</p>
        <div className="flex gap-4 justify-center">
          <Link href="/auth/signup">
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              Sign Up Free
            </Button>
          </Link>
          <Link href="/auth/login">
            <Button variant="outline">
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // 3. If user exists, show the form
  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <label className="block text-sm font-medium text-slate-700 mb-2">
        Describe what information you need from clients:
      </label>
      <Textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Example: I'm a landscaper. I need customer name, email, phone number, property address, lawn size in square feet, photos of their yard, and what services they want like mowing, trimming, or cleanup..."
        className="min-h-[120px] mb-4"
      />
      <Button
        onClick={handleGenerate}
        disabled={loading}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-lg py-6"
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <span className="animate-spin mr-2">⏳</span>
            Generating...
          </span>
        ) : (
          'Generate My Bot →'
        )}
      </Button>
    </div>
  );
}