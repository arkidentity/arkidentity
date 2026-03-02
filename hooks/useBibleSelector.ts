'use client';

/**
 * Hook for managing Bible selector state
 * Handles book list, chapter selection, and verse range picking
 */

import { useState, useCallback } from 'react';
import { BIBLE_BOOKS, VERSIONS, getVersionName } from '@/lib/bibleData';
import { fetchChapterVerses, fetchPassage } from '@/lib/youversionApi';
import type { BibleBook, ParsedVerse, BiblePassage, BibleSelectorState } from '@/types/journal';

export interface UseBibleSelectorOptions {
  /** Default Bible version ID */
  defaultVersion?: number;
  /** Callback when passage is selected */
  onSelect?: (passage: BiblePassage) => void;
  /** Callback when selector is closed */
  onClose?: () => void;
}

export interface UseBibleSelectorReturn {
  /** Current selector state */
  state: BibleSelectorState;
  /** Open the selector */
  open: () => void;
  /** Close the selector */
  close: () => void;
  /** Change Bible version */
  setVersion: (versionId: number) => void;
  /** Toggle book expansion */
  toggleBook: (bookId: string) => void;
  /** Select a chapter to view */
  selectChapter: (book: BibleBook, chapter: number) => Promise<void>;
  /** Handle verse click for selection */
  handleVerseClick: (verseNum: number) => void;
  /** Clear verse selection */
  clearSelection: () => void;
  /** Go back to book list */
  goBackToBooks: () => void;
  /** Load the selected passage */
  loadSelectedPassage: () => Promise<void>;
  /** Check if a verse is in the selected range */
  isVerseSelected: (verseNum: number) => boolean;
  /** Get the selection label text */
  getSelectionLabel: () => string;
  /** Get the load button text */
  getLoadButtonText: () => string;
  /** Can load passage (has selection) */
  canLoad: boolean;
  /** Get books organized by testament */
  getBooksByTestament: () => { nt: BibleBook[]; ot: BibleBook[] };
}

const initialState: BibleSelectorState = {
  isOpen: false,
  screen: 'books',
  version: 111, // Default NIV
  expandedBook: null,
  selectedBook: null,
  selectedChapter: null,
  chapterVerses: [],
  selectedStart: null,
  selectedEnd: null,
  loading: false,
  error: null,
};

