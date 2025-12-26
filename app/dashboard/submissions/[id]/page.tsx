import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SubmissionActions } from './SubmissionActions';
import { isAgenticSchema, isLegacySchema } from '@/types/agentic';

// Helper function to get a human-readable label from either schema type
function getFieldLabel(key: string, schema: any): string {
  // Legacy schema (array of fields)
  if (isLegacySchema(schema)) {
    const field = schema.find((f: any) => f.id === key);
    return field?.label || formatKey(key);
  }

  // Agentic schema (object with required_info)
  if (isAgenticSchema(schema)) {
    const info = schema.required_info[key];
    return info?.description || formatKey(key);
  }

  // Fallback: format the key nicely
  return formatKey(key);
}

// Format snake_case keys into Title Case
function formatKey(key: string): string {
  return key
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

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
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Vibrant Background Shapes */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        {/* Large colorful circles with blur for atmospheric effect */}
        <div className="absolute top-20 left-10 w-96 h-96 bg-indigo-500 rounded-full opacity-60 blur-3xl animate-float"></div>
        <div className="absolute top-40 right-20 w-[500px] h-[500px] bg-purple-500 rounded-full opacity-50 blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-32 left-1/4 w-[450px] h-[450px] bg-pink-500 rounded-full opacity-55 blur-3xl animate-float" style={{animationDelay: '4s'}}></div>
        <div className="absolute top-1/3 right-1/3 w-[400px] h-[400px] bg-cyan-500 rounded-full opacity-50 blur-3xl animate-float" style={{animationDelay: '1s'}}></div>

        {/* Geometric squares with blur */}
        <div className="absolute bottom-40 right-10 w-64 h-64 bg-orange-500 opacity-55 blur-3xl rotate-45 animate-float" style={{animationDelay: '3s'}}></div>
        <div className="absolute top-1/2 left-20 w-72 h-72 bg-teal-500 rounded-full opacity-50 blur-3xl animate-float" style={{animationDelay: '5s'}}></div>

        {/* Pattern overlay - reduced opacity */}
        <div className="absolute inset-0 bg-pattern-dots opacity-10"></div>
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
        <Card className="p-6 mb-8 border-2 border-purple-200 bg-gradient-to-br from-purple-50/50 to-pink-50/50 shadow-xl hover:shadow-2xl transition-shadow">
          <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-6">Collected Information</h2>
          <div className="space-y-4">
            {Object.entries(submission.data).map(([key, value]) => {
              // Get label using helper function (handles both legacy and agentic schemas)
              const label = getFieldLabel(key, submission.bot.schema);

              // Check if value is an image
              const isImage = typeof value === 'string' && value.startsWith('[IMAGE] ');
              const imageUrl = isImage ? value.replace('[IMAGE] ', '') : null;

              return (
                <div key={key} className="border-b pb-4">
                  <div className="text-sm text-slate-500 mb-1">{label}</div>
                  {isImage && imageUrl ? (
                    <div className="mt-2">
                      <img
                        src={imageUrl}
                        alt={label}
                        className="max-w-full max-h-96 rounded-lg border-2 border-purple-200 shadow-lg hover:shadow-xl transition-shadow"
                      />
                      <a
                        href={imageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-2 text-sm text-indigo-600 hover:text-indigo-800 hover:underline"
                      >
                        Open full size →
                      </a>
                    </div>
                  ) : (
                    <div className="font-medium">{String(value)}</div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {/* Full Conversation */}
        <Card className="p-6 border-2 border-indigo-200 bg-gradient-to-br from-indigo-50/50 to-cyan-50/50 shadow-xl hover:shadow-2xl transition-shadow">
          <h2 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent mb-6">Full Conversation</h2>
          <div className="space-y-4">
            {submission.conversation && submission.conversation.length > 0 ? (
              submission.conversation.map((message: any, index: number) => {
                // Check if message contains an image
                const isImage = message.content.startsWith('[IMAGE] ');
                const imageUrl = isImage ? message.content.replace('[IMAGE] ', '') : null;

                return (
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
                      {isImage && imageUrl ? (
                        <div>
                          <img
                            src={imageUrl}
                            alt="Uploaded image"
                            className="max-w-full max-h-64 rounded-lg border border-white/20 mb-1"
                          />
                          <p className="text-xs opacity-70">Image uploaded</p>
                        </div>
                      ) : (
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-slate-500">
                <p className="text-sm">No conversation history available.</p>
                <p className="text-xs mt-2">This may be a legacy submission created before conversational tracking was enabled.</p>
              </div>
            )}
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
