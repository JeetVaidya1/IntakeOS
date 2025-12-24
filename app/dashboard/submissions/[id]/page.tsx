import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SubmissionActions } from './SubmissionActions';

export default async function SubmissionDetailPage({ 
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

  // Fetch submission with bot info
  const { data: submission, error } = await supabase
    .from('submissions')
    .select(`
      *,
      bot:bots(*)
    `)
    .eq('id', id)
    .single();

  if (error || !submission) {
    console.error('Error:', error);
    notFound();
  }

  // Verify ownership
  if (submission.bot.user_id !== user.id) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-cyan-50/30 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-20 right-1/4 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 left-1/4 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl animate-float" style={{animationDelay: '3s'}}></div>
        <div className="absolute inset-0 bg-pattern-dots"></div>
      </div>

      {/* Header */}
      <header className="border-b border-purple-200/50 bg-white/80 backdrop-blur-lg shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href={`/dashboard/bots/${submission.bot.id}`}>
              <Button variant="ghost" size="sm" className="hover:bg-purple-50">
                ← Back to Bot
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Submission Details</h1>
              <p className="text-sm text-slate-600 font-medium">
                {new Date(submission.created_at).toLocaleString()}
              </p>
            </div>
            <Badge variant={submission.status === 'new' ? 'default' : 'secondary'} className={submission.status === 'new' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0 shadow-lg' : ''}>
              {submission.status}
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Collected Data */}
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6">Collected Information</h2>
          <div className="space-y-4">
            {Object.entries(submission.data).map(([key, value]) => {
              // Find the field label from bot schema
              const field = submission.bot.schema.find((f: any) => f.id === key);
              const label = field?.label || key;

              return (
                <div key={key} className="border-b pb-4">
                  <div className="text-sm text-slate-500 mb-1">{label}</div>
                  <div className="font-medium">{String(value)}</div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Full Conversation */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-6">Full Conversation</h2>
          <div className="space-y-4">
            {submission.conversation.map((message: any, index: number) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-900'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Actions */}
        <SubmissionActions
          submissionId={submission.id}
          botId={submission.bot.id}
          currentStatus={submission.status}
          submissionData={submission.data}
          botSchema={submission.bot.schema}
        />
      </main>
    </div>
  );
}
