'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { CATALOG } from '@/lib/shopCatalog';
import { bulkExtras, CART_NAME, money, offers, totals, unitCents } from '@/lib/shopCart';
import { addToCart, setQty, useCart } from '../_shop/cart';
import s from '../shop.module.css';

type StripeEmbedded = { mount: (el: HTMLElement) => void; destroy: () => void };
type StripeJs = { initEmbeddedCheckout: (o: { fetchClientSecret: () => Promise<string> }) => Promise<StripeEmbedded> };
declare global {
  interface Window {
    Stripe?: (pk: string) => StripeJs;
  }
}

function loadStripe(): Promise<void> {
  if (window.Stripe) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const el = document.createElement('script');
    el.src = 'https://js.stripe.com/v3/';
    el.async = true;
    el.onload = () => resolve();
    el.onerror = () => reject(new Error("Stripe.js didn't load"));
    document.head.appendChild(el);
  });
}

const ADDON_LINE: Record<string, string> = {
  'dna-journal': '60 days of journal pages, printed. Pairs with a deck.',
};

/**
 * /shop/cart. Brand sites add with /shop/cart?add=<sku>&qty=<n> (one or more, comma-separated: add=cc-one,dna-journal).
 * Checkout opens Stripe's form right here (same embedded Checkout as creedcards.com).
 */
export function Cart() {
  const lines = useCart();
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');
  const box = useRef<HTMLDivElement>(null);
  const [src, setSrc] = useState('');

  // ?add= from a brand site: put it in the cart, then clean the URL so a reload doesn't add it twice.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const add = (q.get('add') ?? '').split(',').filter((k) => CATALOG[k]?.cart);
    const qty = Number(q.get('qty')) || 0;
    add.forEach((k, i) => addToCart(k, i === 0 && qty ? qty : CATALOG[k].cart!.min));
    const ref = q.get('src') ?? '';
    if (/^[a-z0-9-]{1,40}$/.test(ref)) setSrc(ref);
    if (add.length || ref) window.history.replaceState(null, '', '/shop/cart');
  }, []);

  // Stripe's form, once the buyer presses Checkout. Torn down if they go back to the cart.
  useEffect(() => {
    if (!paying) return;
    let checkout: StripeEmbedded | null = null;
    let stop = false;
    (async () => {
      try {
        const res = await fetch('/api/shop/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lines, ui: 'embedded', src: src || undefined }),
        });
        const data = (await res.json().catch(() => ({}))) as { clientSecret?: string; publishableKey?: string; error?: string };
        if (!res.ok || !data.clientSecret || !data.publishableKey) throw new Error(data.error || 'Checkout is unavailable.');
        await loadStripe();
        if (stop || !window.Stripe || !box.current) return;
        checkout = await window.Stripe(data.publishableKey).initEmbeddedCheckout({ fetchClientSecret: async () => data.clientSecret as string });
        if (stop) return checkout.destroy();
        checkout.mount(box.current);
      } catch (e) {
        if (stop) return;
        setError(e instanceof Error ? e.message : 'Checkout is unavailable.');
        setPaying(false);
      }
    })();
    return () => {
      stop = true;
      checkout?.destroy();
    };
    // Lines can't change while paying (the cart is hidden), so `paying` alone restarts it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paying]);

  const t = totals(lines);
  const extra = offers(lines);

  if (!lines.length) {
    return (
      <section className={s.empty}>
        <h1>Your cart is empty</h1>
        <p>
          <Link href="/shop/creed-cards" className={s.btn}>
            Shop Creed Cards
          </Link>
        </p>
      </section>
    );
  }

  if (paying) {
    return (
      <section className={s.pay}>
        <button type="button" className={s.back} onClick={() => setPaying(false)}>
          ← Back to cart
        </button>
        <p className={s.muted}>Opening secure checkout…</p>
        <div ref={box} />
      </section>
    );
  }

  return (
    <section className={s.cart}>
      <h1>Your cart</h1>
      <ul className={s.lines}>
        {lines.map((l) => {
          const p = CATALOG[l.sku];
          const c = p.cart!;
          return (
            <li key={l.sku}>
              <div>
                <span className={s.brand}>{p.brand === 'cc' ? 'Creed Cards' : 'ARK Identity'}</span>
                <h3>{CART_NAME[l.sku] ?? p.name.replace(/^Creed Cards: /, '')}</h3>
                <span className={s.muted}>{money(unitCents(p))} each</span>
                {l.sku === 'cc-bulk' && <span className={s.free}>Plus {bulkExtras(l.qty).join(', ')}</span>}
              </div>
              <div className={s.lineRight}>
                {c.max > 1 ? (
                  <div className={s.counter}>
                    <button type="button" onClick={() => setQty(l.sku, l.qty - 1 < c.min ? 0 : l.qty - 1)} aria-label={`One fewer ${p.name}`}>
                      &minus;
                    </button>
                    <span className={s.qty}>{l.qty}</span>
                    <button type="button" onClick={() => setQty(l.sku, l.qty + 1)} disabled={l.qty >= c.max} aria-label={`One more ${p.name}`}>
                      +
                    </button>
                  </div>
                ) : (
                  <button type="button" className={s.linkBtn} onClick={() => setQty(l.sku, 0)}>
                    Remove
                  </button>
                )}
                <b>{money(unitCents(p) * l.qty)}</b>
              </div>
            </li>
          );
        })}
      </ul>

      {extra.map((sku) => (
        <div key={sku} className={s.offer}>
          <img src="/shop/journal-cover.jpg" alt="" />
          <div>
            <h3>Add a {CATALOG[sku].name}?</h3>
            <p>{ADDON_LINE[sku] ?? ''}</p>
          </div>
          <button type="button" className={s.btnLight} onClick={() => addToCart(sku, 1)}>
            Add {money(unitCents(CATALOG[sku]))}
          </button>
        </div>
      ))}

      <dl className={s.sum}>
        <div>
          <dt>Subtotal</dt>
          <dd>{money(t.subtotal)}</dd>
        </div>
        <div>
          <dt>Shipping</dt>
          <dd>Free{t.packages > 1 ? ` (${t.packages} packages)` : ''}</dd>
        </div>
        {t.priority && (
          <p className={s.muted}>Priority Mail is {money(t.priorityCents)} more; choose it at checkout. Tax is added at checkout.</p>
        )}
        {!t.priority && <p className={s.muted}>Tax is added at checkout.</p>}
      </dl>
      {lines.some((l) => l.sku === 'cc-give') && (
        <p className={s.muted}>Keep One, Give One: you&apos;ll type the gift address at checkout. Sending to more than one person? Order on creedcards.com.</p>
      )}
      {error && <p className={s.error}>{error}</p>}
      <div className={s.rowEnd}>
        <Link href="/shop" className={s.linkBtn}>
          Keep shopping
        </Link>
        <button type="button" className={s.btn} onClick={() => (setError(''), setPaying(true))}>
          Checkout
        </button>
      </div>
    </section>
  );
}
