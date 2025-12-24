import { createClient } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CopyButton } from './CopyButton';
import { QRCode } from './QRcode';

export default async function PreviewPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  // Await params (Next.js 15 requirement)
  const { id } = await params;

  // Create Supabase client (without auth for now - public read)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Fetch bot from database
  const { data: bot, error } = await supabase
    .from('bots')
    .select('*')
    .eq('id', id)
    .single();

  // If bot doesn't exist, show 404
  if (error || !bot) {
    console.error('Bot fetch error:', error);
    notFound();
  }

  const fullUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/chat/${bot.slug}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-10 left-1/4 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-pink-400/20 rounded-full blur-3xl animate-float" style={{animationDelay: '4s'}}></div>
        <div className="absolute inset-0 bg-pattern-dots"></div>
      </div>

      {/* Header */}
      <header className="border-b border-purple-200/50 bg-white/80 backdrop-blur-lg shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/30 animate-gradient">I</div>
            <span className="text-2xl font-bold gradient-text-vibrant">Intake OS</span>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16 max-w-3xl relative">
        {/* Success Message */}
        <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="text-8xl mb-6 animate-bounce">🎉</div>
          <h1 className="text-5xl md:text-6xl font-bold mb-4 gradient-text-vibrant animate-gradient">Your Bot is Live!</h1>
          <p className="text-xl text-slate-600 mb-8 font-medium">Here's what to do next:</p>

          {/* Primary Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <Link href={`/chat/${bot.slug}`} target="_blank">
              <Button size="lg" className="h-14 px-10 text-base bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 shadow-xl shadow-purple-500/30 rounded-full animate-gradient group">
                Test Your Bot
                <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="outline" className="h-14 px-10 text-base rounded-full glass-vibrant border-2 border-purple-200 hover:border-purple-300 hover:shadow-lg hover:shadow-purple-500/20">
                Go to Dashboard
              </Button>
            </Link>
          </div>
        </div>

        {/* Share Link */}
        <Card className="p-8 mb-8 glass-vibrant border-2 border-indigo-200 shadow-xl shadow-indigo-500/10 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">🔗</span>
            <label className="block text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Share this link
            </label>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={fullUrl}
              readOnly
              className="flex-1 px-4 py-3 border-2 border-indigo-200 rounded-xl bg-white/80 text-slate-900 font-mono text-sm focus:outline-none focus:border-indigo-400 transition-colors"
            />
            <CopyButton text={fullUrl} />
          </div>
        </Card>

        {/* QR CODE */}
        <Card className="p-8 mb-8 glass-vibrant border-2 border-purple-200 shadow-xl shadow-purple-500/10 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-2xl">📱</span>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">QR Code</h2>
          </div>
          <p className="text-sm text-slate-600 text-center mb-8 font-medium">
            Clients can scan this to access your intake form instantly
          </p>
          <div className="flex justify-center">
            <div className="p-6 bg-white rounded-2xl shadow-lg border-2 border-purple-200">
              <QRCode url={fullUrl} />
            </div>
          </div>
        </Card>

        {/* Bot Details */}
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Bot Configuration</h2>
          
          <div className="space-y-3">
            <div>
              <span className="text-sm text-slate-500">Name:</span>
              <p className="font-medium">{bot.name}</p>
            </div>
            
            <div>
              <span className="text-sm text-slate-500">Slug:</span>
              <p className="font-mono text-sm">{bot.slug}</p>
            </div>

            <div>
              <span className="text-sm text-slate-500">Description:</span>
              <p className="text-sm">{bot.description}</p>
            </div>
          </div>
        </Card>

        {/* Fields Preview */}
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">
            Your bot will ask for ({bot.schema.length} fields):
          </h2>
          
          <div className="space-y-3">
            {bot.schema.map((field: any, index: number) => (
              <div key={field.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-400 font-mono text-sm">{index + 1}.</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{field.label}</span>
                    {field.required && (
                      <Badge variant="secondary" className="text-xs">Required</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{field.type}</Badge>
                    {field.placeholder && (
                      <span className="text-xs text-slate-500">
                        e.g., {field.placeholder}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Embed Code */}
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Embed on Your Website</h2>
          <p className="text-sm text-slate-600 mb-4">
            Copy this code and paste it into your website's HTML:
          </p>
          <div className="bg-slate-900 p-4 rounded-lg overflow-x-auto">
            <code className="text-green-400 text-xs font-mono">
              {`<script src="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/widget.js"
        data-bot-slug="${bot.slug}"
        data-color="#4F46E5"
        async>
</script>`}
            </code>
          </div>
          <CopyButton
            text={`<script src="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/widget.js" data-bot-slug="${bot.slug}" data-color="#4F46E5" async></script>`}
            className="mt-3"
          />
        </Card>

        {/* Next Steps */}
        <div className="mt-12 p-8 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border-2 border-purple-300 rounded-2xl shadow-xl shadow-purple-500/10 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500">
          <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-6 flex items-center gap-3">
            <span className="text-3xl">🎯</span>
            What's Next?
          </h3>
          <div className="space-y-4 text-base">
            <div className="flex items-start gap-4 p-4 bg-white/60 rounded-xl border border-indigo-200 hover:border-indigo-300 transition-colors">
              <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">1</span>
              <span className="text-slate-700 font-medium"><strong className="text-indigo-700">Test it:</strong> Click "Test Your Bot" above to see how it works</span>
            </div>
            <div className="flex items-start gap-4 p-4 bg-white/60 rounded-xl border border-purple-200 hover:border-purple-300 transition-colors">
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">2</span>
              <span className="text-slate-700 font-medium"><strong className="text-purple-700">Share it:</strong> Copy the link and send it to clients via SMS or email</span>
            </div>
            <div className="flex items-start gap-4 p-4 bg-white/60 rounded-xl border border-pink-200 hover:border-pink-300 transition-colors">
              <span className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-indigo-600 bg-clip-text text-transparent">3</span>
              <span className="text-slate-700 font-medium"><strong className="text-pink-700">Embed it:</strong> Add the script to your website for instant access</span>
            </div>
            <div className="flex items-start gap-4 p-4 bg-white/60 rounded-xl border border-cyan-200 hover:border-cyan-300 transition-colors">
              <span className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-indigo-600 bg-clip-text text-transparent">4</span>
              <span className="text-slate-700 font-medium"><strong className="text-cyan-700">Get notified:</strong> Check your email when submissions arrive, or view them in your <Link href="/dashboard" className="text-indigo-600 underline font-bold hover:text-purple-600 transition-colors">Dashboard</Link></span>
            </div>
          </div>
        </div>

        {/* Secondary Actions */}
        <div className="mt-8 flex gap-4 justify-center">
          <Link href="/">
            <Button variant="ghost" className="text-slate-600">
              ← Create Another Bot
            </Button>
          </Link>
          <Link href={`/dashboard/bots/${bot.id}`}>
            <Button variant="ghost" className="text-slate-600">
              Bot Settings →
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}