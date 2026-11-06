import { NextResponse } from 'next/server';
import { BRAND_SITES } from '@/lib/shopCatalog';
import { createShopCheckout, ShopError } from '@/lib/shopCheckout';

export const dynamic = 'force-dynamic';

// POST /api/shop/checkout { sku, addons?, ui? } → { url } (hosted) or { clientSecret, publishableKey } (embedded): the ARK Identity Shop's one checkout, called by every
// front door (creedcards.com now). The calling site falls back to its Payment Link if this fails.

function cors(req: Request) {
  const origin = req.headers.get('origin') ?? '';
  const ok = Object.values(BRAND_SITES).some((s) => s.origins.test(origin));
  return {
    'Access-Control-Allow-Origin': ok ? origin : 'https://www.arkidentity.com',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  };
}

export function OPTIONS(req: Request) {
  return new Response(null, { status: 204, headers: cors(req) });
}

export async function POST(req: Request) {
  const CORS = cors(req);
  const b = (await req.json().catch(() => ({}))) as { sku?: unknown; addons?: unknown; ui?: unknown };
  const sku = typeof b.sku === 'string' ? b.sku : '';
  const addons = Array.isArray(b.addons) ? b.addons.filter((a): a is string => typeof a === 'string').slice(0, 5) : [];
  const ui = b.ui === 'embedded' ? 'embedded' : 'hosted';
  try {
    if (ui === 'embedded' && !process.env.STRIPE_PUBLISHABLE_KEY) throw new Error('STRIPE_PUBLISHABLE_KEY is not set');
    const out = await createShopCheckout({ sku, addons, origin: req.headers.get('origin'), ui });
    const body = ui === 'embedded' ? { ...out, publishableKey: process.env.STRIPE_PUBLISHABLE_KEY } : out;
    return NextResponse.json(body, { headers: CORS });
  } catch (e) {
    const status = e instanceof ShopError ? e.status : 500;
    console.error('[shop checkout]', sku, e);
    return NextResponse.json({ error: status === 400 ? (e as Error).message : 'Checkout is unavailable.' }, { status, headers: CORS });
  }
}
