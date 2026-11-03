import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { connectWithCode } from '@/lib/googleContacts';

export const dynamic = 'force-dynamic';

// GET /api/admin/google/callback — Google sends Travis back here after he allows
// access. The state cookie proves this browser started the connect.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const back = `${url.origin}/admin/contacts/google`;
  const jar = await cookies();
  const expected = jar.get('google_oauth_state')?.value;
  const state = url.searchParams.get('state');
  const code = url.searchParams.get('code');

  if (url.searchParams.get('error')) return NextResponse.redirect(`${back}?error=declined`);
  if (!code || !state || state !== expected) return NextResponse.redirect(`${back}?error=state`);

  try {
    await connectWithCode(url.origin, code);
  } catch (e) {
    console.error('Google connect failed', e);
    return NextResponse.redirect(`${back}?error=exchange`);
  }
  const res = NextResponse.redirect(`${back}?connected=1`);
  res.cookies.delete('google_oauth_state');
  return res;
}
