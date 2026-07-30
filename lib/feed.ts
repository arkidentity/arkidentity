import { supabase } from '@/lib/supabase';

// Shared types + data access for the Ministry Feed.

export type PostStatus = 'draft' | 'approved' | 'published';
export type MediaType = 'photo' | 'audio' | 'video';

export interface MediaItem {
  url: string;
  type: MediaType;
  // Set for embedded video links (YouTube/Vimeo). When absent, a `video` item is
  // an uploaded file served by <video>. When present, it's an embedded player.
  provider?: 'youtube' | 'vimeo';
}

export interface Post {
  id: string;
  status: PostStatus;
  headline: string | null;
  raw_media_url: string | null;
  media_type: MediaType | null;
  transcript: string | null;
  draft_text: string | null;
  final_text: string | null;
  display_media_url: string | null;
  media: MediaItem[];
  created_at: string;
  approved_at: string | null;
  published_at: string | null;
  drive_file_id?: string | null;
}

// Short plain-text excerpt for link previews / email.
export function postExcerpt(post: Post, max = 200): string {
  const body = (post.final_text || post.draft_text || '').replace(/\s+/g, ' ').trim();
  return body.length > max ? body.slice(0, max - 1).trimEnd() + '…' : body;
}

// The post's lead photo URL (for OG images / email), or null.
export function postLeadImage(post: Post): string | null {
  const photo = (post.media ?? []).find((m) => m.type === 'photo');
  if (photo) return photo.url;
  if (post.media_type === 'photo') return post.display_media_url || post.raw_media_url;
  return null;
}

// A single published post by id (or null). Reads via anon key; RLS limits to
// published.
export async function getPublishedPost(id: string): Promise<Post | null> {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('id', id)
    .eq('status', 'published')
    .maybeSingle();
  if (error) {
    console.error('getPublishedPost failed:', error.message);
    return null;
  }
  return (data as Post) ?? null;
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
