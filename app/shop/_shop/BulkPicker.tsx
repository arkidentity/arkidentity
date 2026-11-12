'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CATALOG } from '@/lib/shopCatalog';
import { money, unitCents, wasCents } from '@/lib/shopCart';
import { addToCart } from './cart';
import s from '../shop.module.css';

// One bulk counter for every bulk item (Creed Cards now, books next: 10+ of one title). Same feel as the counter on
// creedcards.com (creedcards-site app/_site/BulkPicker.tsx). `extras` lists what comes free at this number.
export function BulkPicker({
  sku,
  title,
  noun,
  lead,
  extras,
  nudge,
}: {
  sku: string;
  title: string;
  noun: [string, string];
  lead?: string;
  extras?: (n: number) => string[];
  nudge?: (n: number) => string | null;
}) {
  const p = CATALOG[sku];
  const MIN = p.cart?.min ?? 10;
  const MAX = p.cart?.max ?? 500;
  const router = useRouter();
  const [n, setN] = useState(MIN);
  const [text, setText] = useState(String(MIN));
  const clamp = (v: number) => Math.min(MAX, Math.max(MIN, Math.round(v) || MIN));
  const go = (v: number) => {
    const c = clamp(v);
    setN(c);
    setText(String(c));
  };
  const unit = unitCents(p);
  const was = wasCents(p);
  const word = (k: number) => (k === 1 ? noun[0] : noun[1]);
  const tip = nudge?.(n);

  return (
    <div className={s.bulk}>
      <h3>{title}</h3>
      <div className={s.price}>
        {money(unit)}
        <small> {noun[0] === 'deck' ? 'a deck' : `per ${noun[0]}`}</small>
        {was && <s className={s.was}>{money(was)}</s>}
      </div>
      {lead && <p>{lead}</p>}
      <div className={s.bulkPick}>
        <div className={s.counter}>
          <button type="button" onClick={() => go(n - 1)} disabled={n <= MIN} aria-label={`One fewer ${noun[0]}`}>
            &minus;
          </button>
          <input
            inputMode="numeric"
            aria-label={`Number of ${noun[1]}`}
            value={text}
            onChange={(e) => {
              const t = e.target.value.replace(/\D/g, '').slice(0, 3);
              setText(t);
              const v = Number(t);
              if (v >= MIN && v <= MAX) setN(v);
            }}
            onBlur={() => go(Number(text))}
          />
          <button type="button" onClick={() => go(n + 1)} disabled={n >= MAX} aria-label={`One more ${noun[0]}`}>
            +
          </button>
          <span>{noun[1]}</span>
        </div>
        <div className={s.bulkTotal}>{money(n * unit)}</div>
      </div>
      {extras && (
        <ul className={s.extras} aria-live="polite">
          {extras(n).map((x) => (
            <li key={x}>
              <b>+</b> {x}
            </li>
          ))}
        </ul>
      )}
      {tip && <p className={s.nudge}>{tip}</p>}
      <div className={s.rowEnd}>
        <span className={s.muted}>Ships to one address.</span>
        <button
          type="button"
          className={s.btn}
          onClick={() => {
            addToCart(sku, n);
            router.push('/shop/cart');
          }}
        >
          Add {n} {word(n)} to cart
        </button>
      </div>
    </div>
  );
}
