'use client';

import { useSyncExternalStore } from 'react';
import { cleanCart, type CartLine } from '@/lib/shopCart';

// The shop cart in this browser (lib/shopCart.ts explains why it lives here). Every read goes through cleanCart,
// so an old or hand-edited cart can't hold anything the catalog wouldn't sell.

const KEY = 'ark-shop-cart';
const EVENT = 'ark-shop-cart';
const EMPTY: CartLine[] = [];
let cache: { raw: string | null; lines: CartLine[] } = { raw: null, lines: EMPTY };

function read(): CartLine[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    /* storage blocked: the cart lives for this page only */
  }
  if (raw === cache.raw) return cache.lines;
  let lines = EMPTY;
  try {
    lines = raw ? cleanCart(JSON.parse(raw)) : EMPTY;
  } catch {
    lines = EMPTY;
  }
  cache = { raw, lines };
  return lines;
}

let memory: CartLine[] | null = null;

export function writeCart(lines: CartLine[]) {
  const clean = cleanCart(lines);
  try {
    localStorage.setItem(KEY, JSON.stringify(clean));
  } catch {
    memory = clean;
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener('storage', cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener('storage', cb);
  };
}

export function useCart(): CartLine[] {
  return useSyncExternalStore(subscribe, () => memory ?? read(), () => EMPTY);
}

export function addToCart(sku: string, qty = 1) {
  const now = memory ?? read();
  const has = now.find((l) => l.sku === sku);
  writeCart(has ? now.map((l) => (l.sku === sku ? { ...l, qty: l.qty + qty } : l)) : [...now, { sku, qty }]);
}

export function setQty(sku: string, qty: number) {
  const now = memory ?? read();
  writeCart(qty <= 0 ? now.filter((l) => l.sku !== sku) : now.map((l) => (l.sku === sku ? { ...l, qty } : l)));
}

export function clearCart() {
  writeCart([]);
}
