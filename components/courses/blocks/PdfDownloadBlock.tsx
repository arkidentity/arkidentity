'use client';

import type { ContentBlock } from '@/types/courses';

export function PdfDownloadBlock({ block }: { block: ContentBlock }) {
  return (
    <div className="pdf-download-block">
      {block.title && <h4 className="pdf-title">{block.title}</h4>}
      {block.description && <p className="pdf-description">{block.description}</p>}
      {block.filename && (
        <a
          href={`/courses/${block.filename}`}
          target="_blank"
          rel="noopener noreferrer"
          className="pdf-button"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          {block.buttonText || 'Download PDF'}
        </a>
      )}

      <style jsx>{`
        .pdf-download-block {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 20px 24px;
          margin: 20px 0;
        }
        .pdf-title {
          color: #FFFFFF;
          font-size: 1rem;
          font-weight: 600;
          margin: 0 0 8px 0;
        }
        .pdf-description {
          color: #A0AEC0;
          font-size: 0.9rem;
          line-height: 1.5;
          margin: 0 0 16px 0;
        }
        .pdf-button {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: #e8b562;
          color: #1A1A1A;
          border-radius: 6px;
          font-size: 0.9rem;
          font-weight: 600;
          text-decoration: none;
          transition: opacity 0.2s;
        }
        .pdf-button:hover {
          opacity: 0.9;
        }
      `}</style>
    </div>
  );
}
