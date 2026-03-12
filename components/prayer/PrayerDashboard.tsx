'use client';

import { useState, Fragment } from 'react';
import { usePrayer } from './PrayerContext';
import { prayerInfo } from '@/lib/prayerData';
import { MusicBar } from './MusicBar';

// Card distribution lookup
const totalCardsMap: Record<number, number> = {
  5: 4, 10: 8, 15: 12, 20: 16, 25: 20, 30: 25,
  35: 28, 40: 33, 45: 36, 50: 40, 55: 44, 60: 48
};

const getSystemCardsPerType = (duration: number): number => {
  if (duration <= 10) return 2;
  if (duration <= 25) return 3;
  return 4;
};

export function PrayerDashboard() {
  const {
    state,
    navigateTo,
    startSession,
    setSessionDuration,
    exitPrayer,
  } = usePrayer();
  const [activeDim, setActiveDim] = useState<number | null>(null);

  const totalCards = totalCardsMap[state.sessionDuration] || 8;
  const systemCardsPerType = getSystemCardsPerType(state.sessionDuration);
  const systemCards = systemCardsPerType * 3;
  const userCardsNeeded = totalCards - systemCards;

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    // Snap to 5-minute increments
    const snapped = Math.round(value / 5) * 5;
    setSessionDuration(Math.max(5, Math.min(60, snapped)));
  };

  return (
    <>
      <MusicBar showThemeSelector={true} />

      <div className="prayer-dashboard">
        {/* 4 Dimensions */}
        <p className="prayer-dim-heading">4 Dimensions of Prayer</p>
        <div className="prayer-dimensions-row prayer-dimensions-lobby">
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

        {/* Personal Prayer Section */}
        <div className="prayer-section">
          <div className="glass-card prayer-duration-card">
            <div className="prayer-duration-header">
              <span className="prayer-duration-label">Prayer length</span>
              <span className="prayer-duration-value">{state.sessionDuration} min ({totalCards} cards)</span>
            </div>

            <input
              type="range"
              className="prayer-duration-slider"
              min="5"
              max="60"
              step="5"
              value={state.sessionDuration}
              onChange={handleDurationChange}
            />

            <p className="prayer-card-summary">
              {userCardsNeeded} of your cards randomly selected
            </p>

            <div className="prayer-hero-actions">
              <button className="prayer-mycards-btn" onClick={() => navigateTo('my-cards')}>
                My Cards ({state.activeCards.length})
              </button>
              <button className="prayer-start-btn" onClick={startSession}>
                Start Prayer
              </button>
            </div>
          </div>
        </div>

        {/* Guided Activations Section */}
        <div className="prayer-section">
          <div className="glass-card prayer-section-row">
            <span className="prayer-section-label">
              Guided Activations <span className="count">(2)</span>
            </span>
            <button className="prayer-compact-btn" onClick={() => navigateTo('guided-activations')}>
              Explore →
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="prayer-footer">
          <div className="prayer-rhythm-display">
            <div className="prayer-rhythm-dots">
              {Array.from({ length: 7 }, (_, i) => (
                <span
                  key={i}
                  className={`rhythm-dot${i >= 7 - Math.min(state.streak.current, 7) ? ' filled' : ''}`}
                />
              ))}
            </div>
            <span className="prayer-rhythm-label">
              {state.streak.current === 0
                ? 'Start your prayer rhythm'
                : `${state.streak.current}-day rhythm`}
            </span>
          </div>
          <button className="prayer-exit-btn" onClick={exitPrayer}>
            ← Exit
          </button>
        </div>
      </div>
    </>
  );
}
