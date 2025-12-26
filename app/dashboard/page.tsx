import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { DashboardContent } from './DashboardContent';

export default async function DashboardPage() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/auth/login');
  }

  // Fetch bots for this user
  const { data: bots } = await supabase
    .from('bots')
    .select('*, submissions(count)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // Fetch 10 most recent submissions across all bots for this user
  const { data: recentSubmissions } = await supabase
    .from('submissions')
    .select(`
      id,
      created_at,
      bot_id,
      bots (
        name
      )
    `)
    .in('bot_id', bots?.map(b => b.id) || [])
    .order('created_at', { ascending: false })
    .limit(10);

  return <DashboardContent user={user} bots={bots} recentSubmissions={recentSubmissions || []} />;
}
