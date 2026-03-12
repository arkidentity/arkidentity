'use client';

import { useState } from 'react';
import type { VocabularyTerm } from '@/types/courses';

interface VocabularyDrawerProps {
  terms: VocabularyTerm[];
}

export function VocabularyDrawer({ terms }: VocabularyDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedTerm, setExpandedTerm] = useState<string | null>(null);

  if (terms.length === 0) return null;

  return (
    <div className="vocabulary-drawer">
      <button
        className={`drawer-toggle ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="toggle-left">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
          <span>Vocabulary</span>
          <span className="term-count">{terms.length} terms</span>
        </div>
        <svg
          className="chevron"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {isOpen && (
        <div className="drawer-content">
          {terms.map((term) => {
            const isExpanded = expandedTerm === term.term;
            return (
              <button
                key={term.term}
                className={`term-item ${isExpanded ? 'expanded' : ''}`}
                onClick={() => setExpandedTerm(isExpanded ? null : term.term)}
              >
                <div className="term-header">
                  <span className="term-word">{term.term}</span>
                  <svg
                    className="term-chevron"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </div>
                {isExpanded && (
                  <p className="term-definition">{term.definition}</p>
                )}
              </button>
            );
          })}
        </div>
      )}

      <style jsx>{`
        .vocabulary-drawer {
          margin-bottom: 32px;
          border-radius: 14px;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .drawer-toggle {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border: none;
          background: none;
          cursor: pointer;
          color: #FFFFFF;
        }
        .toggle-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .toggle-left span:first-of-type {
          font-size: 15px;
          font-weight: 600;
        }
        .term-count {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.4);
          font-weight: 400;
        }
        .chevron {
          transition: transform 0.2s ease;
        }
        .drawer-toggle.open .chevron {
          transform: rotate(180deg);
        }
        .drawer-content {
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          max-height: 400px;
          overflow-y: auto;
        }
        .term-item {
          width: 100%;
          display: block;
          padding: 12px 20px;
          border: none;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
          background: none;
          cursor: pointer;
          text-align: left;
          color: #FFFFFF;
          transition: background 0.15s;
        }
        .term-item:hover {
          background: rgba(255, 255, 255, 0.03);
        }
        .term-item:last-child {
          border-bottom: none;
        }
        .term-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .term-word {
          font-size: 14px;
          font-weight: 600;
          color: #e8b562;
        }
        .term-chevron {
          color: rgba(255, 255, 255, 0.3);
          transition: transform 0.2s;
          flex-shrink: 0;
        }
        .term-item.expanded .term-chevron {
          transform: rotate(180deg);
        }
        .term-definition {
          font-size: 13px;
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.6);
          margin: 10px 0 0 0;
          padding-right: 20px;
        }
      `}</style>
    </div>
  );
}
