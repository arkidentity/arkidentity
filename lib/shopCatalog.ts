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
  /** Decks can ship to other people, one deck per address, free shipping each (lib/shopCheckout.ts). */
  gifts?: boolean;
  /** Shop cart (lib/shopCart.ts): price shown in the cart, in cents (Stripe still charges from the lookup keys). */
  show?: { early?: number; regular: number };
  /** Shop cart quantity limits; missing = the item can't go in the cart (Buy now only). */
  cart?: { min: number; max: number };
  /** Which box it ships in. Media Mail is books only, so books always ship as their own package. */
  ship?: 'parcel' | 'media';
};

const CC_EARLY_ENDS = '2026-12-01T06:00:00Z'; // Early Bird through Nov 30, US Central

export const CATALOG: Record<string, ShopProduct> = {
  'cc-one': {
    show: { early: 2500, regular: 2900 },
    cart: { min: 1, max: 9 },
    ship: 'parcel',
    brand: 'cc',
    name: 'Creed Cards: One Deck',
    prices: { early: 'cc-one-founding', regular: 'cc-one-regular' },
    earlyEnds: CC_EARLY_ENDS,
    qty: { min: 1, max: 3, start: 1 },
    priority: true,
    gifts: true,
    addons: ['dna-journal'],
  },
  'cc-give': {
    show: { early: 5000, regular: 5500 },
    cart: { min: 1, max: 1 }, // one gift recipient field per order; more gifts = Buy now on creedcards.com
    ship: 'parcel',
    brand: 'cc',
    name: 'Creed Cards: Keep One, Give One',
    prices: { early: 'cc-give-founding', regular: 'cc-give-regular' },
    earlyEnds: CC_EARLY_ENDS,
    priority: true,
    gifts: true,
    fields: [
      { key: 'giftrecipient', label: 'Gift recipient name and full mailing address' },
      { key: 'giftnote', label: 'Gift note', optional: true },
    ],
    addons: ['dna-journal'],
  },
  'cc-table': {
    show: { early: 7500, regular: 8700 },
    cart: { min: 1, max: 5 },
    ship: 'parcel',
    brand: 'cc',
    name: 'Creed Cards: The Table (4 decks)',
    prices: { early: 'cc-table-founding', regular: 'cc-table-regular' },
    earlyEnds: CC_EARLY_ENDS,
    priority: true,
    addons: ['dna-journal'],
  },
  'cc-bulk': {
    show: { early: 1800, regular: 2100 },
    cart: { min: 10, max: 500 },
    ship: 'parcel',
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
    show: { regular: 1200 },
    cart: { min: 1, max: 10 },
    ship: 'parcel',
    brand: 'ark',
    name: 'Daily DNA Journal',
    prices: { regular: 'dna-journal-addon' },
    addonOnly: true,
  },
};

/** Products on the way: shown in the shop as "Coming soon", not sold yet. Each becomes a CATALOG entry when ready. */
export const COMING: { key: string; brand: string; name: string; line: string; when: string }[] = [
  { key: 'books', brand: 'ARK Identity', name: 'ARK books for groups', line: '10 or more of one title, with workbook sets (like Identity Through the Trinity).', when: 'Soon' },
  { key: 'spark', brand: 'Spark', name: 'Spark deck', line: 'A new deck, playing-card size.', when: 'January' },
  { key: 'outreach', brand: 'Outreach in a Box', name: 'Outreach in a Box', line: 'An outreach for your group, ready to go.', when: 'January' },
  { key: 'communion', brand: 'Communion in a Box', name: 'Communion in a Box', line: 'Our premium box.', when: 'January' },
];

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
