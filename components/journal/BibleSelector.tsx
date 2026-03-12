'use client';

/**
 * BibleSelector - Full-screen Bible selection modal
 * Shows book list → chapter preview → verse selection
 */

import { useEffect } from 'react';
import { BookList } from './BookList';
import { ChapterPreview } from './ChapterPreview';
import { VERSIONS } from '@/lib/bibleData';
import type { BibleSelectorProps } from '@/types/journal';
import { useBibleSelector } from '@/hooks/useBibleSelector';

export function BibleSelector({
  isOpen,
  defaultVersion,
  onSelect,
  onClose,
  onVersionChange,
}: BibleSelectorProps) {
  const {
    state,
    open,
    close,
    setVersion,
    toggleBook,
    selectChapter,
    handleVerseClick,
    clearSelection,
    goBackToBooks,
    loadSelectedPassage,
    isVerseSelected,
    getSelectionLabel,
    getLoadButtonText,
    canLoad,
    getBooksByTestament,
  } = useBibleSelector({
    defaultVersion,
    onSelect,
    onClose,
  });

  // Sync external isOpen state
  useEffect(() => {
    if (isOpen && !state.isOpen) {
      open();
    } else if (!isOpen && state.isOpen) {
      close();
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Lock body scroll when open and hide bottom nav
  useEffect(() => {
    if (state.isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.dataset.bibleSelectorOpen = 'true';
    } else {
      document.body.style.overflow = '';
      delete document.body.dataset.bibleSelectorOpen;
    }
    return () => {
      document.body.style.overflow = '';
      delete document.body.dataset.bibleSelectorOpen;
    };
  }, [state.isOpen]);

  if (!state.isOpen) {
    return null;
  }

  const books = getBooksByTestament();
  const availableVersions = Object.values(VERSIONS);

  return (
    <div className="fixed inset-0 z-50 bg-[var(--ark-navy)] flex flex-col">
      {/* Book List Screen */}
      {state.screen === 'books' && (
        <>
          {/* Header — py-3 baseline, but add safe-area-inset-top so content clears the
              iPhone status bar. BibleSelector is fixed inset-0 so body padding doesn't apply. */}
          <div
            className="flex items-center justify-between px-4 pb-3 border-b border-white/10 shrink-0"
            style={{ paddingTop: 'calc(0.75rem + env(safe-area-inset-top, 0px))' }}
          >
            <button
              type="button"
              onClick={close}
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

            <h1 className="text-white font-semibold text-lg">Select Scripture</h1>

            {/* Version selector */}
            <select
              value={state.version}
              onChange={(e) => {
                const id = parseInt(e.target.value);
                setVersion(id);
                onVersionChange?.(id);
              }}
              className="
                bg-white/10 text-white text-sm font-medium
                px-3 py-2 rounded-lg
                border border-white/20
                focus:outline-none focus:border-[var(--ark-gold)]
                cursor-pointer
              "
            >
              {availableVersions.map(v => (
                <option key={v.id} value={v.id} className="bg-[var(--ark-navy)] text-white">
                  {v.abbreviation}
                </option>
              ))}
            </select>
          </div>

          {/* Book list */}
          <BookList
            books={books}
            expandedBook={state.expandedBook}
            onToggleBook={toggleBook}
            onSelectChapter={selectChapter}
          />
        </>
      )}

      {/* Chapter Preview Screen */}
      {state.screen === 'chapter' && state.selectedBook && state.selectedChapter && (
        <ChapterPreview
          bookName={state.selectedBook.name}
          chapter={state.selectedChapter}
          verses={state.chapterVerses}
          selectedStart={state.selectedStart}
          selectedEnd={state.selectedEnd}
          loading={state.loading}
          error={state.error}
          isVerseSelected={isVerseSelected}
          onVerseClick={handleVerseClick}
          onClearSelection={clearSelection}
          selectionLabel={getSelectionLabel()}
          loadButtonText={getLoadButtonText()}
          canLoad={canLoad}
          onLoadPassage={loadSelectedPassage}
          onBack={goBackToBooks}
        />
      )}
    </div>
  );
}
