'use client';

import type { ContentBlock } from '@/types/courses';

export function KeyDefinitionBlock({ block }: { block: ContentBlock }) {
  if (!block.text) return null;

  return (
    <div className="key-definition">
      <p dangerouslySetInnerHTML={{ __html: block.text }} />

      <style jsx>{`
        .key-definition {
          background: var(--course-dark, #1A2332);
          border-top: 2px solid var(--course-accent, #D4A853);
          border-bottom: 2px solid var(--course-accent, #D4A853);
          border-radius: 4px;
          padding: 18px 20px;
          margin: 24px 0;
        }
        .key-definition p {
          color: var(--course-accent, #D4A853);
          font-weight: 600;
          font-size: 1.05rem;
          line-height: 1.55;
          margin: 0;
        }
      `}</style>
    </div>
  );
}
