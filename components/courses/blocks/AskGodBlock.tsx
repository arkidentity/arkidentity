'use client';

import type { ContentBlock } from '@/types/courses';

export function AskGodBlock({ block }: { block: ContentBlock }) {
  if (!block.prompt) return null;

  return (
    <div className="askgod-block">
      <span className="block-label">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
        Ask God
      </span>
      <p className="prompt">{block.prompt}</p>

      <style jsx>{`
        .askgod-block {
          background: #1a2b3c;
          border-radius: 8px;
          padding: 20px 24px;
          margin: 20px 0;
          border-left: 3px solid #e8b562;
        }
        .block-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #e8b562;
          margin-bottom: 10px;
        }
        .prompt {
          color: #FFFFFF;
          font-size: 0.95rem;
          line-height: 1.6;
          margin: 0;
          font-style: italic;
        }
      `}</style>
    </div>
  );
}
