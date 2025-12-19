import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { SignOutButton } from '../components/SignOutButton';
import { DashboardContent } from './DashboardContent';

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
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/dashboard" className="text-2xl font-bold text-indigo-600">
            Intake OS
          </Link>
          
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-sm text-slate-600">
              {user.email}
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>

      <DashboardContent user={user} bots={bots} />
    </div>
  );
}