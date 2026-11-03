import { NextResponse } from 'next/server';
import { decksReserved } from '@/lib/store';

// GET /api/store/count?brand=cc — decks reserved, for creedcards.com's progress bar (public, counts only).
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const brand = new URL(req.url).searchParams.get('brand') === 'oib' ? 'oib' : 'cc';
  const decks = await decksReserved(brand).catch(() => null);
  return NextResponse.json({ decks }, { headers: { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 's-maxage=300' } });
}
