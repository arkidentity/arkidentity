'use client';

import type { PreSessionContent as PreSessionContentType } from '@/types/courses';

interface PreSessionContentProps {
  content: PreSessionContentType;
}

export function PreSessionContent({ content }: PreSessionContentProps) {
  return (
    <div className="pre-session">
      {/* Opening Creed */}
      {content.openingCreed && (
        <div className="creed-section">
          <h3 className="section-label">Foundation</h3>
          <div className="creed-card">
            <h4 className="creed-title">{content.openingCreed.title}</h4>
            <p className="creed-description">{content.openingCreed.description}</p>
            <div className="creed-points">
              {content.openingCreed.points.map((point) => (
                <div key={point.label} className="creed-point">
                  <span className="point-label">{point.label}</span>
                  <span className="point-text">{point.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Essentials */}
      {content.essentials && (
        <div className="essentials-section">
          <h3 className="section-label">{content.essentials.subtitle}</h3>
          <p className="essentials-description">{content.essentials.description}</p>
          <div className="essentials-grid">
            {content.essentials.items.map((item) => (
              <div key={item.number} className="essential-card">
                <div className="essential-number">{item.number}</div>
                <div className="essential-body">
                  <h4 className="essential-title">{item.title}</h4>
                  <p className="essential-desc">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        .pre-session {
          margin-bottom: 32px;
        }
        .section-label {
          font-size: 18px;
          font-weight: 600;
          color: #A0AEC0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin: 0 0 16px 0;
        }

        /* Creed */
        .creed-card {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          padding: 24px;
          margin-bottom: 32px;
        }
        .creed-title {
          font-size: 18px;
          font-weight: 700;
          color: #e8b562;
          margin: 0 0 8px 0;
        }
        .creed-description {
          font-size: 14px;
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.6);
          margin: 0 0 20px 0;
        }
        .creed-points {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .creed-point {
          display: flex;
          align-items: baseline;
          gap: 12px;
          padding: 10px 14px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 10px;
          border-left: 3px solid #e8b562;
        }
        .point-label {
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          color: #e8b562;
          flex-shrink: 0;
          min-width: 85px;
        }
        .point-text {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.7);
          font-style: italic;
          line-height: 1.5;
        }

        /* Essentials */
        .essentials-section {
          margin-bottom: 8px;
        }
        .essentials-description {
          font-size: 14px;
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.55);
          margin: 0 0 20px 0;
        }
        .essentials-grid {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .essential-card {
          display: flex;
          gap: 16px;
          padding: 18px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 14px;
          transition: background 0.2s;
        }
        .essential-number {
          width: 32px;
          height: 32px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          background: #1a2b3c;
          color: #e8b562;
          font-size: 14px;
          font-weight: 700;
        }
        .essential-body {
          flex: 1;
          min-width: 0;
        }
        .essential-title {
          font-size: 14px;
          font-weight: 600;
          color: #FFFFFF;
          margin: 0 0 6px 0;
          line-height: 1.3;
        }
        .essential-desc {
          font-size: 13px;
          line-height: 1.55;
          color: rgba(255, 255, 255, 0.5);
          margin: 0;
        }
      `}</style>
    </div>
  );
}
