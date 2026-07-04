import { NextResponse } from 'next/server';
import { createPost } from '@/lib/feedAdmin';
import type { MediaItem, MediaType } from '@/lib/feed';

const VALID_TYPES: MediaType[] = ['photo', 'video', 'audio'];

// POST /api/admin/posts — create a draft update: transcript/notes + attached
// media (already uploaded to Storage). Text is drafted later with AI.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    final_text?: string;
    transcript?: string;
    media?: MediaItem[];
  };

  const media: MediaItem[] = Array.isArray(body.media)
    ? body.media
        .filter((m) => m && typeof m.url === 'string' && VALID_TYPES.includes(m.type))
        .map((m) => ({
          url: m.url,
          type: m.type,
          ...(m.provider === 'youtube' || m.provider === 'vimeo'
            ? { provider: m.provider }
            : {}),
        }))
    : [];

  if (!body.final_text?.trim() && !body.transcript?.trim() && media.length === 0) {
    return NextResponse.json(
      { error: 'Add media, or a transcript/notes to draft from.' },
      { status: 400 }
    );
  }

  try {
    const post = await createPost({
      final_text: body.final_text?.trim() || null,
      transcript: body.transcript?.trim() || null,
      media,
    });
    return NextResponse.json({ post }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
