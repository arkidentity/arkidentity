import { supabase } from '@/lib/supabase';

// Shared types + data access for the Ministry Feed.

export type PostStatus = 'draft' | 'approved' | 'published';
export type MediaType = 'photo' | 'audio' | 'video';

export interface Post {
  id: string;
  status: PostStatus;
  raw_media_url: string | null;
  media_type: MediaType | null;
  transcript: string | null;
  draft_text: string | null;
  final_text: string | null;
  display_media_url: string | null;
  created_at: string;
  approved_at: string | null;
  published_at: string | null;
}

// Public feed: published posts, newest first. Reads via the anon key; RLS
// (posts_public_read) already restricts anon to status = 'published'.
export async function getPublishedPosts(): Promise<Post[]> {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  if (error) {
    console.error('getPublishedPosts failed:', error.message);
    return [];
  }
  return (data as Post[]) ?? [];
}
