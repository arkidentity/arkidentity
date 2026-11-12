'use client';

import { useRouter } from 'next/navigation';
import { addToCart } from './cart';
import s from '../shop.module.css';

export function AddButton({ sku, label = 'Add to cart' }: { sku: string; label?: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      className={s.btn}
      onClick={() => {
        addToCart(sku, 1);
        router.push('/shop/cart');
      }}
    >
      {label}
    </button>
  );
}
