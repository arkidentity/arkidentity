'use client';

import Link from 'next/link';
import Image from 'next/image';
import CreedCardsHome from '@creed-cards/app/page';

/**
 * Creed Cards, rendered natively from the shared `creed-cards` submodule —
 * the same way Daily DNA does it, and the same way this app already consumes
 * `ark-courses`.
 *
 * Replaces an iframe of the legacy static /creed-cards.html, which had drifted
 * from the real deck (it predates the revised atonement card text).
 */
export default function CreedCardsPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--primary-color)' }}>
      <header className="app-header">
        {/* Three columns: the side columns flex equally so the logo sits
            optically centred, and the logo is capped so the back link is not
            squeezed against it. Globals set height:28px/width:auto on the
            logo, which renders ~162px — wide enough to butt into the link on
            a 375px screen. */}
        <div className="app-header-inner" style={{ gap: 12 }}>
          <Link
            href="/resources"
            className="flex items-center gap-2 text-white/60 text-sm font-medium"
            style={{ flex: '1 1 0', minWidth: 0 }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Resources
          </Link>
          <Link href="/" className="app-header-logo" style={{ flex: '0 0 auto' }}>
            <Image
              src="/images/ark-logo-web.png"
              alt="ARK Identity"
              width={120}
              height={24}
              priority
              className="app-header-logo-img"
              style={{ maxWidth: 120 }}
            />
          </Link>
          <div style={{ flex: '1 1 0' }} />
        </div>
      </header>

      <div
        className="flex-1"
        style={{ paddingBottom: 'calc(70px + env(safe-area-inset-bottom, 0px))' }}
      >
        <CreedCardsHome />
      </div>
    </div>
  );
}
