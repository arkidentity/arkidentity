'use client';

/**
 * ScriptureHero - Scripture display card at top of journal form
 * Unified card color with the dimension cards. No border, no title pill.
 * Passage text sits directly on the card. Bottom row: tap hint + plain What's 3D? link.
 */

import type { ScriptureHeroProps } from '@/types/journal';
import { getVersionName } from '@/lib/bibleData';

// Shared card background — just barely lighter than the page background
const CARD_BG = 'color-mix(in srgb, var(--primary-color) 88%, white 12%)';

export function ScriptureHero({
  reference,
  passage,
  version,
  isEditing,
  onChangeClick,
  onPassageTap,
}: ScriptureHeroProps) {
  const versionName = getVersionName(version);
  const hasReference = reference && reference.trim().length > 0;
  const hasPassage = passage && passage.trim().length > 0;

  return (
    <div
      className="rounded-2xl overflow-hidden mb-6"
      style={{
        background: `radial-gradient(ellipse at 110% 110%, color-mix(in srgb, var(--accent-color) 12%, transparent) 0%, transparent 60%), ${CARD_BG}`,
        borderTop: '1px solid color-mix(in srgb, var(--accent-color) 35%, transparent)',
        borderLeft: '1px solid color-mix(in srgb, var(--accent-color) 35%, transparent)',
      }}
    >
      {/* Scripture address button — full-width top row */}
      <button
        type="button"
        onClick={onChangeClick}
        className="
          w-full flex items-center gap-2
          px-4 py-3
          border-b border-white/[.08]
          hover:bg-white/[.05] transition-colors text-left
        "
      >
        <span className={`text-sm font-semibold flex-1 ${hasReference ? 'text-white' : 'text-white/40'}`}>
          {hasReference ? reference : 'Select a passage...'}
        </span>
        <span className="flex items-center gap-1.5 shrink-0">
          <span className="text-sm font-medium text-white/55">Change Verses</span>
          <svg
            className="w-5 h-5"
            style={{ color: 'var(--accent-color)' }}
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M5 7.5l5 5 5-5" />
          </svg>
        </span>
      </button>

      {/* Passage text — sits directly on card, scrollable */}
      <div
        onClick={hasPassage ? onPassageTap : undefined}
        className={`
          px-4 pt-4 max-h-[260px] min-h-[110px] overflow-y-auto
          ${hasPassage ? 'cursor-pointer' : ''}
        `}
      >
        {hasPassage ? (
          <div
            className="text-white/90 text-[15px] leading-relaxed passage-content"
            dangerouslySetInnerHTML={{ __html: passage }}
          />
        ) : (
          <p className="text-white/40 text-sm italic">
            Scripture passage will appear here...
          </p>
        )}
      </div>

      {/* Bottom row: Read full passage — centered */}
      {hasPassage && (
        <div className="flex items-center justify-center px-4 pt-2 pb-3 mt-1">
          <p
            onClick={onPassageTap}
            className="text-[var(--accent-color)] text-sm cursor-pointer hover:opacity-80 transition-opacity"
          >
            Read full passage
          </p>
        </div>
      )}
    </div>
  );
}
