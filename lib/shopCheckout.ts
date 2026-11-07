// ARK Identity Shop checkout: one Stripe Checkout Session per order, for any front door.
// Orders come back through the existing webhook (/api/store/stripe-webhook → lib/store.ts), so /admin/orders,
// the wall and GHL tags work for every brand with no changes.
//
// Env (Vercel, ark-identity): STRIPE_CHECKOUT_KEY = restricted key on the ARK Identity Shop with
//   Checkout Sessions: Write · Prices: Read · Shipping Rates: Write.
//   Preview → test key (rk_test_…). Production → live key, added only when a front door switches over.
// STRIPE_PUBLISHABLE_KEY = the matching pk_test_/pk_live_ key (public). The embedded form needs it; the API hands
// it to the front door with the session so the two keys always match and only live here.

import { BRAND_SITES, CATALOG, currentPriceKey, type Brand } from '@/lib/shopCatalog';

const API = 'https://api.stripe.com/v1';

export class ShopError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

async function stripe(path: string, body?: URLSearchParams) {
  const key = process.env.STRIPE_CHECKOUT_KEY;
  if (!key) throw new ShopError('Checkout is not configured.', 503);
  const res = await fetch(`${API}${path}`, {
    method: body ? 'POST' : 'GET',
    headers: { Authorization: `Bearer ${key}`, ...(body ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}) },
    body,
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok) throw new ShopError(json?.error?.message ?? `Stripe ${res.status}`, 502);
  return json;
}

async function priceIds(lookupKeys: string[]): Promise<Record<string, string>> {
  const q = new URLSearchParams();
  lookupKeys.forEach((k) => q.append('lookup_keys[]', k));
  q.set('active', 'true');
  const { data } = (await stripe(`/prices?${q}`)) as { data: { id: string; lookup_key: string }[] };
  return Object.fromEntries(data.map((p) => [p.lookup_key, p.id]));
}

/**
 * Creates a Checkout Session and returns its URL.
 * `sku`: the main item. `addons`: add-on SKUs the buyer said yes to. `origin`: the calling site
 * (only used if it belongs to the product's brand, so previews come back to the preview).
 */
export async function createShopCheckout(opts: {
  sku: string;
  addons?: string[];
  origin?: string | null;
  /** 'embedded' = Stripe's form inside the brand's own /checkout page; 'hosted' = Stripe's page. */
  ui?: 'embedded' | 'hosted';
}): Promise<{ url?: string; clientSecret?: string }> {
  const ui = opts.ui ?? 'hosted';
  const item = CATALOG[opts.sku];
  if (!item || item.addonOnly) throw new ShopError('Unknown product.');
  const addons = [...new Set(opts.addons ?? [])];
  for (const a of addons) {
    if (!item.addons?.includes(a) || !CATALOG[a]) throw new ShopError('Unknown add-on.');
  }

  const site = BRAND_SITES[item.brand as Brand];
  const back = opts.origin && site.origins.test(opts.origin) ? opts.origin : site.home;

  const keys = [currentPriceKey(item), ...addons.map((a) => currentPriceKey(CATALOG[a]))];
  const ids = await priceIds(keys);
  const missing = keys.filter((k) => !ids[k]);
  if (missing.length) throw new ShopError(`Missing Stripe price: ${missing.join(', ')}`, 502);

  const p = new URLSearchParams();
  const set = (k: string, v: string | number | boolean) => p.set(k, String(v));
  set('mode', 'payment');
  if (ui === 'embedded') {
    set('ui_mode', 'embedded_page'); // Stripe renamed `embedded` → `embedded_page`
    set('return_url', `${back}/thanks?session_id={CHECKOUT_SESSION_ID}`);
  } else {
    set('success_url', `${back}/thanks?session_id={CHECKOUT_SESSION_ID}`);
    set('cancel_url', `${back}/#reserve`);
  }
  set('allow_promotion_codes', true);
  set('automatic_tax[enabled]', true);
  set('billing_address_collection', 'required');
  set('shipping_address_collection[allowed_countries][0]', 'US');
  set('metadata[brand]', item.brand);
  set('metadata[source]', 'shop-checkout');

  // Main item.
  set('line_items[0][price]', ids[keys[0]]);
  set('line_items[0][quantity]', item.qty?.start ?? 1);
  if (item.qty) {
    set('line_items[0][adjustable_quantity][enabled]', true);
    set('line_items[0][adjustable_quantity][minimum]', item.qty.min);
    set('line_items[0][adjustable_quantity][maximum]', item.qty.max);
  }
  // Add-ons (one each).
  addons.forEach((a, i) => {
    set(`line_items[${i + 1}][price]`, ids[currentPriceKey(CATALOG[a])]);
    set(`line_items[${i + 1}][quantity]`, 1);
  });

  // Shipping: built into the price, so Standard is free; Priority $6 where the product allows it.
  const ship = [{ name: 'Free shipping (USPS Ground Advantage)', cents: 0 }];
  if (item.priority) ship.push({ name: 'Priority Mail (faster)', cents: 600 });
  ship.forEach((s, i) => {
    set(`shipping_options[${i}][shipping_rate_data][type]`, 'fixed_amount');
    set(`shipping_options[${i}][shipping_rate_data][display_name]`, s.name);
    set(`shipping_options[${i}][shipping_rate_data][fixed_amount][amount]`, s.cents);
    set(`shipping_options[${i}][shipping_rate_data][fixed_amount][currency]`, 'usd');
    set(`shipping_options[${i}][shipping_rate_data][tax_behavior]`, 'exclusive');
  });

  (item.fields ?? []).forEach((f, i) => {
    set(`custom_fields[${i}][key]`, f.key);
    set(`custom_fields[${i}][label][type]`, 'custom');
    set(`custom_fields[${i}][label][custom]`, f.label);
    set(`custom_fields[${i}][type]`, 'text');
    if (f.optional) set(`custom_fields[${i}][optional]`, true);
  });

  const session = (await stripe('/checkout/sessions', p)) as { url?: string; client_secret?: string };
  return ui === 'embedded' ? { clientSecret: session.client_secret } : { url: session.url };
}
