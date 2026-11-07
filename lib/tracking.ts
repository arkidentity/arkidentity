// Bulk tracking import for /admin/orders (ark-store SHIPPING-PLAN.md).
// Flow: Pirate Ship CSV export (lib/store.ts pirateShipCsv) → buy labels in Pirate Ship → export Pirate Ship's
// shipments as CSV → upload here → preview → apply: tracking saved per package, buyers emailed once per order.
//
// A package is the buyer's own box (order.tracking_number) or one gift box (order.gifts[i].tracking).
// Rows are matched by our reference ("abcd1234" / "abcd1234-g1") when Pirate Ship kept it, else by name + ZIP.
// Column names vary, so headers are found by pattern, not position.

import type { GiftPackage, StoreOrder } from '@/lib/store';

export type Package = {
  orderId: string;
  ref: string; // "abcd1234" own box, "abcd1234-g1" gift 1
  gift: number; // -1 = own box, else index into order.gifts
  name: string;
  zip: string;
  tracking: string | null;
};

export type TrackingMatch = { orderId: string; ref: string; gift: number; name: string; tracking: string; replaces: string | null };
export type TrackingMiss = { line: number; name: string; zip: string; tracking: string; reason: string };

/** Minimal RFC 4180 CSV parser (quotes, doubled quotes, commas and newlines inside quotes). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  const s = text.replace(/^﻿/, '');
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (quoted) {
      if (ch === '"' && s[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') {
      row.push(cell);
      cell = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && s[i + 1] === '\n') i++;
      row.push(cell);
      if (row.some((c) => c.trim())) rows.push(row);
      row = [];
      cell = '';
    } else cell += ch;
  }
  row.push(cell);
  if (row.some((c) => c.trim())) rows.push(row);
  return rows;
}

const norm = (s: string | null | undefined) => (s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
const zip5 = (s: string | null | undefined) => (s ?? '').replace(/\D/g, '').slice(0, 5);

/** Every package an order ships: the buyer's box (unless all decks are gifts and nothing else goes to them) + each gift. */
export function packagesOf(o: StoreOrder): Package[] {
  const short = o.id.slice(0, 8);
  const gifts: GiftPackage[] = o.gifts ?? [];
  const out: Package[] = [];
  const ownBox = !gifts.length || (o.own_decks ?? 1) > 0 || o.journals > 0;
  if (ownBox) {
    out.push({ orderId: o.id, ref: short, gift: -1, name: o.ship_name ?? o.name ?? '', zip: o.ship_address?.postal_code ?? '', tracking: o.tracking_number });
  }
  gifts.forEach((g, i) => out.push({ orderId: o.id, ref: `${short}-g${i + 1}`, gift: i, name: g.name, zip: g.zip, tracking: g.tracking ?? null }));
  return out;
}

/** True when every package of the order has a tracking number. */
export function allShipped(o: StoreOrder) {
  return packagesOf(o).every((p) => !!p.tracking);
}

function column(head: string[], ...res: RegExp[]) {
  for (const re of res) {
    const i = head.findIndex((h) => re.test(h.trim()));
    if (i >= 0) return i;
  }
  return -1;
}

