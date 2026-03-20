'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function TrainingPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--primary-color)', paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }}>
      {/* Header */}
      <header className="app-header">
        <div className="app-header-inner">
          <Link href="/" className="app-header-logo">
            <Image
              src="/images/ark-logo-web.png"
              alt="ARK Identity"
              width={160}
              height={32}
              priority
              className="app-header-logo-img"
            />
          </Link>
        </div>
      </header>

      {/* Coming Soon Placeholder */}
      <div className="training-placeholder">
        <div className="training-placeholder-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--ark-gold)" strokeWidth="1.5" className="w-10 h-10" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
            <path d="M6 12v5c0 1.66 2.69 3 6 3s6-1.34 6-3v-5" />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-white mb-2">ARK Training</h2>
        <p className="text-white/50 text-sm max-w-xs leading-relaxed">
          Training for facilitators who lead ARK courses at their church.
          Certification tracks, resources, and community — all in one place.
        </p>

        <div className="training-placeholder-badge">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          Coming Soon
        </div>
      </div>
    </div>
  );
}
