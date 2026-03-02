'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { loadUserProfile, signOut as authSignOut, ensureProfile } from '@/lib/auth';

interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  is_admin: boolean;
  [key: string]: unknown;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<{ error: Error | null }>;
  isLoggedIn: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (currentUser: User) => {
    if (!currentUser) {
      setProfile(null);
      return;
    }

    const displayName =
      currentUser.user_metadata?.full_name ||
      currentUser.user_metadata?.name ||
      currentUser.user_metadata?.display_name ||
      null;

    const fallbackProfile: Profile = {
      id: currentUser.id,
      display_name: displayName,
      avatar_url: null,
      is_admin: false,
    };

    try {
      ensureProfile(currentUser.id, currentUser.email || '', displayName)
        .catch((err: unknown) => console.warn('[Auth] ensureProfile (non-critical):', err));

      const profilePromise = loadUserProfile(currentUser.id);
      const timeoutPromise = new Promise<{ data: null }>((resolve) =>
        setTimeout(() => resolve({ data: null }), 5000)
      );

      const { data } = await Promise.race([profilePromise, timeoutPromise]);

      if (data) {
        setProfile(data as Profile);
      } else {
        setProfile(fallbackProfile);
        loadUserProfile(currentUser.id)
          .then(({ data: retryData }) => {
            if (retryData) setProfile(retryData as Profile);
          })
          .catch(() => {});
      }
    } catch (err) {
      console.error('[Auth] fetchProfile error:', err);
      setProfile(fallbackProfile);
    }
  }, []);

  const handlePendingJournalEntry = useCallback(() => {
    if (typeof window === 'undefined') return;

    const pending = localStorage.getItem('ark_pending_journal_entry');
    if (pending) {
      try {
        const entry = JSON.parse(pending);
        const existingRaw = localStorage.getItem('ark_journal_entries');
        const existing = existingRaw ? JSON.parse(existingRaw) : [];

        const newEntry = {
          ...entry,
          id: Date.now(),
          createdAt: entry.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        existing.push(newEntry);
        localStorage.setItem('ark_journal_entries', JSON.stringify(existing));
        localStorage.removeItem('ark_pending_journal_entry');
      } catch (e) {
        console.error('[Auth] Failed to recover pending journal entry:', e);
      }
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          setLoading(false);
          await fetchProfile(session.user);
          handlePendingJournalEntry();
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('[Auth] Init error:', error);
        setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          setLoading(false);
          fetchProfile(session.user).catch((err) =>
            console.error('[Auth] fetchProfile error in onAuthStateChange:', err)
          );
          if (event === 'SIGNED_IN') {
            handlePendingJournalEntry();
          }
        } else {
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile, handlePendingJournalEntry]);

  const signOut = useCallback(async () => {
    const { error } = await authSignOut();
    if (!error) {
      setUser(null);
      setProfile(null);
    }
    return { error: error as Error | null };
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, isLoggedIn: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
