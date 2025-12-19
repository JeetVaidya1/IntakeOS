import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default async function DashboardPage() {
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

  // Fetch user's bots with submission counts
  const { data: bots, error } = await supabase
    .from('bots')
    .select(`
      *,
      submissions:submissions(count)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching bots:', error);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <Link href="/" className="text-2xl font-bold text-indigo-600">
              Intake OS
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">{user.email}</span>
            <Link href="/">
              <Button variant="outline" size="sm">
                Create New Bot
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">My Bots</h1>
          <p className="text-slate-600">Manage your intake forms and view submissions</p>
        </div>

        {!bots || bots.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="text-6xl mb-4">🤖</div>
            <h2 className="text-2xl font-bold mb-2">No bots yet</h2>
            <p className="text-slate-600 mb-6">Create your first intake bot to start collecting leads</p>
            <Link href="/">
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                Create Your First Bot
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bots.map((bot: any) => {
              const submissionCount = bot.submissions?.[0]?.count || 0;
              
              return (
                <Link key={bot.id} href={`/dashboard/bots/${bot.id}`}>
                  <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg mb-1">{bot.name}</h3>
                        <p className="text-sm text-slate-500 font-mono">{bot.slug}</p>
                      </div>
                      <Badge variant={bot.is_active ? "default" : "secondary"}>
                        {bot.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Submissions:</span>
                        <span className="font-semibold">{submissionCount}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Fields:</span>
                        <span className="font-semibold">{bot.schema.length}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Created:</span>
                        <span className="text-slate-500">
                          {new Date(bot.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t">
                      <Button variant="ghost" size="sm" className="w-full">
                        View Details →
                      </Button>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}