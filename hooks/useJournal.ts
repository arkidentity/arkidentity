'use client';

/**
 * Hook for managing journal state and operations
 * Handles CRUD, sync, and state management
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import {
  getJournalEntries,
  saveJournalEntry,
  updateJournalEntry,
  deleteJournalEntry,
  getStreak,
  updateStreak,
} from '@/lib/journalStorage';
import { syncJournalEntries, manualSync, getSyncStatus } from '@/lib/journalSync';
import { onJournalEntrySaved } from '@/lib/activitySync';
import type { JournalEntry, UserStreak, SyncResult } from '@/types/journal';

export interface UseJournalOptions {
  /** Auto-sync on mount when logged in */
  autoSync?: boolean;
}

export interface UseJournalReturn {
  /** All journal entries */
  entries: JournalEntry[];
  /** Current streak info */
  streak: UserStreak;
  /** Whether sync is in progress */
  syncing: boolean;
  /** Last sync result */
  lastSyncResult: SyncResult | null;
  /** Save a new entry */
  save: (data: NewEntryData) => JournalEntry;
  /** Update an existing entry */
  update: (id: number, data: Partial<JournalEntry>) => JournalEntry | null;
  /** Delete an entry (soft delete) */
  remove: (id: number) => void;
  /** Manually trigger sync */
  sync: () => Promise<SyncResult>;
  /** Refresh entries from storage */
  refresh: () => void;
  /** Get entry by ID */
  getEntry: (id: number) => JournalEntry | undefined;
}

export interface NewEntryData {
  scripture: string;
  scripturePassage: string;
  bibleVersion: number;
  head: string;
  heart: string;
  hands: string;
}

export function useJournal(options: UseJournalOptions = {}): UseJournalReturn {
  const { autoSync = true } = options;
  const { user, isLoggedIn } = useAuth();

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [streak, setStreak] = useState<UserStreak>({ current: 0, longest: 0, lastDate: null });
  const [syncing, setSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);

  // Load entries from storage
  const loadEntries = useCallback(() => {
    const allEntries = getJournalEntries();
    // Filter out soft-deleted and sort newest first
    const active = allEntries
      .filter(e => !e.deletedAt)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setEntries(active);
  }, []);

  // Load streak
  const loadStreak = useCallback(() => {
    const currentStreak = getStreak();
    setStreak(currentStreak);
  }, []);

  // Initial load
  useEffect(() => {
    loadEntries();
    loadStreak();
  }, [loadEntries, loadStreak]);

  // Auto-sync when logged in — runs during browser idle time so it never
  // competes with navigation, paint, or user interaction.
  useEffect(() => {
    if (!autoSync || !isLoggedIn || !user) return;

    const doSync = async () => {
      setSyncing(true);
      try {
        const result = await syncJournalEntries(user);
        setLastSyncResult(result);
        loadEntries();
        loadStreak();
      } catch (err) {
        console.error('[useJournal] Sync error:', err);
      } finally {
        setSyncing(false);
      }
    };

    // Prefer requestIdleCallback so sync runs when the browser has spare time.
    // Fall back to a 2-second timeout on browsers that don't support it (rare).
    let idleId: number | undefined;
    let fallbackId: ReturnType<typeof setTimeout> | undefined;

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      idleId = window.requestIdleCallback(doSync, { timeout: 4000 });
    } else {
      fallbackId = setTimeout(doSync, 2000);
    }

    return () => {
      if (idleId !== undefined) window.cancelIdleCallback(idleId);
      if (fallbackId !== undefined) clearTimeout(fallbackId);
    };
  }, [autoSync, isLoggedIn, user, loadEntries, loadStreak]);

  // Save new entry
  const save = useCallback((data: NewEntryData): JournalEntry => {
    const entry = saveJournalEntry(data);

    // Update streak
    updateStreak();
    loadStreak();

    // Refresh entries list
    loadEntries();

    // Trigger background sync if logged in
    if (isLoggedIn && user) {
      syncJournalEntries(user).then(result => {
        setLastSyncResult(result);
        loadEntries();
        // Update aggregate progress (streak, totals) for DNA Hub dashboard
        onJournalEntrySaved(user.id).catch(err =>
          console.warn('[useJournal] Progress update error:', err)
        );
      });
    }

    return entry;
  }, [isLoggedIn, user, loadEntries, loadStreak]);

  // Update existing entry
  const update = useCallback((id: number, data: Partial<JournalEntry>): JournalEntry | null => {
    const entry = updateJournalEntry(id, data);
    if (!entry) {
      console.error('[useJournal] Failed to update entry:', id);
      return null;
    }
    loadEntries();

    // Trigger background sync if logged in
    if (isLoggedIn && user) {
      syncJournalEntries(user).then(result => {
        setLastSyncResult(result);
        loadEntries();
      });
    }

    return entry;
  }, [isLoggedIn, user, loadEntries]);

  // Delete entry
  const remove = useCallback((id: number): void => {
    deleteJournalEntry(id);
    loadEntries();

    // Trigger background sync if logged in
    if (isLoggedIn && user) {
      syncJournalEntries(user).then(result => {
        setLastSyncResult(result);
        loadEntries();
      });
    }
  }, [isLoggedIn, user, loadEntries]);

  // Manual sync
  const sync = useCallback(async (): Promise<SyncResult> => {
    setSyncing(true);
    try {
      const result = await manualSync(user);
      setLastSyncResult(result);
      loadEntries();
      loadStreak();
      return result;
    } finally {
      setSyncing(false);
    }
  }, [user, loadEntries, loadStreak]);

  // Refresh entries
  const refresh = useCallback(() => {
    loadEntries();
    loadStreak();
  }, [loadEntries, loadStreak]);

  // Get entry by ID
  const getEntry = useCallback((id: number): JournalEntry | undefined => {
    return entries.find(e => e.id === id);
  }, [entries]);

  return {
    entries,
    streak,
    syncing,
    lastSyncResult,
    save,
    update,
    remove,
    sync,
    refresh,
    getEntry,
  };
}
