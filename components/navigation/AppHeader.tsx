'use client';

import Link from 'next/link';

export function AppHeader() {
  return (
    <header className="app-header">
      <div className="app-header-inner">
        {/* Logo */}
        <Link href="/journal" className="app-header-logo">
          <span className="logo-ark">ARK</span>
          <span className="logo-identity">IDENTITY</span>
        </Link>

        {/* Profile */}
        <Link href="/profile" className="app-header-profile" aria-label="Profile">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </Link>
      </div>
    </header>
  );
}
