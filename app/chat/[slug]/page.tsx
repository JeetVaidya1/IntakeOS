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

  // Fetch bot by slug
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

  // Fetch business profile for this bot's owner
  const { data: businessProfile } = await supabase
    .from('business_profiles')
    .select('business_name, business_type')
    .eq('user_id', bot.user_id)
    .single();

  // Use business name if available, fallback to bot name
  const displayName = businessProfile?.business_name || bot.name;

  return (
    <div className={`min-h-screen ${isWidget ? 'bg-transparent' : 'bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50'}`}>
      {/* Header - Only show if NOT a widget */}
      {!isWidget && (
        <header className="border-b border-indigo-200/50 bg-white/80 backdrop-blur-lg shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">{displayName}</h1>
            <p className="text-sm text-slate-500">AI-Powered Consultation</p>
          </div>
        </header>
      )}

      {/* Chat Interface - Remove padding if widget to use full iframe space */}
      <main className={isWidget ? 'p-0 h-screen' : 'container mx-auto px-4 py-8 max-w-3xl'}>
        <ChatInterfaceWrapper bot={bot} businessName={displayName} />
      </main>
    </div>
  );
}