'use client';

import type { ContentBlock } from '@/types/courses';

export function SectionHeaderBlock({ block }: { block: ContentBlock }) {
  if (!block.title) return null;

  return (
    <>
      <h4 className="section-header">{block.title}</h4>
      <style jsx>{`
        .section-header {
          font-size: 16px;
          font-weight: 600;
          color: var(--course-accent, #D4A853);
          margin: 24px 0 12px 0;
          padding-bottom: 8px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </>
  );
}
