'use client';

import Image from 'next/image';
import { usePrayer } from './PrayerContext';
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
    showInfo,
    exitPrayer,
  } = usePrayer();

  const totalCards = totalCardsMap[state.sessionDuration] || 8;
  const systemCardsPerType = getSystemCardsPerType(state.sessionDuration);
  const systemCards = systemCardsPerType * 3;
  const userCardsNeeded = totalCards - systemCards;
  const availableUserCards = state.activeCards.length;

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
        {/* Subheader */}
        <div className="prayer-subheader">
          <h1 className="prayer-welcome-title">
            <Image
              src="/images/4d-prayer-logo.png"
              alt="4D"
              width={28}
              height={28}
              className="prayer-title-icon"
            />
            Prayer
          </h1>
          <button className="prayer-info-link" onClick={showInfo}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4" />
              <path d="M12 8h.01" />
            </svg>
            What is 4D Prayer?
          </button>
        </div>

        {/* Personal Prayer Section */}
        <div className="prayer-section">
          <div className="glass-card prayer-duration-card">
            <div className="prayer-duration-header">
              <span className="prayer-duration-label">Prayer length</span>
              <span className="prayer-duration-value">{state.sessionDuration} min</span>
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

            <div className="prayer-card-info">
              <span>{totalCards} total cards</span>
              <span>
                {availableUserCards >= userCardsNeeded
                  ? `${userCardsNeeded} of your cards`
                  : `${availableUserCards}/${userCardsNeeded} cards available`}
              </span>
            </div>

            <button className="prayer-start-btn" onClick={startSession}>
              Start Prayer
            </button>
          </div>
        </div>

        {/* My Cards Section */}
        <div className="prayer-section">
          <div className="glass-card prayer-section-row">
            <span className="prayer-section-label">
              My Cards <span className="count">({state.activeCards.length})</span>
            </span>
            <button className="prayer-compact-btn" onClick={() => navigateTo('my-cards')}>
              Manage →
            </button>
          </div>
        </div>

        {/* No Cards Hint */}
        {state.activeCards.length === 0 && (
          <p className="no-cards-hint">
            Add prayer cards to personalize your session.{' '}
            <button
              className="text-link"
              onClick={() => navigateTo('my-cards')}
            >
              Add your first card →
            </button>
          </p>
        )}

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
          <div className="prayer-streak-display">
            <span className="streak-flame">🔥</span>
            <span className="streak-count">
              {state.streak.current}-day streak
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
