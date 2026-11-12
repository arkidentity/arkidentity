import type { Metadata } from 'next';
import Link from 'next/link';
import { ClearCart } from './ClearCart';
import s from '../shop.module.css';

export const metadata: Metadata = { title: 'Thank you' };

export default function Thanks() {
  return (
    <section className={s.empty}>
      <ClearCart />
      <h1>Thank you. Your order is in.</h1>
      <p>Your receipt is on its way by email. We pack every order by hand and email you a tracking number when it ships.</p>
      <p>
        <Link href="/shop" className={s.linkBtn}>
          Back to the shop
        </Link>
      </p>
    </section>
  );
}