export function useBibleSelector(
  options: UseBibleSelectorOptions = {}
): UseBibleSelectorReturn {
  const { defaultVersion = 111, onSelect, onClose } = options;

  const [state, setState] = useState<BibleSelectorState>({
    ...initialState,
    version: defaultVersion,
  });

  // Open the selector
  const open = useCallback(() => {
    setState(prev => ({
      ...initialState,
      version: prev.version, // Keep current version
      isOpen: true,
      screen: 'books',
    }));
  }, []);

  // Close the selector
  const close = useCallback(() => {
    setState(prev => ({
      ...prev,
      isOpen: false,
    }));
    onClose?.();
  }, [onClose]);

  // Change version
  const setVersion = useCallback((versionId: number) => {
    setState(prev => ({
      ...prev,
      version: versionId,
      expandedBook: null, // Collapse any expanded book
    }));
  }, []);

  // Toggle book expansion
  const toggleBook = useCallback((bookId: string) => {
    setState(prev => ({
      ...prev,
      expandedBook: prev.expandedBook === bookId ? null : bookId,
    }));
  }, []);

  // Select chapter and load verses
  const selectChapter = useCallback(async (book: BibleBook, chapter: number) => {
    setState(prev => ({
      ...prev,
      selectedBook: book,
      selectedChapter: chapter,
      selectedStart: null,
      selectedEnd: null,
      chapterVerses: [],
      screen: 'chapter',
      loading: true,
      error: null,
    }));

    try {
      const result = await fetchChapterVerses(state.version, book.id, chapter);
      const verses = result.verses;

      setState(prev => ({
        ...prev,
        chapterVerses: verses,
        loading: false,
      }));
    } catch (err) {
      console.error('[useBibleSelector] Error loading chapter:', err);
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to load chapter. Please try again.',
      }));
    }
  }, [state.version]);

  // Handle verse click for selection
  const handleVerseClick = useCallback((verseNum: number) => {
    setState(prev => {
      const { selectedStart, selectedEnd } = prev;

      if (selectedStart === null) {
        // First tap: set start
        return { ...prev, selectedStart: verseNum, selectedEnd: null };
      } else if (selectedEnd === null) {
        // Second tap: set end
        return { ...prev, selectedEnd: verseNum };
      } else {
        // Third tap: reset and start new selection
        return { ...prev, selectedStart: verseNum, selectedEnd: null };
      }
    });
  }, []);

  // Clear verse selection
  const clearSelection = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedStart: null,
      selectedEnd: null,
    }));
  }, []);

  // Go back to book list
  const goBackToBooks = useCallback(() => {
    setState(prev => ({
      ...prev,
      screen: 'books',
      selectedBook: null,
      selectedChapter: null,
      chapterVerses: [],
      selectedStart: null,
      selectedEnd: null,
    }));
  }, []);

  // Load the selected passage
  const loadSelectedPassage = useCallback(async () => {
    const { selectedBook, selectedChapter, selectedStart, selectedEnd, version, chapterVerses } = state;

    if (!selectedBook || !selectedChapter || selectedStart === null) {
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const min = selectedEnd !== null ? Math.min(selectedStart, selectedEnd) : selectedStart;
      const max = selectedEnd !== null ? Math.max(selectedStart, selectedEnd) : selectedStart;

      // Build USFM reference
      const usfm = min === max
        ? `${selectedBook.id}.${selectedChapter}.${min}`
        : `${selectedBook.id}.${selectedChapter}.${min}-${max}`;

      // Build reference string
      const verseText = min === max ? `:${min}` : `:${min}-${max}`;
      const reference = `${selectedBook.name} ${selectedChapter}${verseText}`;

      // Get the selected verses text
      const selectedVerses = chapterVerses.filter(v => v.num >= min && v.num <= max);
      const formattedText = selectedVerses
        .map(v => `[${v.num}] ${v.text}`)
        .join(' ');

      const passage: BiblePassage = {
        version,
        versionName: getVersionName(version),
        book: selectedBook.name,
        bookId: selectedBook.id,
        chapter: selectedChapter,
        verseStart: min,
        verseEnd: max,
        usfm,
        reference,
        content: formattedText, // For now, same as formatted
        formattedText,
      };

      onSelect?.(passage);
      close();

    } catch (err) {
      console.error('[useBibleSelector] Error loading passage:', err);
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to load passage. Please try again.',
      }));
    }
  }, [state, onSelect, close]);

  // Check if verse is selected
  const isVerseSelected = useCallback((verseNum: number): boolean => {
    const { selectedStart, selectedEnd } = state;

    if (selectedStart === null) return false;
    if (selectedEnd === null) return verseNum === selectedStart;

    const min = Math.min(selectedStart, selectedEnd);
    const max = Math.max(selectedStart, selectedEnd);

    return verseNum >= min && verseNum <= max;
  }, [state.selectedStart, state.selectedEnd]);

  // Get selection label
  const getSelectionLabel = useCallback((): string => {
    const { selectedStart, selectedEnd } = state;

    if (selectedStart === null) {
      return 'Tap a verse to start selection';
    }
    if (selectedEnd === null) {
      return `Verse ${selectedStart} selected - tap another to set range`;
    }

    const min = Math.min(selectedStart, selectedEnd);
    const max = Math.max(selectedStart, selectedEnd);
    const count = max - min + 1;

    return `Verses ${min}-${max} selected (${count} verses)`;
  }, [state.selectedStart, state.selectedEnd]);

  // Get load button text
  const getLoadButtonText = useCallback((): string => {
    const { selectedStart, selectedEnd } = state;

    if (selectedStart === null) {
      return 'Select Verses First';
    }
    if (selectedEnd === null) {
      return `Load Verse ${selectedStart}`;
    }

    const min = Math.min(selectedStart, selectedEnd);
    const max = Math.max(selectedStart, selectedEnd);

    return `Load Verses ${min}-${max}`;
  }, [state.selectedStart, state.selectedEnd]);

  // Can load (has selection)
  const canLoad = state.selectedStart !== null && !state.loading;

  // Get books by testament (NT first, then OT)
  const getBooksByTestament = useCallback(() => {
    const nt = BIBLE_BOOKS.filter(b => b.testament === 'NT');
    const ot = BIBLE_BOOKS.filter(b => b.testament === 'OT');
    return { nt, ot };
  }, []);

  return {
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
  };
}
