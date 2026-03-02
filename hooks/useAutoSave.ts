'use client';

/**
 * Hook for auto-saving journal drafts
 * Saves every 30 seconds while the user is typing
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { saveDraft, loadDraft, clearDraft } from '@/lib/journalStorage';
import type { JournalDraft, DimensionType } from '@/types/journal';

const AUTO_SAVE_INTERVAL = 30 * 1000; // 30 seconds

export interface UseAutoSaveOptions {
  /** Whether auto-save is enabled (default: true) */
  enabled?: boolean;
  /** Callback when draft is restored */
  onDraftRestored?: (draft: JournalDraft) => void;
}

export interface UseAutoSaveReturn {
  /** Whether a draft was restored on mount */
  draftRestored: boolean;
  /** Manually save the current draft */
  saveNow: () => void;
  /** Clear the current draft */
  clear: () => void;
  /** The loaded draft (if any) */
  loadedDraft: JournalDraft | null;
}

export interface DraftData {
  scripture: string;
  scripturePassage: string;
  bibleVersion: number;
  head: string;
  heart: string;
  hands: string;
  expandedDimension: DimensionType;
  isEditing: boolean;
  editingEntryId: number | null;
}

/**
 * Hook that auto-saves journal drafts every 30 seconds
 *
 * @example
 * ```tsx
 * function JournalForm() {
 *   const [scripture, setScripture] = useState('');
 *   const [head, setHead] = useState('');
 *   // ... other fields
 *
 *   const { draftRestored } = useAutoSave({
 *     getDraftData: () => ({ scripture, head, heart, hands, ... }),
 *     onDraftRestored: (draft) => {
 *       setScripture(draft.scripture);
 *       setHead(draft.head);
 *       // ... restore other fields
 *     }
 *   });
 *
 *   return (
 *     <>
 *       {draftRestored && <Toast>Unsaved draft restored</Toast>}
 *       // ... form fields
 *     </>
 *   );
 * }
 * ```
 */
export function useAutoSave(
  getDraftData: () => DraftData,
  options: UseAutoSaveOptions = {}
): UseAutoSaveReturn {
  const { enabled = true, onDraftRestored } = options;

  const [draftRestored, setDraftRestored] = useState(false);
  const [loadedDraft, setLoadedDraft] = useState<JournalDraft | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const getDraftDataRef = useRef(getDraftData);
  const isSavingRef = useRef(false);
  const onDraftRestoredRef = useRef(onDraftRestored);
  onDraftRestoredRef.current = onDraftRestored;

  // Keep ref updated with latest getDraftData
  useEffect(() => {
    getDraftDataRef.current = getDraftData;
  }, [getDraftData]);

  // Save draft to localStorage
  const saveNow = useCallback(() => {
    // Prevent concurrent saves
    if (isSavingRef.current) return;
    isSavingRef.current = true;

    try {
      const data = getDraftDataRef.current();

      // Only save if there's actual content
      const hasContent =
        data.head.trim() ||
        data.heart.trim() ||
        data.hands.trim();

      if (!hasContent) {
        // No content, clear any existing draft
        clearDraft();
        return;
      }

      const draft: JournalDraft = {
        ...data,
        timestamp: Date.now(),
      };

      saveDraft(draft);
    } finally {
      isSavingRef.current = false;
    }
  }, []);

  // Clear the draft
  const clear = useCallback(() => {
    clearDraft();
    setLoadedDraft(null);
    setDraftRestored(false);
  }, []);

  // Load draft on mount only
  useEffect(() => {
    if (!enabled) return;

    const draft = loadDraft();
    if (draft && !draft.isEditing) {
      // Check if draft has meaningful content
      const hasContent =
        draft.head?.trim() ||
        draft.heart?.trim() ||
        draft.hands?.trim();

      if (hasContent) {
        console.log('[AutoSave] Restored draft');
        setLoadedDraft(draft);
        setDraftRestored(true);
        onDraftRestoredRef.current?.(draft);
      } else {
        // Clear empty draft
        clearDraft();
      }
    }
  }, [enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  // Start auto-save interval
  useEffect(() => {
    if (!enabled) return;

    // Don't save immediately on start - wait for first interval
    // This prevents race conditions with draft restoration on mount
    intervalRef.current = setInterval(saveNow, AUTO_SAVE_INTERVAL);
    console.log('[AutoSave] Started auto-save (every 30s)');

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        console.log('[AutoSave] Stopped auto-save');
      }
    };
  }, [enabled, saveNow]);

  return {
    draftRestored,
    saveNow,
    clear,
    loadedDraft,
  };
}
