'use client';

import type { ContentBlock } from '@/types/courses';

export function MissionBlock({ block }: { block: ContentBlock }) {
  if (!block.prompt && !block.action) return null;

  return (
    <div className="mission-block">
      <span className="block-label">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
        Mission
      </span>
      {block.prompt && <p className="prompt">{block.prompt}</p>}
      {block.action && <p className="action">{block.action}</p>}

      <style jsx>{`
        .mission-block {
          background: rgba(232, 181, 98, 0.08);
          border: 1px solid rgba(232, 181, 98, 0.25);
          border-left: 3px solid var(--course-accent, #D4A853);
          border-radius: 8px;
          padding: 20px 24px;
          margin: 20px 0;
        }
        .block-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--course-accent, #D4A853);
          margin-bottom: 10px;
        }
        .prompt {
          color: #E2E8F0;
          font-size: 0.95rem;
          line-height: 1.6;
          margin: 0 0 12px 0;
        }
        .action {
          color: #FFFFFF;
          font-size: 0.95rem;
          line-height: 1.6;
          font-weight: 600;
          margin: 0;
          padding-top: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </div>
  );
}
