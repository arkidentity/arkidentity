import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

// ARK store: one Stripe account (the LLC) for every product and front door.
// The webhook turns a paid Checkout Session into a store_orders row (Mig 054);
// /admin/orders packs and ships them. Plan: ark-workspace ark-store/PLAN.md.
//
// Products are recognized by the Stripe product's metadata `sku` (set once in
// the Stripe dashboard, creedcards-site/planning/STRIPE-SETUP.md), falling
// back to the product name, so no price IDs live in code.
//
// Env: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET; GHL_PRIVATE_TOKEN +
// GHL_LOCATION_ID (buyer tags); STORE_EMAIL_FROM (shipped email).

export type Sku = 'cc-one' | 'cc-give' | 'cc-table' | 'cc-bulk' | 'dna-journal';

const DECKS_PER: Record<Sku, number> = { 'cc-one': 1, 'cc-give': 2, 'cc-table': 4, 'cc-bulk': 1, 'dna-journal': 0 };
const TIER_TAG: Record<Sku, string | null> = {
  'cc-one': 'cc-tier-one',
  'cc-give': 'cc-tier-give',
  'cc-table': 'cc-tier-table',
  'cc-bulk': 'cc-tier-bulk',
  'dna-journal': null,
};

export interface StoreOrder {
  id: string;
  stripe_session_id: string;
  brand: string;
  created_at: string;
  email: string | null;
  name: string | null;
  phone: string | null;
  ship_name: string | null;
  ship_address: { line1?: string; line2?: string; city?: string; state?: string; postal_code?: string; country?: string } | null;
  shipping_rate: string | null;
  gift_recipient: string | null;
  gift_note: string | null;
  wall_name: string | null;
  group_name: string | null;
  items: { sku: Sku | null; name: string; quantity: number; amount_cents: number }[];
  decks: number;
  bonus_decks: number;
  journals: number;
  bonus_note: string | null;
  total_cents: number | null;
  status: 'paid' | 'packed' | 'shipped' | 'refunded' | 'canceled';
  tracking_number: string | null;
  shipped_at: string | null;
  notes: string | null;
}

// ---------- Stripe (plain fetch; no SDK) ----------

async function stripe(path: string) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('Missing STRIPE_SECRET_KEY.');
  const res = await fetch(`https://api.stripe.com/v1${path}`, { headers: { Authorization: `Bearer ${key}` }, cache: 'no-store' });
  const body = await res.json();
  if (!res.ok) throw new Error(`Stripe ${res.status}: ${body?.error?.message ?? 'error'}`);
  return body;
}