/** Reads a Pirate Ship (or any) shipments CSV and matches each row to a package. Nothing is saved. */
export function matchTracking(orders: StoreOrder[], csv: string): { matches: TrackingMatch[]; misses: TrackingMiss[]; error?: string } {
  const rows = parseCsv(csv);
  if (rows.length < 2) return { matches: [], misses: [], error: 'The file has no rows.' };
  const head = rows[0];
  const cTrack = column(head, /^tracking( ?(number|#|no\.?))?$/i, /tracking/i);
  const cRef = column(head, /^order( ?(id|#|number|no\.?))?$/i, /^reference|^ref\b/i, /order/i);
  const cName = column(head, /^(recipient|to)? ?(full )?name$/i, /^recipient/i, /name/i);
  const cZip = column(head, /zip|postal/i);
  if (cTrack < 0) return { matches: [], misses: [], error: 'No "Tracking" column in this file.' };

  const live = orders.filter((o) => o.status !== 'refunded' && o.status !== 'canceled');
  const pkgs = live.flatMap(packagesOf);
  const byRef = new Map(pkgs.map((p) => [p.ref.toLowerCase(), p]));
  const used = new Set<string>();
  const matches: TrackingMatch[] = [];
  const misses: TrackingMiss[] = [];

  rows.slice(1).forEach((r, k) => {
    const line = k + 2;
    const tracking = (r[cTrack] ?? '').replace(/\s+/g, '').toUpperCase();
    const name = cName >= 0 ? (r[cName] ?? '').trim() : '';
    const zip = cZip >= 0 ? zip5(r[cZip]) : '';
    if (!tracking) return; // unpaid/void rows
    if (!/^[A-Z0-9]{10,40}$/.test(tracking)) return void misses.push({ line, name, zip, tracking, reason: 'Not a tracking number' });

    let p: Package | undefined;
    const ref = cRef >= 0 ? (r[cRef] ?? '').trim().toLowerCase().match(/[0-9a-f]{8}(-g\d+)?/)?.[0] : undefined;
    if (ref) p = byRef.get(ref);
    if (!p && name && zip) {
      // Name + ZIP among packages not matched yet; prefer ones still without tracking.
      const cands = pkgs.filter((x) => !used.has(x.ref) && norm(x.name) === norm(name) && zip5(x.zip) === zip);
      p = cands.find((x) => !x.tracking) ?? cands[0];
      if (cands.filter((x) => !x.tracking).length > 1) {
        return void misses.push({ line, name, zip, tracking, reason: 'Two open packages to this name + ZIP: ship it by hand' });
      }
    }
    if (!p) return void misses.push({ line, name, zip, tracking, reason: ref ? `No open order ${ref}` : 'No order to this name + ZIP' });
    if (used.has(p.ref)) return void misses.push({ line, name, zip, tracking, reason: `Second label for ${p.ref}` });
    if (p.tracking === tracking) return; // already saved: re-uploading the same file is a no-op
    used.add(p.ref);
    matches.push({ orderId: p.orderId, ref: p.ref, gift: p.gift, name: p.name, tracking, replaces: p.tracking });
  });
  return { matches, misses };
}

/** Label for the email: "2 Creed Cards decks + 1 DNA Journal" (own box) or "Gift deck to Jane Doe". */
export function packageLabel(o: StoreOrder, gift: number): string {
  if (gift >= 0) {
    const g = o.gifts?.[gift];
    const n = g?.decks ?? 1;
    return `Gift deck${n === 1 ? '' : 's'} to ${g?.name ?? 'your recipient'}`;
  }
  const giftDecks = (o.gifts ?? []).reduce((n, g) => n + g.decks, 0);
  const decks = o.own_decks ?? Math.max(0, o.decks + o.bonus_decks - giftDecks);
  return [decks ? `${decks} Creed Cards deck${decks === 1 ? '' : 's'}` : null, o.journals ? `${o.journals} DNA Journal` : null]
    .filter(Boolean)
    .join(' + ') || 'Your order';
}

/**
 * Saves matched tracking numbers and emails each buyer once for the packages that just shipped.
 * An order becomes "shipped" when every package has tracking; until then it keeps its status.
 */
export async function applyTracking(matches: TrackingMatch[], deps: {
  getOrder: (id: string) => Promise<StoreOrder | null>;
  updateOrder: (id: string, patch: Partial<StoreOrder>) => Promise<void>;
  email: (o: StoreOrder, packages: { label: string; tracking: string }[], more: number) => Promise<unknown>;
}) {
  const now = new Date().toISOString();
  const byOrder = new Map<string, TrackingMatch[]>();
  matches.forEach((m) => byOrder.set(m.orderId, [...(byOrder.get(m.orderId) ?? []), m]));
  const result = { orders: 0, packages: 0, emailed: 0, failed: [] as string[] };

  for (const [id, ms] of byOrder) {
    const o = await deps.getOrder(id);
    if (!o) {
      result.failed.push(`${id.slice(0, 8)}: order not found`);
      continue;
    }
    const gifts = (o.gifts ?? []).map((g) => ({ ...g }));
    const patch: Partial<StoreOrder> = {};
    for (const m of ms) {
      if (m.gift < 0) {
        patch.tracking_number = m.tracking;
      } else if (gifts[m.gift]) {
        gifts[m.gift] = { ...gifts[m.gift], tracking: m.tracking, shipped_at: now };
      }
    }
    if (gifts.length) patch.gifts = gifts;
    const next = { ...o, ...patch } as StoreOrder;
    const done = allShipped(next);
    if (done) {
      patch.status = 'shipped';
      patch.shipped_at = now;
    }
    try {
      await deps.updateOrder(id, patch);
      result.orders++;
      result.packages += ms.length;
    } catch (e) {
      result.failed.push(`${id.slice(0, 8)}: ${e instanceof Error ? e.message : 'save failed'}`);
      continue;
    }
    // Only new tracking numbers are emailed (a corrected number re-sends that package's line).
    if (o.email) {
      const more = packagesOf(next).filter((p) => !p.tracking).length;
      try {
        await deps.email(next, ms.map((m) => ({ label: packageLabel(next, m.gift), tracking: m.tracking })), more);
        result.emailed++;
      } catch (e) {
        result.failed.push(`${id.slice(0, 8)}: saved, but the email failed (${e instanceof Error ? e.message : 'error'})`);
      }
    }
  }
  return result;
}
