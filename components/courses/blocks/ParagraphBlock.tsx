'use client';

import type { ContentBlock } from '@/types/courses';

export function ParagraphBlock({ block }: { block: ContentBlock }) {
  if (!block.text) return null;

  return (
    <>
      <p
        className="content-paragraph"
        dangerouslySetInnerHTML={{ __html: block.text }}
      />
      <style jsx>{`
        .content-paragraph {
          font-size: 15px;
          line-height: 1.7;
          color: #E2E8F0;
          margin: 20px 0;
        }
        .content-paragraph :global(strong) {
          color: #FFFFFF;
          font-weight: 600;
        }
        .content-paragraph :global(em) {
          color: #E2E8F0;
        }
      `}</style>
    </>
  );
}
