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

export type GiftAddress = { name: string; line1: string; line2?: string; city: string; state: string; zip: string; note?: string };

/** Cleans a gift address from the front door; null if anything required is missing. */
export function cleanGift(g: unknown): GiftAddress | null {
  if (!g || typeof g !== 'object') return null;
  const o = g as Record<string, unknown>;
  const s = (k: string, max: number) => (typeof o[k] === 'string' ? (o[k] as string).trim().slice(0, max) : '');
  const out = { name: s('name', 80), line1: s('line1', 100), line2: s('line2', 100), city: s('city', 60), state: s('state', 2).toUpperCase(), zip: s('zip', 10), note: s('note', 300) };
  if (!out.name || !out.line1 || !out.city || !/^[A-Z]{2}$/.test(out.state) || !/^\d{5}(-\d{4})?$/.test(out.zip)) return null;
  return out;
}

/** Most gift addresses per order, and most decks a One Deck buyer keeps (10+ decks = Bulk). */
export const MAX_GIFTS = 9;
const MAX_OWN = 9;

/** Gift address → one Stripe metadata value (≤500 chars). The note goes in its own key. */
const giftMeta = (g: GiftAddress) => JSON.stringify([g.name, g.line1, g.line2 ?? '', g.city, g.state, g.zip]);

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
  /** Gift recipient collected on the brand's own page (structured, autofill), instead of a free-text Stripe field. */
  gift?: GiftAddress | null;
  /**
   * Decks shipped to other people, one deck each (Travis 11/7). One Deck: any of the decks, free shipping to every
   * address. Keep One, Give One: gifts[0] is the package's gift deck; more gifts are extra One Deck decks.
   * The Table and Bulk ship to one address, so no gifts.
   */
  gifts?: GiftAddress[];
  /** One Deck only, when there are gifts: decks for the buyer themselves (0 = all decks are gifts). */
  own?: number;
  /** Where the buyer came from, e.g. "dailydna-shelf" (lowercase, dashes). Goes to metadata[ref] and back to /thanks. */
  src?: string;
}): Promise<{ url?: string; clientSecret?: string }> {
  const ui = opts.ui ?? 'hosted';
  const item = CATALOG[opts.sku];
  if (!item || item.addonOnly) throw new ShopError('Unknown product.');
  const gifts = opts.gifts?.length ? opts.gifts : opts.gift ? [opts.gift] : [];
  if (gifts.length && !item.gifts) throw new ShopError('This option ships to one address.');
  if (gifts.length > MAX_GIFTS) throw new ShopError(`Up to ${MAX_GIFTS} gift addresses per order.`);
  const own = Math.max(0, Math.min(MAX_OWN, Math.floor(opts.own ?? (gifts.length ? 0 : 1))));
  // One Deck: decks = own + gifts. Keep One, Give One: the package covers gift #1; more gifts are One Deck decks.
  const oneDecks = opts.sku === 'cc-one' ? own + gifts.length : opts.sku === 'cc-give' ? Math.max(0, gifts.length - 1) : 0;
  if (opts.sku === 'cc-one' && gifts.length && oneDecks < 1) throw new ShopError('Choose at least one deck.');
  if (opts.sku === 'cc-one' && oneDecks > MAX_OWN) throw new ShopError('For 10 or more decks, choose Bulk.');
  const addons = [...new Set(opts.addons ?? [])];
  for (const a of addons) {
    if (!item.addons?.includes(a) || !CATALOG[a]) throw new ShopError('Unknown add-on.');
  }

  const site = BRAND_SITES[item.brand as Brand];
  const src = opts.src && /^[a-z0-9-]{1,40}$/.test(opts.src) ? opts.src : '';
  const srcQ = src ? `&src=${src}` : '';
  const back = opts.origin && site.origins.test(opts.origin) ? opts.origin : site.home;

  const extraKey = opts.sku === 'cc-give' && oneDecks ? currentPriceKey(CATALOG['cc-one']) : null;
  const keys = [currentPriceKey(item), ...addons.map((a) => currentPriceKey(CATALOG[a])), ...(extraKey ? [extraKey] : [])];
  const ids = await priceIds(keys);
  const missing = keys.filter((k) => !ids[k]);
  if (missing.length) throw new ShopError(`Missing Stripe price: ${missing.join(', ')}`, 502);

  const p = new URLSearchParams();
  const set = (k: string, v: string | number | boolean) => p.set(k, String(v));
  set('mode', 'payment');
  if (ui === 'embedded') {
    set('ui_mode', 'embedded_page'); // Stripe renamed `embedded` → `embedded_page`
    set('return_url', `${back}/thanks?session_id={CHECKOUT_SESSION_ID}${srcQ}`);
  } else {
    set('success_url', `${back}/thanks?session_id={CHECKOUT_SESSION_ID}${srcQ}`);
    set('cancel_url', `${back}/#reserve`);
  }
  set('allow_promotion_codes', true);
  set('automatic_tax[enabled]', true);
  // Billing address: Stripe's default ("auto") asks only for what the card needs (usually ZIP). One address, not two.
  // The buyer's own address: skipped only when every deck is a gift and nothing else ships to them.
  const shipsToBuyer = !(opts.sku === 'cc-one' && gifts.length && own === 0 && !addons.length);
  if (shipsToBuyer) set('shipping_address_collection[allowed_countries][0]', 'US');
  set('metadata[brand]', item.brand);
  set('metadata[source]', 'shop-checkout');
  if (src) set('metadata[ref]', src);

  // Main item. With gifts the deck count was set on our page, so it's fixed here.
  set('line_items[0][price]', ids[keys[0]]);
  if (opts.sku === 'cc-one' && gifts.length) {
    set('line_items[0][quantity]', oneDecks);
  } else {
    set('line_items[0][quantity]', item.qty?.start ?? 1);
    if (item.qty) {
      set('line_items[0][adjustable_quantity][enabled]', true);
      set('line_items[0][adjustable_quantity][minimum]', item.qty.min);
      set('line_items[0][adjustable_quantity][maximum]', item.qty.max);
    }
  }
  // Add-ons (one each), then extra gift decks for Keep One, Give One.
  let line = 1;
  addons.forEach((a) => {
    set(`line_items[${line}][price]`, ids[currentPriceKey(CATALOG[a])]);
    set(`line_items[${line++}][quantity]`, 1);
  });
  if (extraKey) {
    set(`line_items[${line}][price]`, ids[extraKey]);
    set(`line_items[${line++}][quantity]`, oneDecks);
  }

  // Shipping: built into the price, so Standard is free to every address; Priority is $6 per package.
  const packages = (shipsToBuyer ? 1 : 0) + gifts.length;
  const ship = [{ name: packages > 1 ? `Free shipping to all ${packages} addresses (USPS Ground Advantage)` : 'Free shipping (USPS Ground Advantage)', cents: 0 }];
  if (item.priority) ship.push({ name: packages > 1 ? `Priority Mail (faster), $6 × ${packages} packages` : 'Priority Mail (faster)', cents: 600 * Math.max(1, packages) });
  ship.forEach((s, i) => {
    set(`shipping_options[${i}][shipping_rate_data][type]`, 'fixed_amount');
    set(`shipping_options[${i}][shipping_rate_data][display_name]`, s.name);
    set(`shipping_options[${i}][shipping_rate_data][fixed_amount][amount]`, s.cents);
    set(`shipping_options[${i}][shipping_rate_data][fixed_amount][currency]`, 'usd');
    set(`shipping_options[${i}][shipping_rate_data][tax_behavior]`, 'exclusive');
  });

  // Add-ons they skipped on the brand page: offered once more inside Stripe ("Add to your order").
  const skipped = (item.addons ?? []).filter((a) => !addons.includes(a) && CATALOG[a]);
  if (skipped.length) {
    const more = await priceIds(skipped.map((a) => currentPriceKey(CATALOG[a])));
    skipped.forEach((a, i) => {
      const id = more[currentPriceKey(CATALOG[a])];
      if (!id) return;
      set(`optional_items[${i}][price]`, id);
      set(`optional_items[${i}][quantity]`, 1);
    });
  }

  // Gift addresses from the brand page → metadata (lib/store.ts reads them); then the free-text gift fields aren't needed.
  // gift_1..gift_9 = JSON [name, line1, line2, city, state, zip]; gift_N_note = the note; own_decks = buyer's decks.
  gifts.forEach((g, i) => {
    set(`metadata[gift_${i + 1}]`, giftMeta(g));
    if (g.note) set(`metadata[gift_${i + 1}_note]`, g.note);
  });
  if (gifts.length) {
    set('metadata[gift_count]', gifts.length);
    if (opts.sku === 'cc-one') set('metadata[own_decks]', own);
  }
  const fields = (item.fields ?? []).filter((f) => !(gifts.length && /^gift/.test(f.key)));
  fields.forEach((f, i) => {
    set(`custom_fields[${i}][key]`, f.key);
    set(`custom_fields[${i}][label][type]`, 'custom');
    set(`custom_fields[${i}][label][custom]`, f.label);
    set(`custom_fields[${i}][type]`, 'text');
    if (f.optional) set(`custom_fields[${i}][optional]`, true);
  });

  const session = (await stripe('/checkout/sessions', p)) as { url?: string; client_secret?: string };
  return ui === 'embedded' ? { clientSecret: session.client_secret } : { url: session.url };
}
