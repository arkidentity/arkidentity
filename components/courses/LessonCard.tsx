'use client';

import { useState } from 'react';
import type { Lesson } from '@/types/courses';
import { ContentBlockRenderer } from './ContentBlockRenderer';
import { VideoEmbed } from './VideoEmbed';

interface LessonCardProps {
  lesson: Lesson;
  isCompleted: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onMarkComplete: () => void;
  isSaving: boolean;
}

export function LessonCard({
  lesson,
  isCompleted,
  isExpanded,
  onToggle,
  onMarkComplete,
  isSaving,
}: LessonCardProps) {
  return (
    <div className={`lesson-card ${isCompleted ? 'completed' : ''}`}>
      <button className="lesson-header" onClick={onToggle}>
        <div className="lesson-number">
          {isCompleted ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          ) : (
            <span>{lesson.id}</span>
          )}
        </div>
        <div className="lesson-info">
          <h4>{lesson.title}</h4>
          <span className="lesson-meta">
            {lesson.duration}
            {lesson.isBonus && <span className="bonus-badge">Bonus</span>}
          </span>
        </div>
        <div className="lesson-toggle">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>

      {isExpanded && (
        <div className="lesson-content">
          {/* Video */}
          <VideoEmbed videoId={lesson.videoId} title={lesson.title} />

          {/* Content Blocks */}
          {lesson.content.map((block, i) => (
            <ContentBlockRenderer key={i} block={block} />
          ))}

          {/* Mark Complete */}
          {!isCompleted && (
            <button
              className="btn-complete"
              onClick={onMarkComplete}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Mark as Complete'}
            </button>
          )}
        </div>
      )}

      <style jsx>{`
        .lesson-card {
          background: #242D3D;
          border-radius: 12px;
          overflow: hidden;
          border: 2px solid transparent;
          transition: border-color 0.2s;
        }
        .lesson-card.completed {
          border-color: #4A9E7F;
        }
        .lesson-header {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 20px;
          background: none;
          border: none;
          cursor: pointer;
          text-align: left;
          color: #FFFFFF;
        }
        .lesson-number {
          width: 40px;
          height: 40px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          font-weight: 700;
          background: #1A2332;
          color: var(--course-accent, #D4A853);
          border: 1px solid var(--course-accent, #D4A853);
          flex-shrink: 0;
        }
        .lesson-card.completed .lesson-number {
          background: #2E7D5E;
          color: #FFFFFF;
          border: none;
        }
        .lesson-info {
          flex: 1;
          min-width: 0;
        }
        .lesson-info h4 {
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 4px 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .lesson-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #5A6577;
        }
        .bonus-badge {
          display: inline-block;
          padding: 1px 8px;
          background: rgba(232, 181, 98, 0.15);
          color: var(--course-accent, #D4A853);
          border-radius: 10px;
          font-size: 11px;
          font-weight: 600;
        }
        .lesson-toggle {
          color: #5A6577;
          flex-shrink: 0;
        }
        .lesson-content {
          padding: 0 24px 24px 24px;
          border-top: 1px solid #3D4A5C;
        }
        .btn-complete {
          display: block;
          width: 100%;
          padding: 14px 20px;
          margin-top: 24px;
          background: var(--course-accent, #D4A853);
          color: #1A1A1A;
          border: none;
          border-radius: 8px;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        .btn-complete:hover:not(:disabled) {
          opacity: 0.9;
        }
        .btn-complete:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
