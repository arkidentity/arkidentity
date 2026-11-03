import { NextResponse } from 'next/server';
import { getFounderEntry, saveFounderEntry } from '@/lib/store';

export const dynamic = 'force-dynamic';

// The buyer's own Founders wall entry, from creedcards.com/thanks?session_id=cs_...
// GET ?session_id= → their entry · POST { session_id, public, name, city, message } → save it.
// The Checkout Session id is the key: long, random, and only in the buyer's own redirect.

// creedcards.com, its Vercel previews and local dev.
const ORIGIN = /^https:\/\/(www\.creedcards\.com|creedcards-site[a-z0-9-]*\.vercel\.app)$|^http:\/\/localhost:\d+$/;

function cors(req: Request) {
  const origin = req.headers.get('origin') ?? '';
  return {
    'Access-Control-Allow-Origin': ORIGIN.test(origin) ? origin : 'https://www.creedcards.com',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  };
}
const SESSION = /^cs_(live|test)_[A-Za-z0-9]{20,200}$/;

export function OPTIONS(req: Request) {
  return new Response(null, { status: 204, headers: cors(req) });
}

export async function GET(req: Request) {
  const CORS = cors(req);
  const id = new URL(req.url).searchParams.get('session_id') ?? '';
  if (!SESSION.test(id)) return NextResponse.json({ error: 'Not found.' }, { status: 404, headers: CORS });
  const entry = await getFounderEntry(id).catch(() => null);
  // The webhook can land a second or two after the redirect: the page retries on 404.
  if (!entry) return NextResponse.json({ error: 'Not found.' }, { status: 404, headers: CORS });
  return NextResponse.json(entry, { headers: CORS });
}

export async function POST(req: Request) {
  const CORS = cors(req);
  const b = (await req.json().catch(() => ({}))) as { session_id?: string; public?: boolean; name?: string; city?: string; message?: string };
  if (!SESSION.test(b.session_id ?? '')) return NextResponse.json({ error: 'Not found.' }, { status: 404, headers: CORS });
  const ok = await saveFounderEntry(b.session_id!, {
    public: !!b.public,
    name: typeof b.name === 'string' ? b.name : null,
    city: typeof b.city === 'string' ? b.city : null,
    message: typeof b.message === 'string' ? b.message : null,
  }).catch(() => false);
  if (!ok) return NextResponse.json({ error: 'We couldn’t find that order yet. Try again in a minute.' }, { status: 404, headers: CORS });
  return NextResponse.json({ ok: true }, { headers: CORS });
}
