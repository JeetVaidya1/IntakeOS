import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import { ChatInterfaceWrapper } from './ChatInterfaceWrapper';

export default async function ChatPage({ 
  params,
  searchParams, 
}: { 
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { slug } = await params;
  const { mode } = await searchParams;
  const isWidget = mode === 'widget';

  // Fetch bot by slug (using anon key - bots table has public read policy)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: bot, error } = await supabase
    .from('bots')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error || !bot) {
    notFound();
  }

  // Fetch business profile using service role key to bypass RLS
  // This is safe because business_name is public information that should be displayed
  const supabaseService = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  const { data: businessProfile, error: profileError } = await supabaseService
    .from('business_profiles')
    .select('business_name')
    .eq('user_id', bot.user_id)
    .maybeSingle();

  if (profileError) {
    console.error('Error fetching business profile:', profileError);
  }

  // Use business name from profile - this should always exist since profile is required
  // If not found, something is wrong - log it but provide a fallback for display
  const displayName = businessProfile?.business_name;

  if (!displayName) {
    console.error('⚠️ Business profile not found for bot owner:', bot.user_id, 'Bot:', bot.id);
    console.error('Profile error:', profileError);
  }

  // Ensure we have a string value (fallback should rarely be needed)
  const finalDisplayName = displayName || 'Business';

  return (
    <div className={`min-h-screen ${isWidget ? 'bg-transparent' : 'bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50'}`}>
      {/* Header - Only show if NOT a widget */}
      {!isWidget && (
        <header className="border-b border-slate-200/60 bg-white/80 backdrop-blur-sm shadow-sm">
          <div className="container mx-auto px-4 py-5">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
              {finalDisplayName}
            </h1>
          </div>
        </header>
      )}

      {/* Chat Interface - Remove padding if widget to use full iframe space */}
      <main className={isWidget ? 'p-0 h-screen' : 'container mx-auto px-4 py-8 max-w-3xl'}>
        <ChatInterfaceWrapper bot={bot} businessName={finalDisplayName} />
      </main>
    </div>
  );
}