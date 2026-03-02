'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ensureProfile } from '@/lib/auth';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const displayName =
            session.user.user_metadata?.full_name ||
            session.user.user_metadata?.name ||
            null;
          await ensureProfile(session.user.id, session.user.email || '', displayName);
          router.replace('/journal');
        } else {
          router.replace('/login');
        }
      } catch {
        router.replace('/login');
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--primary-color)' }}>
      <p className="text-white/60 text-sm">Signing you in...</p>
    </div>
  );
}
