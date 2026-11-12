import type { Metadata } from 'next';
import Link from 'next/link';
import { CartLink } from './_shop/CartLink';
import s from './shop.module.css';

// ARK Identity Shop (PLAN §5a): its own header, cart and footer, not the ministry site's.
// Hidden while it's built: noindex and nothing links here. It moves to shop.arkidentity.com later.
export const metadata: Metadata = {
  title: { default: 'ARK Identity Shop', template: '%s · ARK Identity Shop' },
  description: 'Creed Cards, Daily DNA Journals and more for you, your family and your group.',
  robots: { index: false, follow: false },
};

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={s.shop}>
      <header className={s.head}>
        <Link href="/shop" className={s.mark}>
          <img src="/images/ark-identity-icon-2026.png" alt="" width={28} height={28} />
          <span>
            ARK Identity <b>Shop</b>
          </span>
        </Link>
        <CartLink />
      </header>
      <main className={s.main}>{children}</main>
      <footer className={s.foot}>
        <p>Secure checkout by Stripe. Your receipt comes from ARK Identity Shop.</p>
        <p>
          <Link href="/about">About ARK Identity</Link> · <a href="mailto:info@arkidentity.com">info@arkidentity.com</a>
        </p>
      </footer>
    </div>
  );
}
