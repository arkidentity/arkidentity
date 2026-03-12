'use client';

import type { ContentBlock } from '@/types/courses';

export function KeyDefinitionBlock({ block }: { block: ContentBlock }) {
  if (!block.text) return null;

  return (
    <div className="key-definition">
      <p dangerouslySetInnerHTML={{ __html: block.text }} />

      <style jsx>{`
        .key-definition {
          background: #1a2b3c;
          border-top: 2px solid #e8b562;
          border-bottom: 2px solid #e8b562;
          border-radius: 4px;
          padding: 18px 20px;
          margin: 24px 0;
        }
        .key-definition p {
          color: #e8b562;
          font-weight: 600;
          font-size: 1.05rem;
          line-height: 1.55;
          margin: 0;
        }
      `}</style>
    </div>
  );
}
