'use client';

import { useState, Fragment } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePrayer } from './PrayerContext';
import { prayerInfo } from '@/lib/prayerData';
import type { PrayerTheme } from '@/lib/prayerData';

export function EnterGate() {
  const { state, setTheme, navigateTo, playMusic } = usePrayer();
  const [activeDim, setActiveDim] = useState<number | null>(null);

  const handleEnter = () => {
    playMusic();
    navigateTo('dashboard');
  };

  const prayerThemes: PrayerTheme[] = ['fire', 'ocean', 'forest'];

  return (
    <div className="prayer-enter-gate">
      {/* Theme Selector Row */}
      <div className="prayer-gate-back-row">
        <Link href="/journal" className="prayer-back-button">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
          <span>Journal</span>
        </Link>
        <div className="prayer-theme-selector-mini">
          {prayerThemes.map((t) => (
            <button
              key={t}
              className={`prayer-theme-option-mini ${t} ${state.theme === t ? 'active' : ''}`}
              onClick={() => setTheme(t)}
              aria-label={`Select ${t} theme`}
            />
          ))}
        </div>
      </div>

      {/* Centered Content */}
      <div className="prayer-gate-content">
        {/* Logo */}
        <Image
          src="/images/4d-prayer-logo.png"
          alt="4D Prayer"
          width={160}
          height={160}
          className="prayer-logo"
          priority
        />

        {/* 4 Dimensions */}
        <p className="prayer-dim-heading">4 Dimensions of Prayer</p>
        <div className="prayer-dimensions-row">
          {[
            { d: '1D', label: 'Revere' },
            { d: '2D', label: 'Reflect' },
            { d: '3D', label: 'Request' },
            { d: '4D', label: 'Rest' },
          ].map(({ d, label }, i) => (
            <Fragment key={d}>
              <div className="prayer-dimension-item" onClick={() => setActiveDim(i)}>
                <div className="prayer-dimension-circle">{d}</div>
                <span className="prayer-dimension-label">{label}</span>
              </div>
              {i < 3 && <div className="prayer-dim-connector" />}
            </Fragment>
          ))}
        </div>
        <p className="prayer-dim-hint">tap to reveal their meaning</p>

        {/* Dimension Popup */}
        {activeDim !== null && (
          <div className="prayer-dim-popup-overlay" onClick={() => setActiveDim(null)}>
            <div className="prayer-dim-popup" onClick={(e) => e.stopPropagation()}>
              <div className="prayer-dim-popup-header">
                <span className="prayer-dim-popup-badge">{activeDim + 1}D</span>
                <h3>{prayerInfo.dimensions[activeDim].name}</h3>
              </div>
              <p className="prayer-dim-popup-tagline">{prayerInfo.dimensions[activeDim].tagline}</p>
              <p className="prayer-dim-popup-desc">{prayerInfo.dimensions[activeDim].description}</p>
              <p className="prayer-dim-popup-tip">{prayerInfo.dimensions[activeDim].tip}</p>
              <button className="prayer-dim-popup-btn" onClick={() => setActiveDim(null)}>Got It</button>
            </div>
          </div>
        )}

        {/* Scripture */}
        <div className="prayer-gate-scripture">
          <p className="prayer-gate-scripture-text">
            &ldquo;Be anxious for nothing, but in everything by prayer and supplication
            with thanksgiving let your requests be made known to God. And the peace of God,
            which surpasses all comprehension, will guard your hearts and your minds
            in Christ Jesus.&rdquo;
          </p>
        </div>
        <p className="prayer-gate-scripture-ref">— Philippians 4:6-7 NASB1995</p>

        {/* Enter Button */}
        <button className="prayer-enter-btn" onClick={handleEnter}>
          Enter
        </button>
      </div>
    </div>
  );
}
