'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getCardOfTheDay } from '@creed-cards/lib/cardData';
import type { CreedCard } from '@creed-cards/lib/cardData';

/**
 * Creed Card of the Day — the same card Daily DNA shows on its main page.
 *
 * Reads the deck straight from the shared `creed-cards` submodule, so there is
 * no cross-app HTTP call and no way for ARK and Daily DNA to disagree: both
 * compile the same `getCardOfTheDay()` against the same pinned commit.
 *
 * Computed in an effect rather than during render because getCardOfTheDay()
 * reads the client clock — deriving it on the server would produce a
 * hydration mismatch whenever the two disagree about the date.
 */
export default function CreedCardOfTheDay() {
  const [card, setCard] = useState<CreedCard | null>(null);

  useEffect(() => {
    setCard(getCardOfTheDay());
  }, []);

  if (!card) {
    // First paint only. Reserve the row instead of collapsing it, so the
    // resources list does not jump as the card lands.
    return <section style={{ minHeight: 72 }} aria-hidden />;
  }

  return (
    <section>
      <p className="text-white/40 text-[11px] font-bold uppercase tracking-[0.08em] mb-2">
        Creed Card of the Day
      </p>
      {/* Straight to the day's card, matching Daily DNA. Linking to
          /creed-cards only opened the dashboard, leaving the reader to hunt
          for the card they had just been shown. */}
      <Link
        href="/creed-cards/study?mode=daily"
        className="block rounded-2xl overflow-hidden"
        style={{
          background: `linear-gradient(145deg, ${card.colors.dark}, ${card.colors.dark}cc)`,
          border: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <div className="flex items-center gap-3.5 p-4">
          <div className="flex-1 min-w-0">
            <div className="text-white font-extrabold text-base tracking-wide truncate mb-0.5">
              {card.title}
            </div>
            <div className="text-white/70 text-xs truncate">{card.shortDesc}</div>
          </div>
          <span
            className="shrink-0 text-xs font-bold px-3 py-2 rounded-lg whitespace-nowrap"
            style={{ background: card.colors.accent, color: '#000' }}
          >
            Study →
          </span>
        </div>
      </Link>
    </section>
  );
}
