'use client';

import type { ContentBlock } from '@/types/courses';

export function DiscussionBlock({ block }: { block: ContentBlock }) {
  if (!block.questions || block.questions.length === 0) return null;

  return (
    <div className="discussion-block">
      <span className="block-label">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        Discussion
      </span>
      <ul>
        {block.questions.map((q, i) => (
          <li key={i}>{q}</li>
        ))}
      </ul>

      <style jsx>{`
        .discussion-block {
          background: #2E7D5E;
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
        ul {
          margin: 0;
          padding-left: 20px;
          color: #FFFFFF;
        }
        li {
          margin-bottom: 8px;
          font-size: 1rem;
          line-height: 1.6;
        }
        li:last-child {
          margin-bottom: 0;
        }
      `}</style>
    </div>
  );
}
