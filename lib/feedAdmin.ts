import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import type { Post } from '@/lib/feed';

// Server-only admin data access for the Ministry Feed. Uses the service-role
// client (bypasses RLS). Only call from /api/admin routes or server components
// that are already behind the middleware password gate.

export async function getAllPosts(): Promise<Post[]> {
  const { data, error } = await getSupabaseAdmin()
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data as Post[]) ?? [];
}

export async function createPost(input: {
  final_text: string;
  media_type?: Post['media_type'];
  raw_media_url?: string | null;
  display_media_url?: string | null;
}): Promise<Post> {
  const { data, error } = await getSupabaseAdmin()
    .from('posts')
    .insert({
      status: 'draft',
      final_text: input.final_text,
      media_type: input.media_type ?? null,
      raw_media_url: input.raw_media_url ?? null,
      display_media_url: input.display_media_url ?? null,
    })
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return data as Post;
}

export async function editPost(id: string, final_text: string): Promise<Post> {
  const { data, error } = await getSupabaseAdmin()
    .from('posts')
    .update({ final_text })
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return data as Post;
}

export async function approvePost(id: string, final_text?: string): Promise<Post> {
  const patch: Record<string, unknown> = {
    status: 'approved',
    approved_at: new Date().toISOString(),
  };
  if (typeof final_text === 'string') patch.final_text = final_text;

  const { data, error } = await getSupabaseAdmin()
    .from('posts')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return data as Post;
}

export async function publishPost(id: string): Promise<Post> {
  const { data, error } = await getSupabaseAdmin()
    .from('posts')
    .update({ status: 'published', published_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return data as Post;
}
