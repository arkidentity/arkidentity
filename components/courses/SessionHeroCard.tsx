'use client';

interface SessionHeroCardProps {
  sessionNumber: number;
  totalSessions: number;
  title: string;
  verse: string;
  verseRef: string;
  completedLessons: number;
  totalLessons: number;
}

export function SessionHeroCard({
  sessionNumber,
  totalSessions,
  title,
  verse,
  verseRef,
  completedLessons,
  totalLessons,
}: SessionHeroCardProps) {
  const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return (
    <div className="session-hero">
      <div className="session-badge">Session {sessionNumber} of {totalSessions}</div>
      <h1 className="session-title">{title}</h1>

      {/* Anchor Scripture */}
      <div className="session-verse">
        <blockquote>
          <p>&ldquo;{verse}&rdquo;</p>
          <cite>&mdash; {verseRef}</cite>
        </blockquote>
      </div>

      {/* Progress */}
      <div className="progress-section">
        <div className="progress-info">
          <span className="progress-label">Lesson Progress</span>
          <span className="progress-count">{completedLessons}/{totalLessons}</span>
        </div>
        <div className="progress-bar-container">
          <div className={`progress-bar ${progressPercent === 100 ? 'complete' : ''}`} style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      <style jsx>{`
        .session-hero {
          background: #1a2b3c;
          border: 1px solid rgba(232, 181, 98, 0.15);
          border-radius: 16px;
          padding: 28px 24px;
          margin-bottom: 24px;
        }
        .session-badge {
          display: inline-block;
          padding: 4px 12px;
          background: rgba(232, 181, 98, 0.12);
          color: #e8b562;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 12px;
        }
        .session-title {
          color: #FFFFFF;
          font-size: 28px;
          font-weight: 700;
          margin: 0 0 20px 0;
          line-height: 1.2;
        }
        .session-verse {
          border-left: 3px solid #e8b562;
          padding: 0 0 0 16px;
          margin-bottom: 24px;
        }
        .session-verse blockquote {
          margin: 0;
        }
        .session-verse p {
          font-size: 15px;
          line-height: 1.65;
          color: rgba(255, 255, 255, 0.85);
          font-style: italic;
          margin: 0 0 8px 0;
        }
        .session-verse cite {
          font-size: 13px;
          color: #e8b562;
          font-style: normal;
          font-weight: 600;
        }
        .progress-section {
          padding-top: 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }
        .progress-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        .progress-label {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.6);
        }
        .progress-count {
          font-size: 13px;
          color: #e8b562;
          font-weight: 600;
        }
        .progress-bar-container {
          height: 6px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
          overflow: hidden;
        }
        .progress-bar {
          height: 100%;
          background: #e8b562;
          border-radius: 3px;
          transition: width 0.3s ease, background-color 0.3s ease;
        }
        .progress-bar.complete {
          background: #2E7D5E;
        }
      `}</style>
    </div>
  );
}
