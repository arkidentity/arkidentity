// ARK Identity Shop: the one catalog every front door sells from (creedcards.com now; arkidentity.com/shop,
// outreachinabox.app later). Stripe account: ARK Identity Shop. Each product here matches a Stripe product whose
// metadata `sku` is the key below (lib/store.ts reads that sku to build the order), and each price has a lookup key.
//
// Add a product: create it in Stripe (sku metadata + lookup keys on its prices), then add an entry here.

export type Brand = 'cc' | 'ark';

export type ShopProduct = {
  brand: Brand;
  name: string;
  /** Stripe price lookup keys. `early` is used until `earlyEnds`, then `regular`. */
  prices: { early?: string; regular: string };
  earlyEnds?: string; // ISO date
  qty?: { min: number; max: number; start: number };
  /** Priority Mail on top of free shipping. Off for big boxes (flat $6 loses money). */
  priority?: boolean;
  /** Checkout custom fields. Labels with "recipient"/"note"/"church" are what lib/store.ts reads. */
  fields?: { key: string; label: string; optional?: boolean }[];
  /** SKUs that may be added as add-ons (the pop-up offer). */
  addons?: string[];
  /** Sold only as an add-on, never on its own. */
  addonOnly?: boolean;
};

const CC_EARLY_ENDS = '2026-12-01T06:00:00Z'; // Early Bird through Nov 30, US Central

export const CATALOG: Record<string, ShopProduct> = {
  'cc-one': {
    brand: 'cc',
    name: 'Creed Cards: One Deck',
    prices: { early: 'cc-one-founding', regular: 'cc-one-regular' },
    earlyEnds: CC_EARLY_ENDS,
    qty: { min: 1, max: 3, start: 1 },
    priority: true,
    addons: ['dna-journal'],
  },
  'cc-give': {
    brand: 'cc',
    name: 'Creed Cards: Keep One, Give One',
    prices: { early: 'cc-give-founding', regular: 'cc-give-regular' },
    earlyEnds: CC_EARLY_ENDS,
    priority: true,
    fields: [
      { key: 'giftrecipient', label: 'Gift recipient name and full mailing address' },
      { key: 'giftnote', label: 'Gift note', optional: true },
    ],
    addons: ['dna-journal'],
  },
  'cc-table': {
    brand: 'cc',
    name: 'Creed Cards: The Table (4 decks)',
    prices: { early: 'cc-table-founding', regular: 'cc-table-regular' },
    earlyEnds: CC_EARLY_ENDS,
    priority: true,
    addons: ['dna-journal'],
  },
  'cc-bulk': {
    brand: 'cc',
    name: 'Creed Cards: Bulk (per deck, 10+)',
    prices: { early: 'cc-bulk-founding', regular: 'cc-bulk-regular' },
    earlyEnds: CC_EARLY_ENDS,
    qty: { min: 10, max: 500, start: 10 },
    priority: false,
    fields: [{ key: 'church', label: 'Church or group name', optional: true }],
    addons: ['dna-journal'],
  },
  'dna-journal': {
    brand: 'ark',
    name: 'Daily DNA Journal',
    prices: { regular: 'dna-journal-addon' },
    addonOnly: true,
  },
};

/** The lookup key to charge right now. */
export function currentPriceKey(p: ShopProduct, now = Date.now()): string {
  return p.prices.early && p.earlyEnds && now < Date.parse(p.earlyEnds) ? p.prices.early : p.prices.regular;
}

/** Each brand's own site (its thanks page and its Vercel previews). */
export const BRAND_SITES: Record<Brand, { home: string; origins: RegExp }> = {
  cc: {
    home: 'https://www.creedcards.com',
    origins: /^https:\/\/(www\.creedcards\.com|creedcards-site[a-z0-9-]*\.vercel\.app)$|^http:\/\/localhost:\d+$/,
  },
  ark: {
    home: 'https://www.arkidentity.com',
    origins: /^https:\/\/(www\.arkidentity\.com|arkidentity[a-z0-9-]*\.vercel\.app)$|^http:\/\/localhost:\d+$/,
  },
};
