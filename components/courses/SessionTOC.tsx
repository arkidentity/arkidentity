'use client';

import Link from 'next/link';

interface SessionTOCItem {
  id: number;
  title: string;
  synopsis?: string;
  lessonCount: number;
  completedLessonCount: number;
}

interface SessionTOCProps {
  courseId: string;
  sessions: SessionTOCItem[];
}

export function SessionTOC({ courseId, sessions }: SessionTOCProps) {
  return (
    <div className="session-toc">
      <h2 className="toc-heading">Sessions</h2>
      <div className="toc-list">
        {sessions.map((session) => {
          const isComplete = session.completedLessonCount >= session.lessonCount && session.lessonCount > 0;
          const hasStarted = session.completedLessonCount > 0;
          const percent = session.lessonCount > 0
            ? Math.round((session.completedLessonCount / session.lessonCount) * 100)
            : 0;

          return (
            <Link
              key={session.id}
              href={`/courses/${courseId}/${session.id}`}
              className="toc-card"
            >
              <div className="card-left">
                <div className={`session-number ${isComplete ? 'complete' : hasStarted ? 'in-progress' : ''}`}>
                  {isComplete ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    session.id
                  )}
                </div>
              </div>
              <div className="card-body">
                <h3 className="session-title">{session.title}</h3>
                {session.synopsis && (
                  <p className="session-synopsis">{session.synopsis}</p>
                )}
                <div className="session-meta">
                  <span className="lesson-count">{session.lessonCount} lessons</span>
                  {hasStarted && !isComplete && (
                    <span className="progress-indicator">{percent}%</span>
                  )}
                </div>
              </div>
              <div className="card-arrow">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </div>
            </Link>
          );
        })}
      </div>

      <style jsx>{`
        .session-toc {
          margin-bottom: 32px;
        }
        .toc-heading {
          font-size: 18px;
          font-weight: 600;
          color: #A0AEC0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin: 0 0 16px 0;
        }
        .toc-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .toc-list :global(.toc-card) {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding: 20px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          text-decoration: none;
          transition: background 0.2s, border-color 0.2s, transform 0.2s;
        }
        .toc-list :global(.toc-card):hover {
          background: rgba(255, 255, 255, 0.07);
          border-color: rgba(255, 255, 255, 0.15);
          transform: translateY(-1px);
        }
        .toc-list :global(.toc-card):active {
          transform: scale(0.99);
        }
        .card-left {
          flex-shrink: 0;
        }
        .session-number {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.5);
          background: rgba(255, 255, 255, 0.06);
          border: 2px solid rgba(255, 255, 255, 0.1);
        }
        .session-number.in-progress {
          color: #e8b562;
          border-color: #e8b562;
          background: rgba(232, 181, 98, 0.1);
        }
        .session-number.complete {
          color: #2E7D5E;
          border-color: #2E7D5E;
          background: rgba(46, 125, 94, 0.1);
        }
        .card-body {
          flex: 1;
          min-width: 0;
        }
        .session-title {
          font-size: 16px;
          font-weight: 600;
          color: #FFFFFF;
          margin: 0 0 6px 0;
          line-height: 1.3;
        }
        .session-synopsis {
          font-size: 13px;
          line-height: 1.5;
          color: rgba(255, 255, 255, 0.5);
          margin: 0 0 10px 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .session-meta {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .lesson-count {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.35);
        }
        .progress-indicator {
          font-size: 12px;
          font-weight: 600;
          color: #e8b562;
        }
        .card-arrow {
          flex-shrink: 0;
          color: rgba(255, 255, 255, 0.2);
          margin-top: 2px;
        }
      `}</style>
    </div>
  );
}