/** Checks the Stripe-Signature header (v1 HMAC-SHA256, 5-minute tolerance). */
export async function verifyStripeSignature(payload: string, header: string | null): Promise<boolean> {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !header) return false;
  const parts = Object.fromEntries(header.split(',').map((p) => p.split('=') as [string, string]));
  const t = parts.t;
  const sigs = header.split(',').filter((p) => p.startsWith('v1=')).map((p) => p.slice(3));
  if (!t || !sigs.length || Math.abs(Date.now() / 1000 - Number(t)) > 300) return false;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${t}.${payload}`));
  const hex = Array.from(new Uint8Array(mac)).map((b) => b.toString(16).padStart(2, '0')).join('');
  return sigs.includes(hex);
}

function skuOf(product: { name?: string; metadata?: Record<string, string> } | null): Sku | null {
  const meta = product?.metadata?.sku;
  if (meta && meta in DECKS_PER) return meta as Sku;
  const n = (product?.name ?? '').toLowerCase();
  if (n.includes('journal')) return 'dna-journal';
  if (n.includes('bulk')) return 'cc-bulk';
  if (n.includes('give')) return 'cc-give';
  if (n.includes('table')) return 'cc-table';
  if (n.includes('deck')) return 'cc-one';
  return null;
}

type CustomField = { key: string; label?: { custom?: string }; text?: { value?: string | null } };

function customField(fields: CustomField[], re: RegExp): string | null {
  const f = fields.find((x) => re.test(`${x.key} ${x.label?.custom ?? ''}`.toLowerCase()));
  return f?.text?.value?.trim() || null;
}

/** Bulk bonuses (PLAN §4): 1 free deck per 10 + group guide · 25+ a DNA Journal. */
export function bulkBonus(qty: number) {
  if (qty < 10) return { bonus_decks: 0, journals: 0, note: null as string | null };
  const note = ['Group guide', qty >= 25 ? 'DNA Journal' : null].filter(Boolean).join(' · ');
  return { bonus_decks: Math.floor(qty / 10), journals: qty >= 25 ? 1 : 0, note };
}

/** Saves a paid Checkout Session as an order. Returns null if it was already saved (webhook retry). */
export async function saveCheckoutSession(sessionId: string): Promise<StoreOrder | null> {
  const db = getSupabaseAdmin();
  const { data: existing } = await db.from('store_orders').select('id').eq('stripe_session_id', sessionId).maybeSingle();
  if (existing) return null;

  const s = await stripe(
    `/checkout/sessions/${sessionId}?expand[]=line_items.data.price.product&expand[]=shipping_cost.shipping_rate`
  );
  if (s.payment_status !== 'paid') return null;

  const items = (s.line_items?.data ?? []).map(
    (li: { description?: string; quantity?: number; amount_total?: number; price?: { product?: { name?: string; metadata?: Record<string, string> } } }) => ({
      sku: skuOf(li.price?.product ?? null),
      name: li.price?.product?.name ?? li.description ?? 'Item',
      quantity: li.quantity ?? 1,
      amount_cents: li.amount_total ?? 0,
    })
  ) as StoreOrder['items'];

  let decks = 0;
  let journals = 0;
  let bulkQty = 0;
  for (const it of items) {
    if (!it.sku) continue;
    decks += DECKS_PER[it.sku] * it.quantity;
    if (it.sku === 'dna-journal') journals += it.quantity;
    if (it.sku === 'cc-bulk') bulkQty += it.quantity;
  }
  const bonus = bulkBonus(bulkQty);

  const ship = s.collected_information?.shipping_details ?? s.shipping_details ?? null;
  const fields: CustomField[] = s.custom_fields ?? [];
  const row = {
    stripe_session_id: s.id,
    stripe_payment_intent: typeof s.payment_intent === 'string' ? s.payment_intent : null,
    brand: s.metadata?.brand || 'cc',
    paid_at: new Date((s.created ?? Date.now() / 1000) * 1000).toISOString(),
    email: s.customer_details?.email?.toLowerCase() ?? null,
    name: s.customer_details?.name ?? null,
    phone: s.customer_details?.phone ?? null,
    ship_name: ship?.name ?? s.customer_details?.name ?? null,
    ship_address: ship?.address ?? null,
    shipping_rate: s.shipping_cost?.shipping_rate?.display_name ?? null,
    gift_recipient: customField(fields, /recipient|address/),
    gift_note: customField(fields, /note/),
    wall_name: customField(fields, /wall|founder/),
    group_name: customField(fields, /church|group/),
    items,
    decks,
    bonus_decks: bonus.bonus_decks,
    journals: journals + bonus.journals,
    bonus_note: bonus.note,
    subtotal_cents: s.amount_subtotal ?? null,
    shipping_cents: s.shipping_cost?.amount_total ?? null,
    tax_cents: s.total_details?.amount_tax ?? null,
    total_cents: s.amount_total ?? null,
  };

  const { data, error } = await db.from('store_orders').insert(row).select('*').single();
  if (error) {
    if (error.code === '23505') return null; // a parallel retry won
    throw new Error(error.message);
  }
  return data as StoreOrder;
}

export async function markRefunded(paymentIntent: string) {
  await getSupabaseAdmin().from('store_orders').update({ status: 'refunded' }).eq('stripe_payment_intent', paymentIntent);
}

// ---------- GoHighLevel: buyers are customers (donors included, PLAN §5) ----------

export function buyerTags(o: Pick<StoreOrder, 'items'>): string[] {
  const tags = new Set(['cc-buyer']);
  for (const it of o.items) {
    const t = it.sku && TIER_TAG[it.sku];
    if (t) tags.add(t);
    if (it.sku === 'cc-give') tags.add('cc-gift-sender');
    if (it.sku === 'cc-bulk') tags.add('cc-church');
    if (it.sku === 'dna-journal') tags.add('cc-addon-journal');
  }
  return [...tags];
}

/** Adds the buyer to GoHighLevel with their tags. Skips quietly when GHL isn't configured. */
export async function tagBuyer(o: StoreOrder) {
  const token = process.env.GHL_PRIVATE_TOKEN;
  const location = process.env.GHL_LOCATION_ID;
  if (!token || !location || !o.email) return;
  const headers = { Authorization: `Bearer ${token}`, Version: '2021-07-28', 'Content-Type': 'application/json', Accept: 'application/json' };
  const res = await fetch('https://services.leadconnectorhq.com/contacts/upsert', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      locationId: location,
      email: o.email,
      ...(o.name ? { name: o.name } : {}),
      ...(o.phone ? { phone: o.phone } : {}),
      source: o.brand === 'cc' ? 'creedcards.com/checkout' : 'arkidentity.com/store',
    }),
  });
  if (!res.ok) throw new Error(`GHL upsert ${res.status}`);
  const id: string | undefined = (await res.json()).contact?.id;
  if (!id) throw new Error('GHL upsert returned no contact id');
  const tagRes = await fetch(`https://services.leadconnectorhq.com/contacts/${id}/tags`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ tags: buyerTags(o) }),
  });
  if (!tagRes.ok) throw new Error(`GHL tags ${tagRes.status}`);
}

