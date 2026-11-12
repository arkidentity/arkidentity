import { NextResponse } from 'next/server';
import { createCartCheckout, ShopError } from '@/lib/shopCheckout';

export const dynamic = 'force-dynamic';

// POST /api/shop/cart { lines: [{ sku, qty }], ui?, src? } → { clientSecret, publishableKey } (embedded) or { url }.
// Called only by the shop's own cart page (same origin), so no CORS.
export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as { lines?: unknown; ui?: unknown; src?: unknown };
  const ui = b.ui === 'hosted' ? 'hosted' : 'embedded';
  try {
    if (ui === 'embedded' && !process.env.STRIPE_PUBLISHABLE_KEY) throw new ShopError('STRIPE_PUBLISHABLE_KEY is not set', 503);
    const out = await createCartCheckout({
      lines: Array.isArray(b.lines) ? b.lines : [],
      origin: req.headers.get('origin'),
      ui,
      src: typeof b.src === 'string' ? b.src : undefined,
    });
    return NextResponse.json(ui === 'embedded' ? { ...out, publishableKey: process.env.STRIPE_PUBLISHABLE_KEY } : out);
  } catch (e) {
    console.error('[shop cart]', e);
    const status = e instanceof ShopError ? e.status : 500;
    return NextResponse.json({ error: e instanceof ShopError ? e.message : 'Checkout is unavailable.' }, { status });
  }
}
