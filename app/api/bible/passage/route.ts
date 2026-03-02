import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/bible/passage?usfm=JHN.3.16&version=111&format=text
 *
 * Server-side proxy for YouVersion API with persistent Supabase cache.
 * - Cache hit  → return from DB instantly, zero YouVersion API calls
 * - Cache miss → fetch from YouVersion, store in DB, return result
 *
 * This means each unique passage+version+format is only ever fetched
 * once from YouVersion, regardless of how many users request it.
 */

const YV_BASE = 'https://api.youversion.com/v1';

export async function GET(request: NextRequest) {
  // Lazy-initialize Supabase client inside the handler so build-time
  // module evaluation doesn't fail if env vars aren't set yet
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { searchParams } = new URL(request.url);
  const usfm = searchParams.get('usfm');
  const versionId = searchParams.get('version');
  const format = searchParams.get('format') || 'text';

  if (!usfm || !versionId) {
    return NextResponse.json(
      { error: 'usfm and version are required' },
      { status: 400 }
    );
  }

  const versionIdNum = parseInt(versionId);
  if (isNaN(versionIdNum)) {
    return NextResponse.json({ error: 'version must be a number' }, { status: 400 });
  }

  // 1. Check Supabase cache
  const { data: cached } = await supabase
    .from('bible_passage_cache')
    .select('content, reference')
    .eq('usfm', usfm)
    .eq('version_id', versionIdNum)
    .eq('format', format)
    .maybeSingle();

  if (cached) {
    return NextResponse.json(
      { content: cached.content, reference: cached.reference, cached: true },
      {
        headers: {
          // Tell the browser to cache for 1 year — Bible text never changes
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      }
    );
  }

  // 2. Cache miss — fetch from YouVersion
  const appKey = process.env.NEXT_PUBLIC_YV_APP_KEY;
  if (!appKey) {
    return NextResponse.json(
      { error: 'YouVersion API key not configured' },
      { status: 500 }
    );
  }

  const endpoint = format === 'text'
    ? `/bibles/${versionIdNum}/passages/${usfm}`
    : `/bibles/${versionIdNum}/passages/${usfm}?format=${format}`;

  const yvResponse = await fetch(`${YV_BASE}${endpoint}`, {
    headers: {
      'X-YVP-App-Key': appKey,
      'Accept': 'application/json',
    },
  });

  if (!yvResponse.ok) {
    console.error(`[Bible Proxy] YouVersion error: ${yvResponse.status} for ${usfm} v${versionIdNum}`);
    return NextResponse.json(
      { error: `YouVersion API error: ${yvResponse.status}` },
      { status: yvResponse.status }
    );
  }

  const data = await yvResponse.json();
  const content: string = data.content;
  const reference: string = data.reference?.human || usfm;

  // 3. Store in Supabase cache (non-blocking — don't fail the response if insert fails)
  supabase
    .from('bible_passage_cache')
    .insert({ usfm, version_id: versionIdNum, format, content, reference })
    .then(({ error }) => {
      if (error && error.code !== '23505') { // ignore duplicate key on race condition
        console.error('[Bible Proxy] Cache insert error:', error);
      }
    });

  return NextResponse.json(
    { content, reference, cached: false },
    {
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    }
  );
}
