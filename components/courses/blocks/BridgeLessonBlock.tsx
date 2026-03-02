'use client';

import Link from 'next/link';
import type { ContentBlock } from '@/types/courses';

export function BridgeLessonBlock({ block }: { block: ContentBlock }) {
  return (
    <div className="bridge-lesson-block">
      {block.headline && <span className="bridge-headline">{block.headline}</span>}
      {block.title && <h4 className="bridge-title">{block.title}</h4>}
      {block.subtitle && <p className="bridge-subtitle">{block.subtitle}</p>}
      {block.description && <p className="bridge-description">{block.description}</p>}

      <div className="bridge-actions">
        {block.ctaPrimary && (
          <Link href={`/courses/${block.ctaPrimary.course}`} className="cta-primary">
            {block.ctaPrimary.text}
          </Link>
        )}
        {block.ctaSecondary && (
          <button className="cta-secondary" type="button">
            {block.ctaSecondary.text}
          </button>
        )}
      </div>

      <style jsx>{`
        .bridge-lesson-block {
          background: linear-gradient(135deg, var(--course-primary, #143348), var(--course-secondary, #1a4a6e));
          border-radius: 12px;
          padding: 24px;
          margin: 20px 0;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .bridge-headline {
          display: block;
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--course-accent, #D4A853);
          margin-bottom: 8px;
        }
        .bridge-title {
          color: #FFFFFF;
          font-size: 1.2rem;
          font-weight: 700;
          margin: 0 0 4px 0;
        }
        .bridge-subtitle {
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.9rem;
          margin: 0 0 12px 0;
        }
        .bridge-description {
          color: rgba(255, 255, 255, 0.8);
          font-size: 0.9rem;
          line-height: 1.5;
          margin: 0 0 16px 0;
        }
        .bridge-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        .bridge-actions :global(.cta-primary) {
          display: inline-flex;
          padding: 10px 20px;
          background: var(--course-accent, #D4A853);
          color: #1A1A1A;
          border-radius: 6px;
          font-size: 0.85rem;
          font-weight: 600;
          text-decoration: none;
          transition: opacity 0.2s;
        }
        .bridge-actions :global(.cta-primary):hover {
          opacity: 0.9;
        }
        .cta-secondary {
          padding: 10px 20px;
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: #FFFFFF;
          border-radius: 6px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }
        .cta-secondary:hover {
          background: rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </div>
  );
}
