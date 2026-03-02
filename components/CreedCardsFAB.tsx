'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

const HIDDEN_PATHS = ['/creed-cards', '/about', '/team', '/beliefs', '/giving', '/get-involved', '/vision-2026', '/iowa', '/login', '/reset-password', '/auth'];

export function CreedCardsFAB() {
  const pathname = usePathname();
  const [learned, setLearned] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const refresh = () => {
      try {
        const stored = JSON.parse(localStorage.getItem('creedcards_learned') || '[]');
        setLearned(Array.isArray(stored) ? stored.length : 0);
      } catch {
        setLearned(0);
      }
    };
    refresh();
    // Listen for updates from creed cards page
    window.addEventListener('creedcards-updated', refresh);
    return () => window.removeEventListener('creedcards-updated', refresh);
  }, []);

  // Hide on certain pages
  if (HIDDEN_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))) return null;

  return (
    <Link href="/creed-cards" className="creed-cards-fab" aria-label="Creed Cards">
      <span className="creed-cards-fab-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      </span>
      <span className="creed-cards-fab-text">Creed<br />Cards</span>
      <span className="creed-cards-fab-badge">{learned}/50</span>
    </Link>
  );
}
