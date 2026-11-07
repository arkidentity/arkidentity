'use client';

import { useState } from 'react';
import type { StoreOrder } from '@/lib/store';

const fmt = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const money = (c: number | null) => (c == null ? '' : `$${(c / 100).toFixed(2)}`);
const VIEWS = ['to pack', 'packed', 'shipped', 'all'] as const;

export function OrderList({ initial }: { initial: StoreOrder[] }) {
  const [rows, setRows] = useState(initial);
  const [view, setView] = useState<(typeof VIEWS)[number]>('to pack');
  const [shipFor, setShipFor] = useState<string | null>(null);
  const [tracking, setTracking] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function act(o: StoreOrder, action: 'packed' | 'unpack' | 'shipped' | 'approve-message' | 'hide-message', extra: { tracking?: string } = {}) {
    setBusy(o.id);
    setError('');
    const res = await fetch(`/api/admin/orders/${o.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...extra }),
    }).catch(() => null);
    setBusy(null);
    if (!res?.ok) {
      setError((res && (await res.json().catch(() => ({}))).error) || 'Something went wrong.');
      return;
    }
    setShipFor(null);
    setTracking('');
    setRows((list) =>
      list.map((x) =>
        x.id === o.id
          ? action === 'approve-message' || action === 'hide-message'
            ? { ...x, wall_message_ok: action === 'approve-message' }
            : action === 'shipped'
              ? { ...x, status: 'shipped', tracking_number: extra.tracking ?? null, shipped_at: new Date().toISOString() }
              : { ...x, status: action === 'packed' ? 'packed' : 'paid' }
          : x
      )
    );
  }

  const shown = rows.filter((o) =>
    view === 'all' ? true : view === 'to pack' ? o.status === 'paid' : o.status === view
  );
  const live = rows.filter((o) => o.status !== 'refunded' && o.status !== 'canceled');
  const decks = live.reduce((n, o) => n + o.decks, 0);
  const toPack = rows.filter((o) => o.status === 'paid').reduce((n, o) => n + o.decks + o.bonus_decks, 0);
  const notes = rows.filter((o) => o.wall_message && o.wall_message_ok).length;

  return (
    <div>
      <p className="mb-4 text-sm" style={{ color: '#4a4540' }}>
        <b>{decks}</b> decks sold · <b>{toPack}</b> decks to pack (with bonus decks)
        {notes > 0 && (
          <>
            {' '}· <b>{notes}</b> note{notes === 1 ? '' : 's'} on the Founders wall
          </>
        )}
      </p>
      <div className="flex gap-2 mb-6 flex-wrap">
        {VIEWS.map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className="text-sm rounded-lg px-3 py-1.5 border capitalize"
            style={view === v ? { background: 'var(--navy)', color: '#fff', borderColor: 'var(--navy)' } : { borderColor: '#e5e1da', color: '#4a4540' }}
          >
            {v}
          </button>
        ))}
      </div>
      {error && <p className="mb-4 text-sm text-red-700">{error}</p>}
      {!shown.length && <p style={{ color: '#8a8378' }}>Nothing here.</p>}
      <ul className="space-y-3">
        {shown.map((o) => {
          const a = o.ship_address ?? {};
          return (
            <li key={o.id} className="rounded-xl border bg-white p-4" style={{ borderColor: '#e5e1da' }}>
              <div className="flex items-start justify-between gap-3">
                <p className="font-semibold" style={{ color: 'var(--navy)' }}>
                  {o.ship_name ?? o.name ?? o.email}
                  <span className="ml-2 text-xs font-normal" style={{ color: '#8a8378' }}>
                    {fmt(o.created_at)} · {money(o.total_cents)} · {o.shipping_rate ?? 'Standard'}
                  </span>
                </p>
                <span className="text-xs font-semibold capitalize" style={{ color: o.status === 'paid' ? '#b45309' : '#15803d' }}>
                  {o.status}
                </span>
              </div>
              <p className="mt-2 text-sm" style={{ color: '#4a4540' }}>
                {o.items.map((i) => `${i.quantity} × ${i.name}`).join(' · ')}
              </p>
              {(o.bonus_decks > 0 || o.bonus_note) && (
                <p className="mt-1 text-sm font-semibold" style={{ color: '#b45309' }}>
                  Add: {o.bonus_decks ? `${o.bonus_decks} free deck${o.bonus_decks === 1 ? '' : 's'}` : ''}
                  {o.bonus_note ? ` · ${o.bonus_note}` : ''}
                </p>
              )}
              <p className="mt-1 text-sm" style={{ color: '#8a8378' }}>
                {[a.line1, a.line2, a.city, a.state, a.postal_code].filter(Boolean).join(', ')}
                {o.email ? ` · ${o.email}` : ''}
              </p>
              {o.gifts?.length ? (
                <>
                  <p className="mt-1 text-sm" style={{ color: '#4a4540' }}>
                    {o.own_decks ? `${o.own_decks} deck${o.own_decks === 1 ? '' : 's'} to the buyer · ` : 'Nothing to the buyer’s address · '}
                    {o.gifts.length} gift package{o.gifts.length === 1 ? '' : 's'}:
                  </p>
                  {o.gifts.map((g, i) => (
                    <p key={i} className="text-sm pl-3" style={{ color: '#4a4540' }}>
                      {i + 1}. {[g.name, g.line1, g.line2, g.city, `${g.state} ${g.zip}`].filter(Boolean).join(', ')}
                      {g.note ? ` · Note: “${g.note}”` : ''}
                    </p>
                  ))}
                </>
              ) : (
                o.gift_recipient && (
                  <p className="mt-1 text-sm" style={{ color: '#4a4540' }}>
                    Gift to: {o.gift_recipient}
                    {o.gift_note ? ` · Note: “${o.gift_note}”` : ''}
                  </p>
                )
              )}
              {o.group_name && <p className="mt-1 text-sm" style={{ color: '#4a4540' }}>Group: {o.group_name}</p>}
              <p className="mt-1 text-sm" style={{ color: '#8a8378' }}>
                Founders wall: {o.wall_public && o.wall_name ? [o.wall_name, o.wall_city].filter(Boolean).join(', ') : 'anonymous'}
              </p>
              {o.wall_message && (
                <div className="mt-2 flex items-start justify-between gap-3 rounded-lg p-3" style={{ background: '#FAF8F5' }}>
                  <p className="text-sm" style={{ color: '#4a4540' }}>
                    “{o.wall_message}”
                    <span className="ml-2 text-xs font-semibold" style={{ color: o.wall_message_ok ? '#15803d' : '#8a8378' }}>
                      {o.wall_message_ok ? 'on the wall' : 'hidden'}
                    </span>
                  </p>
                  <button
                    disabled={busy === o.id}
                    onClick={() => act(o, o.wall_message_ok ? 'hide-message' : 'approve-message')}
                    className="text-sm font-semibold rounded-lg px-3 py-1 shrink-0 text-white"
                    style={{ background: o.wall_message_ok ? '#8a8378' : 'var(--navy)' }}
                  >
                    {o.wall_message_ok ? 'Hide' : 'Show again'}
                  </button>
                </div>
              )}
              {o.tracking_number && <p className="mt-1 text-sm" style={{ color: '#8a8378' }}>Tracking: {o.tracking_number}</p>}

              {shipFor === o.id ? (
                <div className="mt-3 flex gap-2 justify-end flex-wrap">
                  <input
                    value={tracking}
                    onChange={(e) => setTracking(e.target.value)}
                    placeholder="Tracking number"
                    className="flex-1 min-w-0 rounded-lg border px-3 py-1.5 text-sm"
                    style={{ borderColor: '#e5e1da' }}
                  />
                  <button onClick={() => setShipFor(null)} className="text-sm px-3 py-1.5" style={{ color: '#8a8378' }}>
                    Cancel
                  </button>
                  <button
                    disabled={busy === o.id || !tracking.trim()}
                    onClick={() => act(o, 'shipped', { tracking: tracking.trim() })}
                    className="text-sm font-semibold rounded-lg px-4 py-1.5 text-white disabled:opacity-50"
                    style={{ background: 'var(--navy)' }}
                  >
                    Shipped · email them
                  </button>
                </div>
              ) : (
                (o.status === 'paid' || o.status === 'packed') && (
                  <div className="mt-3 flex gap-2 justify-end">
                    {o.status === 'paid' ? (
                      <button disabled={busy === o.id} onClick={() => act(o, 'packed')} className="text-sm rounded-lg px-3 py-1.5 border" style={{ borderColor: '#e5e1da', color: '#4a4540' }}>
                        Packed
                      </button>
                    ) : (
                      <button disabled={busy === o.id} onClick={() => act(o, 'unpack')} className="text-sm px-3 py-1.5" style={{ color: '#8a8378' }}>
                        Not packed
                      </button>
                    )}
                    <button
                      onClick={() => setShipFor(o.id)}
                      className="text-sm font-semibold rounded-lg px-4 py-1.5 text-white"
                      style={{ background: 'var(--navy)' }}
                    >
                      Ship
                    </button>
                  </div>
                )
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
