import { supabase } from '@/lib/supabase';
import type { MediaItem, MediaType } from '@/lib/feed';

// Client-side media upload shared by the composer and the post editor.
// Uploads a file straight to Supabase Storage via a server-minted signed URL
// (bypasses the serverless request-body limit for large video).

export const MEDIA_BUCKET = 'feed-media';
// Keep uploads within the Supabase per-file limit. Long video goes to YouTube
// and is pasted as a link instead. Raise if you bump the plan.
export const MAX_FILE_MB = 50;

export function mediaTypeForFile(file: File): MediaType | null {
  if (file.type.startsWith('image/')) return 'photo';
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('audio/')) return 'audio';
  return null;
}

export async function uploadFileToStorage(file: File): Promise<MediaItem> {
  const type = mediaTypeForFile(file);
  if (!type) throw new Error(`Unsupported file: ${file.name}`);

  const signRes = await fetch('/api/admin/media/sign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename: file.name, contentType: file.type }),
  });
  if (!signRes.ok) {
    throw new Error((await signRes.json().catch(() => ({}))).error || `Could not sign ${file.name}`);
  }
  const { path, token, publicUrl } = await signRes.json();

  const { error: upErr } = await supabase.storage
    .from(MEDIA_BUCKET)
    .uploadToSignedUrl(path, token, file, { contentType: file.type });
  if (upErr) throw new Error(`${file.name}: ${upErr.message}`);

  return { url: publicUrl, type };
}
