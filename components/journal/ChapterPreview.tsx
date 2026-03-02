'use client';

/**
 * ChapterPreview - Displays chapter verses with tap-to-select range
 * First tap selects start, second tap selects end, third tap resets
 */

import type { ParsedVerse } from '@/types/journal';

export interface ChapterPreviewProps {
  /** Book name */
  bookName: string;
  /** Chapter number */
  chapter: number;
  /** Parsed verses */
  verses: ParsedVerse[];
  /** Selected start verse */
  selectedStart: number | null;
  /** Selected end verse */
  selectedEnd: number | null;
  /** Loading state */
  loading: boolean;
  /** Error message */
  error: string | null;
  /** Check if verse is in selection */
  isVerseSelected: (verseNum: number) => boolean;
  /** Called when verse is clicked */
  onVerseClick: (verseNum: number) => void;
  /** Called to clear selection */
  onClearSelection: () => void;
  /** Selection label text */
  selectionLabel: string;
  /** Load button text */
  loadButtonText: string;
  /** Can load (has selection) */
  canLoad: boolean;
  /** Called to load passage */
  onLoadPassage: () => void;
  /** Called to go back */
  onBack: () => void;
}

export function ChapterPreview({
  bookName,
  chapter,
  verses,
  selectedStart,
  selectedEnd,
  loading,
  error,
  isVerseSelected,
  onVerseClick,
  onClearSelection,
  selectionLabel,
  loadButtonText,
  canLoad,
  onLoadPassage,
  onBack,
}: ChapterPreviewProps) {
  const hasSelection = selectedStart !== null;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-3 border-b border-white/10 shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="p-2 -ml-2 rounded-lg hover:bg-white/10 transition-colors"
        >
          <svg
            className="w-6 h-6 text-white"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-white font-semibold text-lg flex-1">
          {bookName} {chapter}
        </h2>
      </div>

      {/* Selection bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/10 shrink-0">
        <span className="text-white/70 text-sm">{selectionLabel}</span>
        {hasSelection && (
          <button
            type="button"
            onClick={onClearSelection}
            className="text-[var(--ark-gold)] text-sm font-medium hover:underline"
          >
            Clear
          </button>
        )}
      </div>

      {/* Verses list */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-white/60 animate-pulse">Loading chapter...</div>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <p className="text-red-300 text-sm">{error}</p>
            <button
              type="button"
              onClick={onBack}
              className="text-[var(--ark-gold)] text-sm font-medium hover:underline"
            >
              Go back
            </button>
          </div>
        )}

        {!loading && !error && verses.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <p className="text-white/50 text-sm">No verses found</p>
          </div>
        )}

        {!loading && !error && verses.length > 0 && (
          <div className="space-y-1">
            {verses.map(verse => {
              const isSelected = isVerseSelected(verse.num);
              const isStart = verse.num === selectedStart;
              const isEnd = verse.num === selectedEnd;

              return (
                <button
                  key={verse.num}
                  type="button"
                  onClick={() => onVerseClick(verse.num)}
                  className={`
                    w-full text-left p-3 rounded-lg transition-all
                    flex gap-3
                    ${isSelected
                      ? 'bg-[var(--ark-gold)]/20 border border-[var(--ark-gold)]/40'
                      : 'bg-white/5 border border-transparent hover:bg-white/10'
                    }
                    ${isStart ? 'rounded-b-none border-b-0' : ''}
                    ${isEnd ? 'rounded-t-none border-t-0' : ''}
                    ${isSelected && !isStart && !isEnd ? 'rounded-none border-y-0' : ''}
                  `}
                >
                  <span
                    className={`
                      font-bold text-sm shrink-0 w-6 text-right
                      ${isSelected ? 'text-[var(--ark-gold)]' : 'text-white/50'}
                    `}
                  >
                    {verse.num}
                  </span>
                  <span
                    className={`
                      text-sm leading-relaxed
                      ${isSelected ? 'text-white' : 'text-white/80'}
                    `}
                  >
                    {verse.text}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer with load button - extra bottom padding for safe area */}
      <div className="px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] border-t border-white/10 shrink-0">
        <button
          type="button"
          onClick={onLoadPassage}
          disabled={!canLoad}
          className={`
            w-full py-3 rounded-lg font-semibold
            flex items-center justify-center gap-2
            transition-all
            ${canLoad
              ? 'bg-[var(--ark-gold)] text-[var(--ark-navy)] hover:bg-[var(--ark-gold)]/90'
              : 'bg-white/10 text-white/40 cursor-not-allowed'
            }
          `}
        >
          <svg
            className="w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
          {loadButtonText}
        </button>
      </div>
    </div>
  );
}
