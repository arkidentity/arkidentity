import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import type { Post, MediaItem } from '@/lib/feed';

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
  final_text?: string | null;
  transcript?: string | null;
  media?: MediaItem[];
}): Promise<Post> {
  const { data, error } = await getSupabaseAdmin()
    .from('posts')
    .insert({
      status: 'draft',
      final_text: input.final_text ?? null,
      transcript: input.transcript ?? null,
      media: input.media ?? [],
    })
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return data as Post;
}

export async function getPost(id: string): Promise<Post> {
  const { data, error } = await getSupabaseAdmin()
    .from('posts')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  return data as Post;
}

// Generate an AI draft from the post's raw material (transcript / caption).
// Writes draft_text, and copies it into final_text when final_text is empty so
// Travis has an editable starting point.
export async function draftPost(id: string): Promise<Post> {
  const post = await getPost(id);
  const rawMaterial = (post.transcript || post.final_text || '').trim();
  if (!rawMaterial) {
    throw new Error('No transcript or notes to draft from.');
  }

  const { draftUpdate } = await import('@/lib/draft');
  const draft = await draftUpdate(rawMaterial);

  const patch: Record<string, unknown> = { draft_text: draft };
  if (!post.final_text?.trim()) patch.final_text = draft;

  const { data, error } = await getSupabaseAdmin()
    .from('posts')
    .update(patch)
    .eq('id', id)
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
