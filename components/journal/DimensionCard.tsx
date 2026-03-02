'use client';

/**
 * DimensionCard - Accordion card for HEAD/HEART/HANDS
 * Unified card color with ScriptureHero. No left border accent.
 * Active state: filled badge circle. Textarea punches back to app background color.
 */

import { useRef } from 'react';
import type { DimensionCardProps, DimensionType } from '@/types/journal';

// Shared card background — just barely lighter than the page background
const CARD_BG = 'color-mix(in srgb, var(--primary-color) 88%, white 12%)';

const DIMENSION_CONFIG: Record<DimensionType, {
  badge: string;
  title: string;
  label: string;
  subtitle: string;
  placeholder: string;
}> = {
  head: {
    badge: '1D',
    title: 'Head',
    label: 'Information',
    subtitle: 'What is this passage saying?',
    placeholder: 'What is happening in this passage? Who is it written to, and what is the main point?',
  },
  heart: {
    badge: '2D',
    title: 'Heart',
    label: 'Transformation',
    subtitle: 'God, what are You saying to me?',
    placeholder: 'God, what are You saying to me through this scripture? Where is Your Spirit convicting or encouraging me?',
  },
  hands: {
    badge: '3D',
    title: 'Hands',
    label: 'Activation',
    subtitle: 'God, what action should I take?',
    placeholder: 'God, what are You asking me to do? Be specific—who, what, when?',
  },
};

function truncateText(text: string, maxLength: number = 50): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

export function DimensionCard({
  dimension,
  content,
  expanded,
  preview,
  placeholder,
  onChange,
  onToggle,
  onNext,
  onSave,
  isLastDimension = false,
  isSaving = false,
  isEditing = false,
}: DimensionCardProps) {
  const config = DIMENSION_CONFIG[dimension];
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const hasContent = content && content.trim().length > 0;
  const displayPreview = hasContent ? truncateText(content, 50) : null;

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-300"
      style={{
        background: `radial-gradient(ellipse at 110% 110%, color-mix(in srgb, var(--accent-color) 12%, transparent) 0%, transparent 60%), ${CARD_BG}`,
        borderTop: '1px solid color-mix(in srgb, var(--accent-color) 35%, transparent)',
        borderLeft: '1px solid color-mix(in srgb, var(--accent-color) 35%, transparent)',
      }}
    >
      {/* Header — always visible, clickable to toggle */}
      <button
        type="button"
        onClick={onToggle}
        className="
          w-full p-4 flex items-center gap-3 text-left
          border-b border-white/[.08]
          hover:bg-white/[.05] transition-colors
        "
      >
        {/* Circle badge: outlined when inactive, filled when active */}
        <div
          className="w-10 h-10 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-300"
          style={
            expanded
              ? { backgroundColor: 'var(--accent-color)', borderColor: 'var(--accent-color)' }
              : { backgroundColor: 'transparent', borderColor: 'var(--accent-color)' }
          }
        >
          <span
            className="font-bold text-sm leading-none"
            style={{
              color: expanded
                ? 'color-mix(in srgb, var(--primary-color) 85%, black 15%)'
                : 'var(--accent-color)',
            }}
          >
            {config.badge}
          </span>
        </div>

        {/* Title and subtitle / preview */}
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-bold text-base leading-tight">
            {config.title}:{' '}
            <span className="font-semibold">{config.label}</span>
          </h3>
          <p className="text-sm truncate text-white/50 mt-0.5">
            {displayPreview ?? config.subtitle}
          </p>
        </div>

        {/* Chevron */}
        <svg
          className={`
            w-5 h-5 text-white/40 shrink-0
            transition-transform duration-300
            ${expanded ? 'rotate-180' : ''}
          `}
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M5 7.5l5 5 5-5" />
        </svg>
      </button>

      {/* Body — collapsible */}
      <div
        className={`
          overflow-hidden transition-all duration-300
          ${expanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}
        `}
      >
        {/* Textarea — dark background (app background color) stands out against lighter card */}
        <div className="px-4 pt-4 pb-0">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => onChange(e.target.value)}
            placeholder={config.placeholder}
            className="
              w-full min-h-[150px] p-4 rounded-lg
              border border-white/15
              text-white/90 placeholder-white/55
              resize-none focus:outline-none focus:border-white/30
              focus:ring-2 focus:ring-white/[.07]
              transition-all
            "
            style={{ backgroundColor: 'color-mix(in srgb, var(--primary-color) 10%, black 90%)' }}
          />
        </div>

        {/* Bottom row: Next / Save — corner pill flush to bottom-right */}
        <div className="flex justify-end mt-3">
          {isLastDimension ? (
            <button
              type="button"
              onClick={onSave}
              disabled={isSaving}
              className="
                inline-flex items-center gap-1.5
                px-4 py-2 rounded-tl-xl
                font-semibold text-sm
                hover:opacity-90 transition-opacity
                disabled:opacity-50 disabled:cursor-not-allowed
              "
              style={{
                backgroundColor: 'var(--accent-color)',
                color: 'color-mix(in srgb, var(--primary-color) 85%, black 15%)',
              }}
            >
              {isSaving ? 'Saving...' : (isEditing ? 'Update Entry' : 'Save Entry')}
            </button>
          ) : (
            <button
              type="button"
              onClick={onNext}
              className="
                inline-flex items-center gap-1.5
                px-4 py-2 rounded-tl-xl
                font-semibold text-sm
                hover:opacity-90 transition-opacity
              "
              style={{
                backgroundColor: 'var(--accent-color)',
                color: 'color-mix(in srgb, var(--primary-color) 85%, black 15%)',
              }}
            >
              Next: {dimension === 'head' ? 'Heart' : 'Hands'}
              <svg
                className="w-4 h-4"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M6 3l5 5-5 5" />
              </svg>
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
