'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Save, Loader2 } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [industry, setIndustry] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Fetch user and business profile
  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/auth/login');
        return;
      }

      setUserId(user.id);

      // Try to fetch existing business profile
      const { data: profile } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        setBusinessName(profile.business_name);
        setBusinessType(profile.business_type);
        setIndustry(profile.industry || '');
      }

      setLoading(false);
    }

    loadProfile();
  }, []);

  const handleSave = async () => {
    if (!userId || !businessName.trim() || !businessType.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from('business_profiles')
      .upsert({
        user_id: userId,
        business_name: businessName.trim(),
        business_type: businessType.trim(),
        industry: industry.trim() || null,
      }, { onConflict: 'user_id' });

    if (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile');
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Vibrant Background Shapes */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-20 left-10 w-96 h-96 bg-indigo-500 rounded-full opacity-60 blur-3xl animate-float"></div>
        <div className="absolute top-40 right-20 w-[500px] h-[500px] bg-purple-500 rounded-full opacity-50 blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-32 left-1/4 w-[450px] h-[450px] bg-pink-500 rounded-full opacity-55 blur-3xl animate-float" style={{animationDelay: '4s'}}></div>
        <div className="absolute top-1/3 right-1/3 w-[400px] h-[400px] bg-cyan-500 rounded-full opacity-50 blur-3xl animate-float" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-40 right-10 w-64 h-64 bg-orange-500 opacity-55 blur-3xl rotate-45 animate-float" style={{animationDelay: '3s'}}></div>
        <div className="absolute top-1/2 left-20 w-72 h-72 bg-teal-500 rounded-full opacity-50 blur-3xl animate-float" style={{animationDelay: '5s'}}></div>
        <div className="absolute inset-0 bg-pattern-dots opacity-10"></div>
      </div>

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-purple-200/50 sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-slate-600 hover:text-indigo-600 transition-colors font-medium"
            >
              ← Back to Dashboard
            </button>
            <div className="h-6 w-px bg-purple-200" />
            <h1 className="font-bold text-xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Business Settings
            </h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="p-8 border-2 border-indigo-200 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 shadow-xl hover:shadow-2xl transition-shadow">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl shadow-lg">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Your Business Profile
              </h2>
              <p className="text-sm text-slate-600">
                This information will be used across all your bots
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <Label htmlFor="businessName" className="text-slate-700 font-medium">
                Business Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="businessName"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g., Sarah's Photography"
                className="mt-1.5 border-indigo-200 focus:border-indigo-500 focus:ring-indigo-500"
              />
              <p className="text-xs text-slate-500 mt-1">
                This stays the same across all your bots
              </p>
            </div>

            <div>
              <Label htmlFor="businessType" className="text-slate-700 font-medium">
                Business Type <span className="text-red-500">*</span>
              </Label>
              <Input
                id="businessType"
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                placeholder="e.g., Photography Studio, Plumbing Services"
                className="mt-1.5 border-indigo-200 focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div>
              <Label htmlFor="industry" className="text-slate-700 font-medium">
                Industry (Optional)
              </Label>
              <Input
                id="industry"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g., Wedding Photography, Home Services"
                className="mt-1.5 border-indigo-200 focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div className="pt-4">
              <Button
                onClick={handleSave}
                disabled={saving || !businessName.trim() || !businessType.trim()}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-500/30 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : saved ? (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Saved!
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Profile
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>

        {/* Helper Card */}
        <Card className="mt-6 p-6 border-2 border-purple-200/50 bg-gradient-to-br from-purple-50/30 to-pink-50/30">
          <h3 className="font-semibold text-purple-900 mb-2">💡 How this works</h3>
          <ul className="text-sm text-slate-700 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-purple-600 font-bold">•</span>
              <span><strong>Business Name</strong> is your company identity (e.g., "Sarah's Photography")</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 font-bold">•</span>
              <span><strong>Bot Name</strong> is the task/use case (e.g., "Wedding Inquiries", "Portrait Bookings")</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 font-bold">•</span>
              <span>When users chat with any bot, they'll see your business name</span>
            </li>
          </ul>
        </Card>
      </main>
    </div>
  );
}
