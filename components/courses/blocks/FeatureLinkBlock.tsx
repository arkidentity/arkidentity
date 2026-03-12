'use client';

import Link from 'next/link';
import type { ContentBlock } from '@/types/courses';

export function FeatureLinkBlock({ block }: { block: ContentBlock }) {
  const isInternal = block.linkType === 'internal';
  const href = block.linkTarget || '#';

  const content = (
    <div className="feature-link-block">
      {block.title && <h4 className="feature-title">{block.title}</h4>}
      {block.description && <p className="feature-description">{block.description}</p>}
      <span className="feature-button">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
        {block.buttonText || 'Go'}
      </span>

      <style jsx>{`
        .feature-link-block {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-left: 3px solid #1a2b3c;
          border-radius: 8px;
          padding: 20px 24px;
          margin: 20px 0;
          cursor: pointer;
          transition: background 0.2s;
        }
        .feature-link-block:hover {
          background: rgba(255, 255, 255, 0.07);
        }
        .feature-title {
          color: #FFFFFF;
          font-size: 1rem;
          font-weight: 600;
          margin: 0 0 6px 0;
        }
        .feature-description {
          color: #A0AEC0;
          font-size: 0.9rem;
          line-height: 1.5;
          margin: 0 0 12px 0;
        }
        .feature-button {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #e8b562;
          font-size: 0.85rem;
          font-weight: 600;
        }
      `}</style>
    </div>
  );

  if (isInternal) {
    return <Link href={href}>{content}</Link>;
  }

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
      {content}
    </a>
  );
}
