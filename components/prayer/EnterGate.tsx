'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePrayer } from './PrayerContext';
import type { PrayerTheme } from '@/lib/prayerData';

export function EnterGate() {
  const { state, setTheme, navigateTo, playMusic } = usePrayer();

  const handleEnter = () => {
    playMusic();
    navigateTo('dashboard');
  };

  const themes: PrayerTheme[] = ['fire', 'ocean', 'forest'];

  return (
    <div className="prayer-enter-gate">
      {/* Back Button */}
      <Link href="/journal" className="prayer-back-button">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5" />
          <path d="M12 19l-7-7 7-7" />
        </svg>
        <span>Journal</span>
      </Link>

      {/* Logo */}
      <Image
        src="/images/4d-prayer-logo.png"
        alt="4D Prayer"
        width={210}
        height={210}
        className="prayer-logo"
        priority
      />

      {/* Scripture */}
      <div className="prayer-gate-scripture">
        <p className="prayer-gate-scripture-text">
          &ldquo;Therefore confess your sins to each other and pray for each other
          so that you may be healed. The prayer of a righteous person is powerful
          and effective.&rdquo;
        </p>
      </div>
      <p className="prayer-gate-scripture-ref">— James 5:16 NIV</p>

      {/* Theme Selector */}
      <div className="prayer-theme-selector">
        {themes.map((theme) => (
          <button
            key={theme}
            className={`prayer-theme-option ${theme} ${state.theme === theme ? 'active' : ''}`}
            onClick={() => setTheme(theme)}
            aria-label={`Select ${theme} theme`}
          />
        ))}
      </div>
      <p className="prayer-theme-label">Select your prayer theme</p>

      {/* Enter Button */}
      <button className="prayer-enter-btn" onClick={handleEnter}>
        Enter
      </button>
    </div>
  );
}
