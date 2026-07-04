import { NextResponse } from 'next/server';
import { createPost } from '@/lib/feedAdmin';
import type { MediaType } from '@/lib/feed';

// POST /api/admin/posts — create a manual draft post (Phase 2, text entry).
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    final_text?: string;
    media_type?: MediaType;
    raw_media_url?: string;
    display_media_url?: string;
  };

  if (!body.final_text?.trim()) {
    return NextResponse.json({ error: 'Text is required.' }, { status: 400 });
  }

  try {
    const post = await createPost({
      final_text: body.final_text.trim(),
      media_type: body.media_type,
      raw_media_url: body.raw_media_url || null,
      display_media_url: body.display_media_url || null,
    });
    return NextResponse.json({ post }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
