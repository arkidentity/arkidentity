'use client';

import { usePrayer } from './PrayerContext';
import { MusicBar } from './MusicBar';
import { getActivationById } from '@/lib/guidedActivations';

export function ActivationDetail() {
  const { state, navigateTo, startActivation, exitPrayer } = usePrayer();

  const activation = state.activeActivationId
    ? getActivationById(state.activeActivationId)
    : null;

  if (!activation) {
    return null;
  }

  const formatDuration = (minutes: number) => `${minutes} min`;

  return (
    <>
      <MusicBar showThemeSelector={true} />

      <div className="prayer-dashboard">
        {/* Header */}
        <div className="prayer-welcome-header">
          <button
            className="activation-back-btn"
            onClick={() => navigateTo('dashboard')}
            aria-label="Back to dashboard"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Back
          </button>
        </div>

        {/* Activation Hero */}
        <div className="activation-detail-hero">
          <div className="activation-week-badge large">Week {activation.week}</div>
          <h1 className="activation-detail-title">{activation.title}</h1>
          <p className="activation-detail-subtitle">{activation.subtitle}</p>
        </div>

        {/* Info Card */}
        <div className="glass-card activation-detail-card">
          <div className="activation-detail-meta">
            <div className="activation-meta-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
              <span>{formatDuration(activation.durationMinutes)}</span>
            </div>
            <div className="activation-meta-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
              <span>Journal recommended</span>
            </div>
          </div>

          <p className="activation-detail-description">{activation.description}</p>

          <div className="activation-detail-steps">
            {activation.subtitle.split(' · ').map((step, i) => (
              <div key={i} className="activation-step-pill">
                <span className="activation-step-num">{i + 1}</span>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tip */}
        <p className="activation-detail-tip">
          💡 Find a quiet place, grab your journal and a pen, and take your time with each card.
        </p>

        {/* Begin Button */}
        <div className="activation-detail-actions">
          <button
            className="prayer-start-btn"
            onClick={() => startActivation(activation)}
          >
            Begin Activation
          </button>
        </div>

        {/* Footer */}
        <div className="prayer-footer">
          <div />
          <button className="prayer-exit-btn" onClick={exitPrayer}>
            ← Exit
          </button>
        </div>
      </div>
    </>
  );
}
