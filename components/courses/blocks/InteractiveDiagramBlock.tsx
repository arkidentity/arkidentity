'use client';

import type { ContentBlock } from '@/types/courses';

export function InteractiveDiagramBlock({ block }: { block: ContentBlock }) {
  return (
    <div className="diagram-block">
      <div className="diagram-placeholder">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
        <p>Interactive diagram</p>
        {block.id && <span className="diagram-id">{block.id}</span>}
      </div>

      <style jsx>{`
        .diagram-block {
          margin: 20px 0;
        }
        .diagram-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 24px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px dashed rgba(255, 255, 255, 0.15);
          border-radius: 8px;
          color: #5A6577;
        }
        .diagram-placeholder p {
          margin: 12px 0 0 0;
          font-size: 0.9rem;
        }
        .diagram-id {
          margin-top: 4px;
          font-size: 0.75rem;
          color: #3D4A5C;
        }
      `}</style>
    </div>
  );
}
