'use client';

import { useRouter } from 'next/navigation';
import { createSupabaseClient } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function SignOutButton() {
  const router = useRouter();
  const supabase = createSupabaseClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success('Signed out successfully');
    router.push('/');
    router.refresh();
  };

  return (
    <Button variant="ghost" size="sm" onClick={handleSignOut}>
      Sign Out
    </Button>
  );
}