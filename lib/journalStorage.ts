/**
 * Journal localStorage CRUD operations
 * Offline-first storage with sync support
 */

import type { JournalEntry, JournalDraft, UserStreak } from '@/types/journal';
import { STORAGE_KEYS } from '@/types/journal';

// ============================================
// DEVICE ID
// ============================================

/**
 * Get or create a unique device ID for sync identification
 */
export function getDeviceId(): string {
  if (typeof window === 'undefined') return 'server';

  let deviceId = localStorage.getItem(STORAGE_KEYS.DEVICE_ID);
  if (!deviceId) {
    deviceId = `web_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 10)}`;
    localStorage.setItem(STORAGE_KEYS.DEVICE_ID, deviceId);
  }
  return deviceId;
}

// ============================================
// JOURNAL ENTRIES CRUD
// ============================================

/**
 * Get all active (non-deleted) journal entries
 */
export function getJournalEntries(): JournalEntry[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.JOURNAL_ENTRIES);
    if (!stored) return [];

    const entries: JournalEntry[] = JSON.parse(stored);
    // Filter out soft-deleted entries
    return entries.filter(e => !e.deletedAt);
  } catch (error) {
    console.error('[Storage] Error reading journal entries:', error);
    return [];
  }
}

/**
 * Get all journal entries including soft-deleted (for sync)
 */
export function getAllJournalEntries(): JournalEntry[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.JOURNAL_ENTRIES);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('[Storage] Error reading all journal entries:', error);
    return [];
  }
}

/**
 * Get a single journal entry by local ID
 */
export function getJournalEntry(id: number): JournalEntry | null {
  const entries = getAllJournalEntries();
  return entries.find(e => e.id === id) || null;
}

/**
 * Get a journal entry by cloud ID
 */
export function getEntryByCloudId(cloudId: string): JournalEntry | null {
  const entries = getAllJournalEntries();
  return entries.find(e => e.cloudId === cloudId) || null;
}

/**
 * Get a journal entry by local_id string (for sync matching)
 */
export function getEntryByLocalId(localId: string): JournalEntry | null {
  const entries = getAllJournalEntries();
  return entries.find(e => e.localId === localId) || null;
}

/**
 * Save a new journal entry
 */
export function saveJournalEntry(entry: Omit<JournalEntry, 'id' | 'cloudId' | 'syncToken' | 'localId' | 'createdAt' | 'updatedAt' | 'deletedAt'>): JournalEntry {
  const entries = getAllJournalEntries();
  const now = new Date().toISOString();
  const id = Date.now();

  const newEntry: JournalEntry = {
    ...entry,
    id,
    cloudId: null,
    syncToken: null,
    localId: `${getDeviceId()}_${id}`,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };

  entries.push(newEntry);
  localStorage.setItem(STORAGE_KEYS.JOURNAL_ENTRIES, JSON.stringify(entries));

  console.log('[Storage] Saved new journal entry:', newEntry.id);
  return newEntry;
}

/**
 * Update an existing journal entry
 */
