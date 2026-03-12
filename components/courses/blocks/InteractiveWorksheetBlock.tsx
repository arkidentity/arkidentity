'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ContentBlock } from '@/types/courses';
import { COURSE_STORAGE_KEYS } from '@/types/courses';

export function InteractiveWorksheetBlock({ block }: { block: ContentBlock }) {
  const [values, setValues] = useState<Record<string, string>>({});

  const worksheetId = block.id || 'unknown-worksheet';

  // Load saved values
  useEffect(() => {
    try {
      const saved = localStorage.getItem(COURSE_STORAGE_KEYS.WORKSHEETS);
      if (saved) {
        const entries = JSON.parse(saved) as Record<string, Record<string, string>>;
        if (entries[worksheetId]) {
          setValues(entries[worksheetId]);
        }
      }
    } catch { /* ignore */ }
  }, [worksheetId]);

  const save = useCallback((newValues: Record<string, string>) => {
    try {
      const saved = localStorage.getItem(COURSE_STORAGE_KEYS.WORKSHEETS);
      const entries = saved ? JSON.parse(saved) as Record<string, Record<string, string>> : {};
      entries[worksheetId] = newValues;
      localStorage.setItem(COURSE_STORAGE_KEYS.WORKSHEETS, JSON.stringify(entries));
    } catch { /* ignore */ }
  }, [worksheetId]);

  const handleChange = (columnId: string, text: string) => {
    const newValues = { ...values, [columnId]: text };
    setValues(newValues);
    save(newValues);
  };

  if (!block.columns || block.columns.length === 0) return null;

  return (
    <div className="worksheet-block">
      {block.title && <h4 className="worksheet-title">{block.title}</h4>}
      {block.instruction && <p className="worksheet-instruction">{block.instruction}</p>}

      <div className="worksheet-columns">
        {block.columns.map((col) => (
          <div key={col.id} className="worksheet-column">
            <label>{col.label}</label>
            <textarea
              value={values[col.id] || ''}
              onChange={(e) => handleChange(col.id, e.target.value)}
              placeholder={col.placeholder}
              rows={4}
            />
          </div>
        ))}
      </div>

      <style jsx>{`
        .worksheet-block {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 20px 24px;
          margin: 20px 0;
        }
        .worksheet-title {
          color: #e8b562;
          font-size: 1rem;
          font-weight: 600;
          margin: 0 0 8px 0;
        }
        .worksheet-instruction {
          color: #A0AEC0;
          font-size: 0.9rem;
          line-height: 1.5;
          margin: 0 0 16px 0;
        }
        .worksheet-columns {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        @media (min-width: 640px) {
          .worksheet-columns {
            flex-direction: row;
          }
        }
        .worksheet-column {
          flex: 1;
        }
        label {
          display: block;
          color: #E2E8F0;
          font-size: 0.85rem;
          font-weight: 600;
          margin-bottom: 6px;
        }
        textarea {
          width: 100%;
          padding: 10px 14px;
          border-radius: 6px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          background: rgba(255, 255, 255, 0.06);
          color: #E2E8F0;
          font-size: 0.9rem;
          line-height: 1.5;
          resize: vertical;
          font-family: inherit;
        }
        textarea:focus {
          outline: none;
          border-color: #e8b562;
          box-shadow: 0 0 0 2px rgba(212, 168, 83, 0.2);
        }
        textarea::placeholder {
          color: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </div>
  );
}
