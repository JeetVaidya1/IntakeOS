import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import { ChatInterface } from './ChatInterface';

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

  return (
    <div className={`min-h-screen ${isWidget ? 'bg-transparent' : 'bg-gradient-to-b from-slate-50 to-slate-100'}`}>
      {/* Header - Only show if NOT a widget */}
      {!isWidget && (
        <header className="border-b bg-white">
          <div className="container mx-auto px-4 py-4">
            <h1 className="text-xl font-semibold text-slate-900">{bot.name}</h1>
            <p className="text-sm text-slate-500">Complete your intake form</p>
          </div>
        </header>
      )}

      {/* Chat Interface - Remove padding if widget to use full iframe space */}
      <main className={isWidget ? 'p-0 h-screen' : 'container mx-auto px-4 py-8 max-w-3xl'}>
        <ChatInterface bot={bot} />
      </main>
    </div>
  );
}