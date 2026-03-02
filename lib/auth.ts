import { supabase } from './supabase';

/**
 * Ensure a profiles record exists for the authenticated user.
 * Uses the existing ARK PWA profiles table.
 */
export async function ensureProfile(userId: string, email: string, displayName: string | null) {
  try {
    const { data: existing, error: checkError } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url, is_admin')
      .eq('id', userId)
      .single();

    if (existing) return { data: existing, error: null };

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        display_name: displayName || email?.split('@')[0] || 'User',
        avatar_url: null,
        is_admin: false,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return { data: { id: userId }, error: null };
      }
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('[Auth] Error ensuring profile:', error);
    return { data: null, error };
  }
}

export async function signUpWithEmail(email: string, password: string, displayName: string) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });
    if (error) throw error;

    if (data.user) {
      await ensureProfile(data.user.id, email, displayName);
    }

    return { data, error: null };
  } catch (error) {
    console.error('[Auth] Sign up error:', error);
    return { data: null, error };
  }
}

export async function signInWithEmail(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    if (data.user) {
      await ensureProfile(
        data.user.id,
        data.user.email || '',
        data.user.user_metadata?.display_name
      );
    }

    return { data, error: null };
  } catch (error) {
    console.error('[Auth] Sign in error:', error);
    return { data: null, error };
  }
}

export async function signInWithGoogle() {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: typeof window !== 'undefined'
          ? `${window.location.origin}/auth/callback`
          : 'https://arkidentity.com/auth/callback',
      },
    });
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('[Auth] Google sign in error:', error);
    return { data: null, error };
  }
}

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('[Auth] Sign out error:', error);
    return { error };
  }
}

export async function resetPassword(email: string) {
  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: typeof window !== 'undefined'
        ? `${window.location.origin}/reset-password`
        : undefined,
    });
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('[Auth] Password reset error:', error);
    return { data: null, error };
  }
}

export async function updatePassword(newPassword: string) {
  try {
    const { data, error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('[Auth] Update password error:', error);
    return { data: null, error };
  }
}

export async function loadUserProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url, is_admin')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return { data, error: null };
  } catch (error) {
    console.error('[Auth] Load profile error:', error);
    return { data: null, error };
  }
}

export async function updateUserProfile(userId: string, updates: Record<string, unknown>) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('[Auth] Update profile error:', error);
    return { data: null, error };
  }
}
