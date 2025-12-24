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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-indigo-600">
            Intake OS
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16 max-w-3xl">
        {/* Success Message */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-4xl font-bold mb-2">Your Bot is Live!</h1>
          <p className="text-slate-600 mb-4">Here's what to do next:</p>

          {/* Primary Actions */}
          <div className="flex gap-3 justify-center mb-6">
            <Link href={`/chat/${bot.slug}`} target="_blank">
              <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700">
                Test Your Bot →
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="outline">
                Go to Dashboard
              </Button>
            </Link>
          </div>
        </div>

        {/* Share Link */}
        <Card className="p-6 mb-8">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Share this link:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={fullUrl}
              readOnly
              className="flex-1 px-4 py-2 border rounded-md bg-slate-50 text-slate-900"
            />
            <CopyButton text={fullUrl} />
          </div>
        </Card>

        {/* QR CODE */}
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-center">QR Code</h2>
          <p className="text-sm text-slate-600 text-center mb-6">
            Clients can scan this to access your intake form instantly
          </p>
          <div className="flex justify-center">
            <QRCode url={fullUrl} />
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
        <div className="mt-12 p-6 bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-200 rounded-lg">
          <h3 className="font-semibold text-indigo-900 mb-3 flex items-center gap-2">
            <span className="text-xl">🎯</span>
            What's Next?
          </h3>
          <div className="space-y-3 text-sm text-indigo-900">
            <div className="flex items-start gap-2">
              <span className="font-semibold">1.</span>
              <span><strong>Test it:</strong> Click "Test Your Bot" above to see how it works</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold">2.</span>
              <span><strong>Share it:</strong> Copy the link and send it to clients via SMS or email</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold">3.</span>
              <span><strong>Embed it:</strong> Add the script to your website for instant access</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold">4.</span>
              <span><strong>Get notified:</strong> Check your email when submissions arrive, or view them in your <Link href="/dashboard" className="text-indigo-600 underline">Dashboard</Link></span>
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