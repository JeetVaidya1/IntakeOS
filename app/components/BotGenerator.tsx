'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';
import { DescriptionStep } from './generator/DescriptionStep';
import { BlueprintReview } from './generator/BlueprintReview';

interface FieldDefinition {
  key: string;
  description: string;
  critical: boolean;
  example: string;
  type: string;
  behavior: 'strict' | 'conversational';
}

interface BotBlueprint {
  botTaskName: string;
  goal: string;
  system_prompt: string;
  required_info: Record<string, any>;
}

export function BotGenerator({ user, onSuccess }: { user: User; onSuccess?: () => void }) {
  const [step, setStep] = useState<'description' | 'blueprint'>('description');
  const [description, setDescription] = useState('');
  const [businessProfile, setBusinessProfile] = useState<{ business_name: string; business_type: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  
  // Blueprint Review State
  const [blueprint, setBlueprint] = useState<BotBlueprint | null>(null);
  const [finalizing, setFinalizing] = useState(false);

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

  const handleGenerate = async (descriptionText: string) => {
    if (!user) {
      router.push('/auth/signup');
      return;
    }

    if (!descriptionText.trim()) {
      alert('Please describe what information you need');
      return;
    }

    setDescription(descriptionText);
    setLoading(true);

    try {
      const response = await fetch('/api/generate-bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: descriptionText, previewOnly: true }),
      });

      const data = await response.json();

      if (data.schema) {
        // Show blueprint review instead of redirecting
        const blueprintData: BotBlueprint = {
          botTaskName: data.botTaskName || 'Intake Bot',
          goal: data.schema.goal || '',
          system_prompt: data.schema.system_prompt || '',
          required_info: data.schema.required_info || {},
        };

        setBlueprint(blueprintData);
        setStep('blueprint');
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

  const handleFinalize = async (
    editableName: string,
    editableGoal: string,
    editableFields: FieldDefinition[]
  ) => {
    if (!blueprint) return;

    setFinalizing(true);

    try {
      // Convert editable fields back to required_info format
      const required_info: Record<string, any> = {};
      editableFields.forEach(field => {
        required_info[field.key] = {
          description: field.description,
          critical: field.critical,
          example: field.example,
          type: field.type,
          behavior: field.behavior,
        };
      });

      const finalSchema = {
        goal: editableGoal,
        system_prompt: blueprint.system_prompt,
        required_info,
        schema_version: 'agentic_v1',
      };

      const response = await fetch('/api/finalize-bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botTaskName: editableName,
          description,
          schema: finalSchema,
        }),
      });

      const data = await response.json();

      if (data.botId) {
        onSuccess?.();
        router.push(`/dashboard/bots/${data.botId}`);
      } else {
        alert('Error: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Something went wrong. Check the console for details.');
    } finally {
      setFinalizing(false);
    }
  };

  const handleBackToEdit = () => {
    setStep('description');
    setBlueprint(null);
  };

  // 1. Sign Up View (Dark Glass)
  if (!user) {
    return (
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-12 text-center relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 animate-gradient" />
        <div className="text-6xl mb-6 animate-bounce">🤖</div>
        <h2 className="text-4xl font-bold mb-4 text-white">Ready to create your bot?</h2>
        <p className="text-slate-300 mb-10 text-lg font-medium">Sign up free to start collecting perfect data.</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/auth/signup">
            <Button size="lg" className="h-14 px-10 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 hover:from-indigo-600 hover:via-purple-600 hover:to-cyan-600 shadow-xl shadow-indigo-500/50 rounded-full">
              Sign Up Free
            </Button>
          </Link>
          <Link href="/auth/login">
            <Button variant="outline" size="lg" className="h-14 px-10 rounded-full bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20">
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // 2. Blueprint Review View
  if (step === 'blueprint' && blueprint) {
    return (
      <BlueprintReview
        blueprint={blueprint}
        onBack={handleBackToEdit}
        onFinalize={handleFinalize}
        finalizing={finalizing}
      />
    );
  }

  // 3. Generator View (Description Step)
  return (
    <DescriptionStep
      businessProfile={businessProfile}
      onGenerate={handleGenerate}
      loading={loading}
      loadingProfile={loadingProfile}
    />
  );
}
