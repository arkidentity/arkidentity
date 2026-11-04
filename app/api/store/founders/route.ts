import { NextResponse } from 'next/server';
import { publicFounders } from '@/lib/store';

export const dynamic = 'force-dynamic';

// GET /api/store/founders?brand=cc — the public Founders wall for creedcards.com (Mig 055).
// Opted-in first name + city, what they reserved, messages (unless hidden). Everyone else shows as "A founder".
export async function GET(req: Request) {
  const brand = new URL(req.url).searchParams.get('brand') === 'oib' ? 'oib' : 'cc';
  const body = await publicFounders(brand).catch(() => null);
  return NextResponse.json(body ?? { founders: 0, decks: 0, list: [] }, {
    headers: { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 's-maxage=120' },
  });
}
