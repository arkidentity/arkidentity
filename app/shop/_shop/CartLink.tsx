'use client';

import Link from 'next/link';
import { useCart } from './cart';
import s from '../shop.module.css';

export function CartLink() {
  const lines = useCart();
  const n = lines.reduce((t, l) => t + l.qty, 0);
  return (
    <Link href="/shop/cart" className={s.cartLink} aria-label={n ? `Cart, ${n} items` : 'Cart, empty'}>
      Cart{n ? <span className={s.badge}>{n}</span> : null}
    </Link>
  );
}
