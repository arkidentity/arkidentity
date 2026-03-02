'use client';

import { useState } from 'react';
import type { SupportingScripture } from '@/types/courses';

interface SupportingScripturesProps {
  scriptures: SupportingScripture[];
}

export function SupportingScriptures({ scriptures }: SupportingScripturesProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!scriptures || scriptures.length === 0) return null;

  return (
    <div className="supporting-scriptures">
      <button className="toggle" onClick={() => setIsExpanded(!isExpanded)}>
        <span className="toggle-label">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </svg>
          Supporting Scriptures
          <span className="count">{scriptures.length}</span>
        </span>
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="chevron"
          style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)' }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isExpanded && (
        <div className="scriptures-list">
          {scriptures.map((s, i) => (
            <div key={i} className="scripture-item">
              <p className="scripture-text">&ldquo;{s.text}&rdquo;</p>
              <cite className="scripture-ref">&mdash; {s.ref}</cite>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .supporting-scriptures {
          margin-top: 32px;
          border-radius: 12px;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .toggle {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          background: none;
          border: none;
          cursor: pointer;
          color: #FFFFFF;
        }
        .toggle-label {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 0.9rem;
          font-weight: 600;
        }
        .count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 22px;
          height: 22px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 11px;
          font-size: 0.75rem;
          color: #A0AEC0;
        }
        .chevron {
          color: #5A6577;
          transition: transform 0.2s;
        }
        .scriptures-list {
          padding: 0 20px 20px 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .scripture-item {
          background: #F5F0E8;
          border-left: 3px solid var(--course-accent, #D4A853);
          border-radius: 6px;
          padding: 14px 18px;
        }
        .scripture-text {
          color: #0D0D0D;
          font-style: italic;
          font-size: 0.9rem;
          line-height: 1.6;
          margin: 0 0 6px 0;
        }
        .scripture-ref {
          color: var(--course-accent, #D4A853);
          font-weight: 700;
          font-size: 0.75rem;
          letter-spacing: 0.03em;
          font-style: normal;
        }
      `}</style>
    </div>
  );
}
