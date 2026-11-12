import Link from 'next/link';
import { CATALOG, COMING } from '@/lib/shopCatalog';
import { money, unitCents } from '@/lib/shopCart';
import s from './shop.module.css';

export const revalidate = 3600; // Early Bird prices end Nov 30

export default function ShopHome() {
  const from = unitCents(CATALOG['cc-one']);
  return (
    <>
      <section className={s.intro}>
        <h1>ARK Identity Shop</h1>
        <p>Tools for following Jesus with the people around you: at your table, in your group, across your church.</p>
      </section>

      <Link href="/shop/creed-cards" className={s.feature}>
        <img src="/shop/packing.webp" alt="A Creed Cards deck being packed for shipping" />
        <div>
          <span className={s.brand}>Creed Cards</span>
          <h2>Big beliefs. Small cards.</h2>
          <p>50 cards on the core beliefs of the Christian faith. One deck, a gift pack, a table of four or bulk for your church.</p>
          <span className={s.from}>
            From {money(from)} · Free shipping <b aria-hidden="true">→</b>
          </span>
        </div>
      </Link>

      <h2 className={s.sectionHead}>Coming soon</h2>
      <ul className={s.soon}>
        {COMING.map((c) => (
          <li key={c.key}>
            <span className={s.brand}>{c.brand}</span>
            <h3>{c.name}</h3>
            <p>{c.line}</p>
            <span className={s.when}>{c.when}</span>
          </li>
        ))}
      </ul>
    </>
  );
}
