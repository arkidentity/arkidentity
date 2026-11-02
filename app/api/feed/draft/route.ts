import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import type { MediaItem } from '@/lib/feed';
import { automationAuthorized } from '@/lib/automationToken';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

// POST /api/feed/draft — the Monday partner-update interview drops a DRAFT here.
// Draft-only by design: it can sign photo uploads and create a draft post, nothing
// else. Travis reviews and publishes in /admin. Auth: Bearer FEED_DRAFT_TOKEN.
//
//   { sign: { filename } }                     → { path, signedUrl }  (PUT the photo there)
//   { create: { headline, body, photos: [] } } → { id }

const BUCKET = process.env.FEED_MEDIA_BUCKET || 'feed-media';
const PHOTO_EXT = ['jpg', 'jpeg', 'png', 'webp', 'heic'];

const isOurPath = (p: unknown): p is string => typeof p === 'string' && /^updates\/[0-9a-f-]{36}\.[a-z]{3,4}$/.test(p);

export async function POST(req: Request) {
  if (!automationAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const b = (await req.json().catch(() => ({}))) as {
    sign?: { filename?: unknown };
    create?: { headline?: unknown; body?: unknown; photos?: unknown };
  };
  const db = getSupabaseAdmin();

  try {
    if (b.sign) {
      const ext = String(b.sign.filename || '').split('.').pop()?.toLowerCase() || '';
      if (!PHOTO_EXT.includes(ext)) return NextResponse.json({ error: 'Photos only.' }, { status: 400 });
      const { data, error } = await db.storage.from(BUCKET).createSignedUploadUrl(`updates/${randomUUID()}.${ext}`);
      if (error) throw error;
      return NextResponse.json({ path: data.path, signedUrl: data.signedUrl });
    }

    if (b.create) {
      const body = typeof b.create.body === 'string' ? b.create.body.trim().slice(0, 20000) : '';
      if (!body) return NextResponse.json({ error: 'No text.' }, { status: 400 });
      const headline = typeof b.create.headline === 'string' ? b.create.headline.trim().slice(0, 200) || null : null;
      const photos = (Array.isArray(b.create.photos) ? b.create.photos : []).filter(isOurPath).slice(0, 12);
      const media: MediaItem[] = photos.map((p) => ({ url: db.storage.from(BUCKET).getPublicUrl(p).data.publicUrl, type: 'photo' }));
      const { data, error } = await db
        .from('posts')
        .insert({ status: 'draft', headline, draft_text: body, final_text: body, media })
        .select('id')
        .single();
      if (error) throw error;
      return NextResponse.json({ id: data.id });
    }

    return NextResponse.json({ error: 'Send sign or create.' }, { status: 400 });
  } catch (e) {
    console.error('[feed draft]', e);
    return NextResponse.json({ error: 'Could not save the draft.' }, { status: 500 });
  }
}
