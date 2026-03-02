'use client';

import { usePrayer } from './PrayerContext';
import { MusicBar } from './MusicBar';
import { guidedActivations } from '@/lib/guidedActivations';

export function GuidedActivationsList() {
  const { navigateTo, startActivation } = usePrayer();

  return (
    <>
      <MusicBar showThemeSelector={false} />

      <div className="prayer-my-cards">
        {/* Header */}
        <div className="prayer-header">
          <button className="prayer-back-btn" onClick={() => navigateTo('dashboard')}>
            ← Back
          </button>
          <h1 className="prayer-page-title">Guided Activations</h1>
        </div>

        {/* Activation List */}
        <div className="cards-list">
          {guidedActivations.map((activation) => (
            <div key={activation.id} className="glass-card activation-list-card">
              <div className="activation-list-card-body">
                <div className="activation-list-meta">
                  <span className="activation-list-duration">{activation.durationMinutes} min</span>
                </div>
                <h3 className="activation-list-title">{activation.title}</h3>
                <p className="activation-list-desc">{activation.description}</p>
              </div>
              <button
                className="activation-list-begin-btn"
                onClick={() => startActivation(activation)}
              >
                Begin →
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
