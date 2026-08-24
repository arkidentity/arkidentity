'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

/**
 * Creed Card of the Day — mirrors the card on the Daily DNA main page.
 *
 * The deck lives in Daily DNA, so the card is fetched from its
 * /api/creed-card-of-the-day rather than copied into this repo. Falls back to
 * the plain "Creed Cards" entry point if the fetch fails, so the resources
 * page never loses the link.
 */

const API = 'https://dailydna.app/api/creed-card-of-the-day';

interface CreedCard {
  id: number;
  title: string;
  shortDesc: string;
  colors: { dark: string; accent: string };
}

export default function CreedCardOfTheDay() {
  const [card, setCard] = useState<CreedCard | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(API)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: { card: CreedCard }) => {
        if (!cancelled && data?.card?.title) setCard(data.card);
      })
      .catch(() => {
        /* leave `card` null — the fallback below still links through */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!card) {
    // Fallback: the original static entry point. Better a working link than
    // a blank slot on the page.
    return (
      <section>
        <Link href="/creed-cards" className="resources-section-card block">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(232,181,98,0.15)' }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--ark-gold)" strokeWidth="1.5" className="w-5 h-5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                  <path d="M8 21h8" />
                  <path d="M12 17v4" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Creed Cards</h2>
                <p className="text-white/50 text-sm">50 core truths of the Christian faith</p>
              </div>
            </div>
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-5 h-5 opacity-40" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </div>
        </Link>
      </section>
    );
  }

  return (
    <section>
      <p className="text-white/40 text-[11px] font-bold uppercase tracking-[0.08em] mb-2">
        Creed Card of the Day
      </p>
      <Link
        href="/creed-cards"
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
