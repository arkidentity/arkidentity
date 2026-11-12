// ARK Identity Shop cart rules, shared by the cart page (browser) and the cart checkout (server), so the price the
// buyer sees and what Stripe charges come from the same catalog. Stripe still prices each line from its lookup key.
//
// The cart lives in the shop's own browser storage (arkidentity.com/shop). Brand sites add to it by linking to
// /shop/cart?add=<sku>&qty=<n>, so a deck added on creedcards.com and a box added on another page meet in one cart
// with no account and no database. (PLAN §5a said server-side; this does the same job with less to run.)

import { CATALOG, type ShopProduct } from '@/lib/shopCatalog';

export type CartLine = { sku: string; qty: number };

export const PRIORITY_CENTS = 600;

const DECKS: Record<string, number> = { 'cc-one': 1, 'cc-give': 2, 'cc-table': 4, 'cc-bulk': 1 };

/** Cents shown for one unit right now (Early Bird aware). */
export function unitCents(p: ShopProduct, now = Date.now()): number {
  if (!p.show) return 0;
  return p.show.early != null && p.earlyEnds && now < Date.parse(p.earlyEnds) ? p.show.early : p.show.regular;
}

/** The regular price, when it's higher than today's (for a crossed-out "was"). */
export function wasCents(p: ShopProduct, now = Date.now()): number | null {
  const u = unitCents(p, now);
  return p.show && p.show.regular > u ? p.show.regular : null;
}

/** Cleans a cart: known items only, quantities in range, one line per item, add-ons only beside an item that offers them. */
export function cleanCart(raw: unknown): CartLine[] {
  const list = Array.isArray(raw) ? raw : [];
  const merged = new Map<string, number>();
  for (const l of list.slice(0, 20)) {
    if (!l || typeof l !== 'object') continue;
    const { sku, qty } = l as { sku?: unknown; qty?: unknown };
    if (typeof sku !== 'string' || !CATALOG[sku]?.cart) continue;
    const n = Math.floor(Number(qty) || 0);
    if (n > 0) merged.set(sku, (merged.get(sku) ?? 0) + n);
  }
  const lines = [...merged].map(([sku, qty]) => {
    const c = CATALOG[sku].cart!;
    return { sku, qty: Math.min(c.max, Math.max(c.min, qty)) };
  });
  const offered = new Set(lines.flatMap((l) => (CATALOG[l.sku].addonOnly ? [] : CATALOG[l.sku].addons ?? [])));
  return lines.filter((l) => !CATALOG[l.sku].addonOnly || offered.has(l.sku));
}

/** Add-ons the cart could offer and doesn't have yet. */
export function offers(lines: CartLine[]): string[] {
  const have = new Set(lines.map((l) => l.sku));
  const out = new Set<string>();
  for (const l of lines) {
    if (CATALOG[l.sku].addonOnly) continue;
    for (const a of CATALOG[l.sku].addons ?? []) if (!have.has(a) && CATALOG[a]?.cart) out.add(a);
  }
  return [...out];
}

/**
 * Packages and shipping. Everything that isn't a book goes in one parcel to the buyer; Keep One, Give One adds one
 * parcel to the gift recipient; books go Media Mail as their own package (Media Mail can't carry anything else).
 * Standard shipping is free (built into the prices). Priority is $6 a parcel, offered only when every item allows it.
 */
export function shipping(lines: CartLine[]) {
  const items = lines.map((l) => CATALOG[l.sku]);
  const parcelItems = items.filter((p) => p.ship !== 'media');
  const parcels = (parcelItems.length ? 1 : 0) + lines.filter((l) => l.sku === 'cc-give').length;
  const media = items.some((p) => p.ship === 'media') ? 1 : 0;
  const priority = parcels > 0 && parcelItems.every((p) => p.priority !== false);
  return { parcels, media, packages: parcels + media, priority, priorityCents: priority ? PRIORITY_CENTS * parcels : 0 };
}

export function totals(lines: CartLine[], now = Date.now()) {
  const subtotal = lines.reduce((n, l) => n + unitCents(CATALOG[l.sku], now) * l.qty, 0);
  const decks = lines.reduce((n, l) => n + (DECKS[l.sku] ?? 0) * l.qty, 0);
  return { subtotal, decks, ...shipping(lines) };
}

/** What a Bulk order gets free (matches lib/store.ts bulkBonus, which the order uses). */
export function bulkExtras(qty: number): string[] {
  if (qty < 10) return [];
  const free = Math.floor(qty / 10);
  const j = qty >= 50 ? 3 : qty >= 25 ? 2 : 1;
  return [`${free} free ${free === 1 ? 'deck' : 'decks'}`, `${j} free DNA ${j === 1 ? 'Journal' : 'Journals'}`, 'group guide'];
}

/** Short names for cart lines. */
export const CART_NAME: Record<string, string> = { 'cc-bulk': 'Bulk decks', 'cc-table': 'The Table (4 decks)' };

export const money = (cents: number) => `$${(cents / 100).toFixed(cents % 100 ? 2 : 0)}`;