export function updateJournalEntry(id: number, updates: Partial<JournalEntry>): JournalEntry | null {
  const entries = getAllJournalEntries();
  const index = entries.findIndex(e => e.id === id);

  if (index === -1) {
    console.error('[Storage] Entry not found for update:', id);
    return null;
  }

  const updatedEntry: JournalEntry = {
    ...entries[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  entries[index] = updatedEntry;
  localStorage.setItem(STORAGE_KEYS.JOURNAL_ENTRIES, JSON.stringify(entries));

  console.log('[Storage] Updated journal entry:', id);
  return updatedEntry;
}

/**
 * Delete a journal entry.
 * - Entries with a cloudId are soft-deleted (kept for sync, then hard-deleted after cloud confirms).
 * - Entries without a cloudId (local-only) are hard-deleted immediately since there's nothing to sync.
 */
export function deleteJournalEntry(id: number): boolean {
  const entry = getJournalEntry(id);
  if (!entry) {
    console.error('[Storage] Entry not found for delete:', id);
    return false;
  }

  if (entry.cloudId) {
    // Cloud-synced entry: soft delete so sync can propagate deletion
    const now = new Date().toISOString();
    updateJournalEntry(id, { deletedAt: now, updatedAt: now });
    addToDeletedLog(entry.cloudId);
    console.log('[Storage] Soft deleted journal entry:', id);
  } else {
    // Local-only entry: hard delete immediately (no cloud record to clean up)
    hardDeleteJournalEntry(id);
    console.log('[Storage] Hard deleted local-only journal entry:', id);
  }

  return true;
}

/**
 * Hard delete a journal entry (removes completely)
 */
export function hardDeleteJournalEntry(id: number): boolean {
  const entries = getAllJournalEntries();
  const filtered = entries.filter(e => e.id !== id);

  if (filtered.length === entries.length) {
    console.error('[Storage] Entry not found for hard delete:', id);
    return false;
  }

  localStorage.setItem(STORAGE_KEYS.JOURNAL_ENTRIES, JSON.stringify(filtered));
  console.log('[Storage] Hard deleted journal entry:', id);
  return true;
}

/**
 * Update cloud metadata after successful sync
 */
export function updateEntryCloudMetadata(localId: number, cloudId: string, syncToken: string | null): void {
  updateJournalEntry(localId, { cloudId, syncToken });
}

/**
 * Save entries directly (for sync operations)
 */
export function saveEntriesDirect(entries: JournalEntry[]): void {
  localStorage.setItem(STORAGE_KEYS.JOURNAL_ENTRIES, JSON.stringify(entries));
}

// ============================================
// DELETION LOG
// ============================================

/**
 * Get the deletion log (cloudIds of deleted entries)
 */
export function getDeletedLog(): string[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.DELETED_ENTRIES);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Add a cloudId to the deletion log
 */
export function addToDeletedLog(cloudId: string): void {
  const log = getDeletedLog();
  if (!log.includes(cloudId)) {
    log.push(cloudId);
    localStorage.setItem(STORAGE_KEYS.DELETED_ENTRIES, JSON.stringify(log));
  }
}

/**
 * Remove a cloudId from the deletion log
 */
export function removeFromDeletedLog(cloudId: string): void {
  const log = getDeletedLog();
  const filtered = log.filter(id => id !== cloudId);
  localStorage.setItem(STORAGE_KEYS.DELETED_ENTRIES, JSON.stringify(filtered));
}

/**
 * Check if an entry was deleted locally
 */
export function wasDeletedLocally(cloudId: string): boolean {
  return getDeletedLog().includes(cloudId);
}

/**
 * Clean up all soft-deleted entries (after successful cloud sync)
 */
export function cleanupDeletedEntries(): void {
  const entries = getAllJournalEntries();
  const active = entries.filter(e => !e.deletedAt);
  localStorage.setItem(STORAGE_KEYS.JOURNAL_ENTRIES, JSON.stringify(active));
  console.log('[Storage] Cleaned up deleted entries');
}

// ============================================
// DRAFT MANAGEMENT
// ============================================

const DRAFT_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Save a journal draft
 */
export function saveDraft(draft: JournalDraft): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.JOURNAL_DRAFT, JSON.stringify(draft));
  console.log('[Storage] Draft saved');
}

/**
 * Load a journal draft (returns null if expired or not found)
 */
export function loadDraft(): JournalDraft | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.JOURNAL_DRAFT);
    if (!stored) return null;

    const draft: JournalDraft = JSON.parse(stored);

    // Check if draft is expired
    const age = Date.now() - draft.timestamp;
    if (age > DRAFT_MAX_AGE) {
      console.log('[Storage] Draft expired, removing');
      clearDraft();
      return null;
    }

    return draft;
  } catch (error) {
    console.error('[Storage] Error loading draft:', error);
    clearDraft();
    return null;
  }
}

/**
 * Clear the journal draft
 */
export function clearDraft(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.JOURNAL_DRAFT);
  console.log('[Storage] Draft cleared');
}

// ============================================
// PENDING ENTRY (for login gate)
// ============================================

/**
 * Save a pending entry (when user saves while logged out)
 */
export function savePendingEntry(entry: Omit<JournalEntry, 'id' | 'cloudId' | 'syncToken' | 'localId' | 'createdAt' | 'updatedAt' | 'deletedAt'>): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.PENDING_ENTRY, JSON.stringify(entry));
  console.log('[Storage] Pending entry saved');
}

/**
 * Get and clear the pending entry (after login)
 */
export function getPendingEntry(): Omit<JournalEntry, 'id' | 'cloudId' | 'syncToken' | 'localId' | 'createdAt' | 'updatedAt' | 'deletedAt'> | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.PENDING_ENTRY);
    if (!stored) return null;

    localStorage.removeItem(STORAGE_KEYS.PENDING_ENTRY);
    return JSON.parse(stored);
  } catch {
    localStorage.removeItem(STORAGE_KEYS.PENDING_ENTRY);
    return null;
  }
}

/**
 * Check if there's a pending entry
 */
export function hasPendingEntry(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem(STORAGE_KEYS.PENDING_ENTRY);
}

// ============================================
// STREAK MANAGEMENT
// ============================================

/**
 * Get the user's streak data
 */
export function getUserStreak(): UserStreak {
  if (typeof window === 'undefined') {
    return { current: 0, longest: 0, lastDate: null };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.USER_STREAK);
    if (!stored) return { current: 0, longest: 0, lastDate: null };
    return JSON.parse(stored);
  } catch {
    return { current: 0, longest: 0, lastDate: null };
  }
}

/**
 * Get the "streak day" string (YYYY-MM-DD) using local time with a 3am boundary.
 * Before 3am counts as the previous day — so night owls don't lose their streak.
 */
