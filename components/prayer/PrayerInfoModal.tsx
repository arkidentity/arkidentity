'use client';

import { usePrayer } from './PrayerContext';
import { prayerInfo } from '@/lib/prayerData';

export function PrayerInfoModal() {
  const { state, hideInfo } = usePrayer();

  if (!state.showInfoModal) return null;

  return (
    <div className="prayer-modal-overlay" onClick={hideInfo}>
      <div
        className="prayer-modal prayer-info-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="prayer-info-header">
          <h2>What is 4D Prayer?</h2>
          <button className="prayer-info-close" onClick={hideInfo}>
            ×
          </button>
        </div>

        <div className="prayer-info-content">
          <p className="prayer-info-intro">
            <strong>4D Prayer</strong> is a structured approach to meeting with God,
            guiding you through four dimensions of prayer for a deeper, more
            meaningful experience.
          </p>

          {prayerInfo.dimensions.map((dim, index) => (
            <div key={dim.name} className="prayer-info-dimension">
              <div className="prayer-info-dim-header">
                <div className={`prayer-info-badge ${dim.name.toLowerCase()}`}>
                  {index + 1}
                </div>
                <div>
                  <h3>{dim.name}</h3>
                  <p className="dim-tagline">{dim.tagline}</p>
                </div>
              </div>
              <p className="dim-description">{dim.description}</p>
            </div>
          ))}
        </div>

        <div className="modal-actions">
          <button className="modal-btn save" onClick={hideInfo}>
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}
