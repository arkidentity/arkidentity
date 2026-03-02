'use client';

import type { ContentBlock } from '@/types/courses';

export function IntrospectiveBlock({ block }: { block: ContentBlock }) {
  if (!block.prompt) return null;

  return (
    <div className="introspective-block">
      <span className="block-label">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4M12 8h.01" />
        </svg>
        Reflect
      </span>
      <p className="prompt">{block.prompt}</p>

      <style jsx>{`
        .introspective-block {
          background: #EDE8DE;
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
          color: #5A4A2F;
          margin-bottom: 10px;
        }
        .prompt {
          color: #2D2013;
          font-size: 0.95rem;
          line-height: 1.6;
          margin: 0;
        }
      `}</style>
    </div>
  );
}
