'use client';

import { useState } from 'react';
import type { ContentBlock } from '@/types/courses';

export function RevealTableBlock({ block }: { block: ContentBlock }) {
  const [revealedCells, setRevealedCells] = useState<Set<string>>(new Set());

  if (!block.headers || !block.rows) return null;

  const toggleCell = (key: string) => {
    setRevealedCells((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  return (
    <div className="reveal-table-block">
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              {block.headers.map((header, i) => (
                <th key={i}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row, ri) => (
              <tr key={ri}>
                {row.map((cell, ci) => {
                  const key = `${ri}-${ci}`;
                  const isRevealed = ci === 0 || revealedCells.has(key);
                  return (
                    <td
                      key={ci}
                      className={ci > 0 ? (isRevealed ? 'revealed' : 'hidden-cell') : ''}
                      onClick={() => ci > 0 && toggleCell(key)}
                    >
                      {isRevealed ? cell : 'Tap to reveal'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style jsx>{`
        .reveal-table-block {
          margin: 20px 0;
          overflow-x: auto;
        }
        .table-wrapper {
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th {
          background: var(--course-dark, #1A2332);
          color: var(--course-accent, #D4A853);
          padding: 12px 16px;
          text-align: left;
          font-size: 0.8rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 2px solid var(--course-accent, #D4A853);
        }
        td {
          padding: 12px 16px;
          font-size: 0.9rem;
          line-height: 1.5;
          color: #E2E8F0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          background: rgba(255, 255, 255, 0.02);
        }
        td.hidden-cell {
          color: rgba(255, 255, 255, 0.3);
          cursor: pointer;
          text-align: center;
          font-style: italic;
          font-size: 0.8rem;
          background: rgba(255, 255, 255, 0.04);
          user-select: none;
        }
        td.hidden-cell:hover {
          background: rgba(255, 255, 255, 0.08);
          color: rgba(255, 255, 255, 0.5);
        }
        td.revealed {
          cursor: pointer;
        }
        tr:last-child td {
          border-bottom: none;
        }
      `}</style>
    </div>
  );
}