function getStreakDay(date?: Date): string {
  const d = date ?? new Date();
  // If before 3am local, treat as previous day
  if (d.getHours() < 3) {
    d.setDate(d.getDate() - 1);
  }
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Update the user's streak after journaling.
 * Day resets at 3am local time — journaling before 3am counts as the prior day.
 */
export function updateStreak(): UserStreak {
  const streak = getUserStreak();
  const today = getStreakDay();
  const lastDate = streak.lastDate;

  if (lastDate === today) {
    // Already journaled today, no change
    return streak;
  }

  // Check if yesterday (relative to 3am boundary)
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = getStreakDay(yesterdayDate);

  let newCurrent: number;
  if (lastDate === yesterdayStr) {
    // Consecutive day - increment
    newCurrent = streak.current + 1;
  } else {
    // Gap in journaling - reset to 1
    newCurrent = 1;
  }

  const newStreak: UserStreak = {
    current: newCurrent,
    longest: Math.max(streak.longest, newCurrent),
    lastDate: today,
  };

  localStorage.setItem(STORAGE_KEYS.USER_STREAK, JSON.stringify(newStreak));
  console.log('[Storage] Streak updated:', newStreak);

  return newStreak;
}

// ============================================
// SYNC TIMESTAMP
// ============================================

/**
 * Get the last sync timestamp
 */
export function getLastSyncTimestamp(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
}

/**
 * Set the last sync timestamp
 */
export function setLastSyncTimestamp(timestamp: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.LAST_SYNC, timestamp);
}

// ============================================
// DEDUPLICATION
// ============================================

/**
 * Deduplicate entries by cloudId (keeps newest by updatedAt)
 */
export function deduplicateEntries(): void {
  const entries = getAllJournalEntries();
  const seenCloudIds = new Map<string, JournalEntry>();
  const result: JournalEntry[] = [];

  // Sort newest first
  const sorted = [...entries].sort((a, b) =>
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  for (const entry of sorted) {
    // If has cloudId and we've seen it, skip (keep newer one)
    if (entry.cloudId && seenCloudIds.has(entry.cloudId)) {
      console.log('[Storage] Removing duplicate entry:', entry.id, 'cloudId:', entry.cloudId);
      continue;
    }

    if (entry.cloudId) {
      seenCloudIds.set(entry.cloudId, entry);
    }
    result.push(entry);
  }

  // Re-sort by createdAt ascending
  result.sort((a, b) =>
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  if (result.length !== entries.length) {
    localStorage.setItem(STORAGE_KEYS.JOURNAL_ENTRIES, JSON.stringify(result));
    console.log('[Storage] Deduplication complete. Removed:', entries.length - result.length);
  }
}

// ============================================
// UTILITIES
// ============================================

/**
 * Get entries that need to be synced (new or updated since last sync)
 */
export function getUnsyncedEntries(lastSyncTimestamp: string | null): JournalEntry[] {
  const entries = getAllJournalEntries();

  return entries.filter(entry => {
    // New entries (no cloudId) always need sync
    if (!entry.cloudId) return true;

    // No last sync means sync everything
    if (!lastSyncTimestamp) return true;

    // Updated since last sync
    const entryDate = new Date(entry.updatedAt);
    const lastSync = new Date(lastSyncTimestamp);
    return entryDate > lastSync;
  });
}

/**
 * Get soft-deleted entries that have a cloudId (need cloud deletion)
 */
export function getDeletedEntriesToSync(): JournalEntry[] {
  const entries = getAllJournalEntries();
  return entries.filter(e => e.deletedAt && e.cloudId);
}

/**
 * Find entry by content match (for sync deduplication)
 */
export function findEntryByContent(scripture: string, head: string, heart: string, hands: string): JournalEntry | null {
  const entries = getJournalEntries();
  return entries.find(e =>
    e.scripture === scripture &&
    (e.head || '') === (head || '') &&
    (e.heart || '') === (heart || '') &&
    (e.hands || '') === (hands || '')
  ) || null;
}

/**
 * Get total entry count (for challenge progress)
 */
export function getTotalEntryCount(): number {
  return getJournalEntries().length;
}

// ============================================
// ALIASES (for compatibility)
// ============================================

// Alias for hardDeleteJournalEntry
export const hardDeleteEntry = hardDeleteJournalEntry;

// Alias for getLastSyncTimestamp
export const getLastSyncTime = getLastSyncTimestamp;

// Alias for setLastSyncTimestamp
export const setLastSyncTime = setLastSyncTimestamp;

// Alias for getUserStreak
export const getStreak = getUserStreak;

// ============================================
// PENDING ENTRY (alias with different return)
// ============================================

/**
 * Store a pending entry (for login gate)
 */
export function storePendingEntry(entry: Omit<JournalEntry, 'id' | 'cloudId' | 'syncToken' | 'localId' | 'createdAt' | 'updatedAt' | 'deletedAt'>): void {
  savePendingEntry(entry);
}

/**
 * Clear the pending entry
 */
export function clearPendingEntry(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.PENDING_ENTRY);
}
