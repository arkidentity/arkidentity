'use client';

import type { ContentBlock } from '@/types/courses';

export function ScriptureBlock({ block }: { block: ContentBlock }) {
  return (
    <div className="scripture-block">
      <p className="scripture-text">&ldquo;{block.text}&rdquo;</p>
      {block.ref && <cite className="scripture-ref">&mdash; {block.ref}</cite>}

      <style jsx>{`
        .scripture-block {
          background: #F5F0E8;
          border-left: 3px solid var(--course-accent, #D4A853);
          border-radius: 6px;
          padding: 16px 20px;
          margin: 20px 0;
        }
        .scripture-block + .scripture-block {
          margin-top: 8px;
        }
        .scripture-text {
          color: #0D0D0D;
          font-style: italic;
          font-size: 0.95rem;
          line-height: 1.65;
          margin: 0 0 8px 0;
        }
        .scripture-ref {
          color: var(--course-accent, #D4A853);
          font-weight: 700;
          font-size: 0.8rem;
          letter-spacing: 0.03em;
          font-style: normal;
        }
      `}</style>
    </div>
  );
}
