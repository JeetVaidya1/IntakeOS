'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Building2, Save, Loader2, Sparkles } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Basic fields
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [industry, setIndustry] = useState('');

  // Enhanced fields
  const [businessDescription, setBusinessDescription] = useState('');
  const [productsServices, setProductsServices] = useState('');
  const [location, setLocation] = useState('');
  const [website, setWebsite] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [uniqueSellingPoints, setUniqueSellingPoints] = useState('');

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
        setBusinessName(profile.business_name || '');
        setBusinessType(profile.business_type || '');
        setIndustry(profile.industry || '');
        setBusinessDescription(profile.business_description || '');
        setProductsServices(profile.products_services || '');
        setLocation(profile.location || '');
        setWebsite(profile.website || '');
        setTargetAudience(profile.target_audience || '');
        setUniqueSellingPoints(profile.unique_selling_points || '');
      }

      setLoading(false);
    }

    loadProfile();
  }, []);

  const handleSave = async () => {
    if (!userId || !businessName.trim() || !businessType.trim()) {
      alert('Please fill in all required fields (Business Name and Business Type)');
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
        business_description: businessDescription.trim() || null,
        products_services: productsServices.trim() || null,
        location: location.trim() || null,
        website: website.trim() || null,
        target_audience: targetAudience.trim() || null,
        unique_selling_points: uniqueSellingPoints.trim() || null,
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
              Business Profile
            </h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="p-8 border-2 border-indigo-200 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 shadow-xl hover:shadow-2xl transition-shadow">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl shadow-lg">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Your Business Profile
              </h2>
              <p className="text-sm text-slate-600 flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-purple-500" />
                This context powers all your AI bots
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Basic Information Section */}
            <div className="bg-white/60 rounded-xl p-6 border border-indigo-100">
              <h3 className="font-semibold text-lg text-indigo-900 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                </div>

                <div>
                  <Label htmlFor="businessType" className="text-slate-700 font-medium">
                    Business Type <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="businessType"
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    placeholder="e.g., Photography Studio"
                    className="mt-1.5 border-indigo-200 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <Label htmlFor="industry" className="text-slate-700 font-medium">
                    Industry
                  </Label>
                  <Input
                    id="industry"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    placeholder="e.g., Wedding Photography"
                    className="mt-1.5 border-indigo-200 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <Label htmlFor="location" className="text-slate-700 font-medium">
                    Location
                  </Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g., Austin, TX"
                    className="mt-1.5 border-indigo-200 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="website" className="text-slate-700 font-medium">
                    Website
                  </Label>
                  <Input
                    id="website"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="e.g., https://sarahsphotography.com"
                    type="url"
                    className="mt-1.5 border-indigo-200 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Enhanced Context Section */}
            <div className="bg-gradient-to-br from-purple-50/60 to-pink-50/60 rounded-xl p-6 border border-purple-100">
              <h3 className="font-semibold text-lg text-purple-900 mb-2 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                AI Context (Makes your bots smarter!)
              </h3>
              <p className="text-sm text-slate-600 mb-4">
                The more detail you provide, the better your bots will understand your business and have natural conversations.
              </p>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="businessDescription" className="text-slate-700 font-medium">
                    Business Description
                  </Label>
                  <Textarea
                    id="businessDescription"
                    value={businessDescription}
                    onChange={(e) => setBusinessDescription(e.target.value)}
                    placeholder="Describe what your business does, your story, and your approach..."
                    rows={3}
                    className="mt-1.5 border-purple-200 focus:border-purple-500 focus:ring-purple-500"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    e.g., "We specialize in candid wedding photography that captures authentic moments..."
                  </p>
                </div>

                <div>
                  <Label htmlFor="productsServices" className="text-slate-700 font-medium">
                    Products/Services Offered
                  </Label>
                  <Textarea
                    id="productsServices"
                    value={productsServices}
                    onChange={(e) => setProductsServices(e.target.value)}
                    placeholder="What do you sell or offer?"
                    rows={3}
                    className="mt-1.5 border-purple-200 focus:border-purple-500 focus:ring-purple-500"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    e.g., "Wedding photography packages, engagement shoots, photo albums, prints..."
                  </p>
                </div>

                <div>
                  <Label htmlFor="targetAudience" className="text-slate-700 font-medium">
                    Target Audience
                  </Label>
                  <Input
                    id="targetAudience"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    placeholder="Who do you serve?"
                    className="mt-1.5 border-purple-200 focus:border-purple-500 focus:ring-purple-500"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    e.g., "Couples getting married in Texas"
                  </p>
                </div>

                <div>
                  <Label htmlFor="uniqueSellingPoints" className="text-slate-700 font-medium">
                    What Makes You Special
                  </Label>
                  <Textarea
                    id="uniqueSellingPoints"
                    value={uniqueSellingPoints}
                    onChange={(e) => setUniqueSellingPoints(e.target.value)}
                    placeholder="What sets you apart from competitors?"
                    rows={2}
                    className="mt-1.5 border-purple-200 focus:border-purple-500 focus:ring-purple-500"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    e.g., "15 years of experience, featured in Wedding Magazine, unlimited revisions..."
                  </p>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-4">
              <Button
                onClick={handleSave}
                disabled={saving || !businessName.trim() || !businessType.trim()}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-500/30 disabled:opacity-50 h-12 text-base"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Saving Profile...
                  </>
                ) : saved ? (
                  <>
                    <Save className="h-5 w-5 mr-2" />
                    Saved Successfully!
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5 mr-2" />
                    Save Business Profile
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}