// ---------- Admin ----------

export async function listOrders(): Promise<StoreOrder[]> {
  const { data, error } = await getSupabaseAdmin().from('store_orders').select('*').order('created_at', { ascending: true }).limit(2000);
  if (error) throw new Error(error.message);
  return (data ?? []) as StoreOrder[];
}

export async function getOrder(id: string): Promise<StoreOrder | null> {
  const { data } = await getSupabaseAdmin().from('store_orders').select('*').eq('id', id).maybeSingle();
  return (data as StoreOrder) ?? null;
}

export async function updateOrder(id: string, patch: Partial<StoreOrder>) {
  const { error } = await getSupabaseAdmin().from('store_orders').update(patch).eq('id', id);
  if (error) throw new Error(error.message);
}

/** Decks reserved for the progress bar: every order that wasn't refunded or canceled. */
export async function decksReserved(brand = 'cc'): Promise<number> {
  const { data, error } = await getSupabaseAdmin().from('store_orders').select('decks').eq('brand', brand).in('status', ['paid', 'packed', 'shipped']);
  if (error) throw new Error(error.message);
  return (data ?? []).reduce((n, r) => n + (r.decks ?? 0), 0);
}

// ---------- Pirate Ship CSV ----------

const csvCell = (v: unknown) => {
  const s = v == null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

// Rough weights for the label: deck ~7 oz with band + mailer, journal ~10 oz. Check on the scale.
const DECK_OZ = 7;
const JOURNAL_OZ = 10;

/**
 * One row per package. A Keep One, Give One order is two packages: one deck to
 * the buyer, one to the gift recipient (their address is free text, so that row
 * puts it all in Address 1 and says to check it).
 */
export function pirateShipCsv(orders: StoreOrder[]): string {
  const head = ['Order', 'Name', 'Address 1', 'Address 2', 'City', 'State', 'Zip', 'Country', 'Email', 'Phone', 'Weight (oz)', 'Shipping', 'Contents', 'Notes'];
  const rows: unknown[][] = [];
  for (const o of orders) {
    const a = o.ship_address ?? {};
    const short = o.id.slice(0, 8);
    const gift = o.items.some((i) => i.sku === 'cc-give') && o.gift_recipient;
    const giftDecks = gift ? o.items.filter((i) => i.sku === 'cc-give').reduce((n, i) => n + i.quantity, 0) : 0;
    const ownDecks = o.decks + o.bonus_decks - giftDecks;
    const contents = [`${ownDecks} deck${ownDecks === 1 ? '' : 's'}`, o.journals ? `${o.journals} journal` : null, o.bonus_note].filter(Boolean).join(' + ');
    rows.push([
      short, o.ship_name ?? o.name, a.line1, a.line2, a.city, a.state, a.postal_code, a.country ?? 'US', o.email, o.phone,
      ownDecks * DECK_OZ + o.journals * JOURNAL_OZ, o.shipping_rate, contents, o.notes,
    ]);
    if (gift) {
      rows.push([
        `${short}-gift`, '', o.gift_recipient, '', '', '', '', 'US', '', '', giftDecks * DECK_OZ, o.shipping_rate,
        `${giftDecks} gift deck${giftDecks === 1 ? '' : 's'}${o.gift_note ? ' + note' : ''}`, 'Gift: check the address. Note: ' + (o.gift_note ?? '(none)'),
      ]);
    }
  }
  return [head, ...rows].map((r) => r.map(csvCell).join(',')).join('\n');
}
