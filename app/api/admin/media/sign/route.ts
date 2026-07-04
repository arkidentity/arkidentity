import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const BUCKET = process.env.FEED_MEDIA_BUCKET || 'feed-media';

// POST /api/admin/media/sign — mint a signed upload URL for one file so the
// browser can upload directly to Supabase Storage (avoids the serverless body
// limit for large video). Returns the path/token to upload with + the eventual
// public URL. Gated by the /admin proxy.
export async function POST(req: Request) {
  const { filename, contentType } = (await req.json().catch(() => ({}))) as {
    filename?: string;
    contentType?: string;
  };

  if (!contentType || !/^(image|video|audio)\//.test(contentType)) {
    return NextResponse.json(
      { error: 'Only image, video, or audio files are allowed.' },
      { status: 400 }
    );
  }

  // Stable, collision-free object path. Keep only a safe extension from the name.
  const ext = (filename?.split('.').pop() || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const objectPath = `${randomUUID()}${ext ? '.' + ext : ''}`;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUploadUrl(objectPath);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(objectPath);

  return NextResponse.json({
    path: data.path,
    token: data.token,
    publicUrl: pub.publicUrl,
  });
}
