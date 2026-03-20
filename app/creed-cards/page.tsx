'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function CreedCardsPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--primary-color)' }}>
      {/* Header */}
      <header className="app-header">
        <div className="app-header-inner">
          <Link href="/resources" className="flex items-center gap-2 text-white/60 text-sm font-medium">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Resources
          </Link>
          <Link href="/" className="app-header-logo">
            <Image
              src="/images/ark-logo-web.png"
              alt="ARK Identity"
              width={120}
              height={24}
              priority
              className="app-header-logo-img"
            />
          </Link>
          <div style={{ width: 80 }} />
        </div>
      </header>

      {/* Creed Cards iframe */}
      <div className="flex-1" style={{ paddingBottom: 'calc(70px + env(safe-area-inset-bottom, 0px))' }}>
        <iframe
          src="/creed-cards.html"
          className="w-full h-full border-0"
          style={{ minHeight: 'calc(100vh - 60px - 70px - env(safe-area-inset-bottom, 0px))' }}
          title="Creed Cards"
          allow="fullscreen"
        />
      </div>
    </div>
  );
}
