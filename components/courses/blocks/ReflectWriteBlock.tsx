'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ContentBlock } from '@/types/courses';
import { COURSE_STORAGE_KEYS } from '@/types/courses';

export function ReflectWriteBlock({ block }: { block: ContentBlock }) {
  const [value, setValue] = useState('');

  const storageKey = block.id || 'unknown';

  // Load saved value
  useEffect(() => {
    try {
      const saved = localStorage.getItem(COURSE_STORAGE_KEYS.REFLECT_WRITE);
      if (saved) {
        const entries = JSON.parse(saved) as Record<string, string>;
        if (entries[storageKey]) {
          setValue(entries[storageKey]);
        }
      }
    } catch { /* ignore */ }
  }, [storageKey]);

  // Auto-save on change
  const save = useCallback((text: string) => {
    try {
      const saved = localStorage.getItem(COURSE_STORAGE_KEYS.REFLECT_WRITE);
      const entries = saved ? JSON.parse(saved) as Record<string, string> : {};
      entries[storageKey] = text;
      localStorage.setItem(COURSE_STORAGE_KEYS.REFLECT_WRITE, JSON.stringify(entries));
    } catch { /* ignore */ }
  }, [storageKey]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setValue(text);
    save(text);
  };

  return (
    <div className="reflect-write-block">
      <span className="block-label">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
        Reflect &amp; Write
      </span>
      {block.prompt && <p className="prompt">{block.prompt}</p>}
      <textarea
        className="reflect-textarea"
        value={value}
        onChange={handleChange}
        placeholder="Write your thoughts here..."
        rows={4}
      />

      <style jsx>{`
        .reflect-write-block {
          background: #EDE8DE;
          border-radius: 8px;
          padding: 20px 24px;
          margin: 20px 0;
        }
        .block-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #5A4A2F;
          margin-bottom: 10px;
        }
        .prompt {
          color: #2D2013;
          font-size: 0.95rem;
          line-height: 1.6;
          margin: 0 0 12px 0;
        }
        .reflect-textarea {
          width: 100%;
          padding: 12px 16px;
          border-radius: 6px;
          border: 1px solid rgba(0, 0, 0, 0.15);
          background: rgba(255, 255, 255, 0.7);
          color: #1A1A1A;
          font-size: 0.95rem;
          line-height: 1.5;
          resize: vertical;
          font-family: inherit;
        }
        .reflect-textarea:focus {
          outline: none;
          border-color: #e8b562;
          box-shadow: 0 0 0 2px rgba(212, 168, 83, 0.2);
        }
        .reflect-textarea::placeholder {
          color: #8A7A5A;
        }
      `}</style>
    </div>
  );
}
