import type { MediaItem } from '@/lib/feed';

// Parse a pasted YouTube/Vimeo URL into an embeddable media item. Returns null
// if the URL isn't a recognized video link. Shared by the admin composer (to
// validate before saving) and PostCard (to build the embed src).

export interface ParsedVideoLink {
  provider: 'youtube' | 'vimeo';
  id: string;
  embedUrl: string;
}

export function parseVideoLink(input: string): ParsedVideoLink | null {
  const url = input.trim();
  if (!url) return null;

  // YouTube: watch?v=, youtu.be/, /shorts/, /embed/
  const yt =
    url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  if (yt) {
    return { provider: 'youtube', id: yt[1], embedUrl: `https://www.youtube.com/embed/${yt[1]}` };
  }

  // Vimeo: vimeo.com/<id>
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) {
    return { provider: 'vimeo', id: vimeo[1], embedUrl: `https://player.vimeo.com/video/${vimeo[1]}` };
  }

  return null;
}

// Build the stored media item for a pasted link (keeps the original watch URL so
// it can be reparsed for the embed on render).
export function videoLinkToMedia(input: string): MediaItem | null {
  const parsed = parseVideoLink(input);
  if (!parsed) return null;
  return { url: input.trim(), type: 'video', provider: parsed.provider };
}
