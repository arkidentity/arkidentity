'use client';

import '@creed-cards/styles/card-flip.css';
import { CreedCardsProvider } from '@creed-cards/components/CreedCardsProvider';

/**
 * Mirrors Daily DNA's creed-cards layout so both apps render the shared deck
 * identically. `basePath` tells the shared components where they are mounted,
 * so internal links resolve to /creed-cards/* in this app too.
 *
 * The nav height var is what the shared components use to keep their own
 * controls clear of the host app's bottom bar — ARK's is 70px, Daily DNA's 80.
 */
export default function CreedCardsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ '--pwa-nav-height': '70px' } as React.CSSProperties}>
      <CreedCardsProvider basePath="/creed-cards">{children}</CreedCardsProvider>
    </div>
  );
}
