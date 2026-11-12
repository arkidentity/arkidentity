import type { Metadata } from 'next';
import { CATALOG } from '@/lib/shopCatalog';
import { money, unitCents, wasCents } from '@/lib/shopCart';
import { AddButton } from '../_shop/AddButton';
import { CcBulk } from './CcBulk';
import s from '../shop.module.css';

export const revalidate = 3600; // Early Bird prices end Nov 30
export const metadata: Metadata = { title: 'Creed Cards' };

// Same three options and bulk as creedcards.com (creedcards-site app/_site/config.ts TIERS). Gift orders with more
// than one recipient still go through creedcards.com (its checkout asks for each address).
const OPTIONS = [
  { sku: 'cc-one', name: 'One Deck', items: ['One First Edition deck', 'Free shipping'] },
  { sku: 'cc-give', name: 'Keep One, Give One', badge: 'Best for Christmas', items: ['One for you, one shipped to someone you love', 'Their address goes in at checkout'] },
  { sku: 'cc-table', name: 'The Table', items: ['Four decks for your table (buy 3, get 1 free)', 'Printable 6-week guide for a group of four'] },
];

export default function CreedCardsShop() {
  return (
    <>
      <section className={s.productHead}>
        <img src="/shop/gift.webp" alt="Creed Cards deck wrapped as a gift" />
        <div>
          <span className={s.brand}>Creed Cards</span>
          <h1>Big beliefs. Small cards.</h1>
          <p>
            50 cards on the core beliefs of the Christian faith, to help you understand them and explain them to someone else.{' '}
            <a href="https://www.creedcards.com">See the cards at creedcards.com</a>.
          </p>
        </div>
      </section>

      <div className={s.options}>
        {OPTIONS.map((o) => {
          const p = CATALOG[o.sku];
          const was = wasCents(p);
          return (
            <div key={o.sku} className={s.option}>
              {o.badge && <span className={s.badgeTag}>{o.badge}</span>}
              <h3>{o.name}</h3>
              <div className={s.price}>
                {money(unitCents(p))}
                {was && <s className={s.was}>{money(was)}</s>}
              </div>
              <ul>
                {o.items.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
              <AddButton sku={o.sku} />
            </div>
          );
        })}
      </div>

      <CcBulk />
    </>
  );
}
