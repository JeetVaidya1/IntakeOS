import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default async function BotDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;

  // Get authenticated user
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Fetch bot
  const { data: bot, error: botError } = await supabase
    .from('bots')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (botError || !bot) {
    notFound();
  }

  // Fetch submissions for this bot
  const { data: submissions, error: submissionsError } = await supabase
    .from('submissions')
    .select('*')
    .eq('bot_id', bot.id)
    .order('created_at', { ascending: false });

  if (submissionsError) {
    console.error('Error fetching submissions:', submissionsError);
  }

  const chatUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/chat/${bot.slug}`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header */}
      <header className="border-b bg-white">
  <div className="container mx-auto px-4 py-4">
    <div className="flex items-center gap-4">
      <Link href="/dashboard">
        <Button variant="ghost" size="sm">
          ← Dashboard
        </Button>
      </Link>
      <div className="flex-1">
        <h1 className="text-xl font-semibold">{bot.name}</h1>
        <p className="text-sm text-slate-500">{bot.slug}</p>
      </div>
      <Badge variant={bot.is_active ? "default" : "secondary"}>
        {bot.is_active ? "Active" : "Inactive"}
      </Badge>
      <Link href="/">
        <Button variant="outline" size="sm">
          + New Bot
        </Button>
      </Link>
    </div>
  </div>
</header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-4">
            <div className="text-sm text-slate-600 mb-1">Total Submissions</div>
            <div className="text-3xl font-bold">{submissions?.length || 0}</div>
          </Card>
          
          <Card className="p-4">
            <div className="text-sm text-slate-600 mb-1">New</div>
            <div className="text-3xl font-bold">
              {submissions?.filter(s => s.status === 'new').length || 0}
            </div>
          </Card>

          <Card className="p-4">
            <div className="text-sm text-slate-600 mb-1">Fields Collected</div>
            <div className="text-3xl font-bold">{bot.schema.length}</div>
          </Card>
        </div>

        {/* Share Link */}
        <Card className="p-6 mb-8">
          <h2 className="font-semibold mb-4">Share Your Intake Form</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={chatUrl}
              readOnly
              className="flex-1 px-4 py-2 border rounded-md bg-slate-50 text-slate-900 text-sm"
            />
            <Button variant="outline">Copy Link</Button>
          </div>
        </Card>

        {/* Submissions Table */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Submissions</h2>
            <Button variant="outline" size="sm">Export CSV</Button>
          </div>

          {!submissions || submissions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📭</div>
              <h3 className="text-lg font-semibold mb-2">No submissions yet</h3>
              <p className="text-slate-600 mb-4">Share your intake form link to start collecting leads</p>
              <Link href={`/chat/${bot.slug}`} target="_blank">
                <Button variant="outline">Test Your Bot</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {submissions.map((submission: any) => {
                const firstField = Object.values(submission.data)[0] as string;
                const email = Object.values(submission.data).find((v: any) => 
                  typeof v === 'string' && v.includes('@')
                ) as string | undefined;

                return (
                  <Link 
                    key={submission.id} 
                    href={`/dashboard/submissions/${submission.id}`}
                  >
                    <div className="p-4 border rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-semibold">{firstField}</span>
                            <Badge 
                              variant={submission.status === 'new' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {submission.status}
                            </Badge>
                          </div>
                          {email && (
                            <p className="text-sm text-slate-600">{email}</p>
                          )}
                          <p className="text-xs text-slate-500 mt-1">
                            {new Date(submission.created_at).toLocaleString()}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm">
                          View →
                        </Button>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
