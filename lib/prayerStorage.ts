/**
 * Prayer Cards localStorage CRUD operations
 * Offline-first storage with sync support
 */

import type { UserPrayerCard, PrayerTheme } from './prayerData';

// ============================================
// STORAGE KEYS
// ============================================

export const PRAYER_STORAGE_KEYS = {
  PRAYER_CARDS: 'dna_prayer_cards',
  DELETED_CARDS: 'dna_prayer_cards_deleted',
  PRAYER_THEME: 'dna_prayer_theme',
  PRAYER_VOLUME: 'dna_prayer_volume',
  PRAYER_FIRST_TIME: 'dna_prayer_first_time',
  PRAYER_STREAK: 'dna_prayer_streak',
  LAST_SYNC: 'dna_prayer_last_sync',
  DEVICE_ID: 'dna_device_id',
} as const;

// ============================================
// DEVICE ID
// ============================================

/**
 * Get or create a unique device ID for sync identification
 */
export function getDeviceId(): string {
  if (typeof window === 'undefined') return 'server';

  let deviceId = localStorage.getItem(PRAYER_STORAGE_KEYS.DEVICE_ID);
  if (!deviceId) {
    deviceId = `web_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 10)}`;
    localStorage.setItem(PRAYER_STORAGE_KEYS.DEVICE_ID, deviceId);
  }
  return deviceId;
}

// ============================================
// PRAYER CARDS CRUD
// ============================================

/**
 * Get all visible (non-deleted) prayer cards
 */
export function getPrayerCards(): UserPrayerCard[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(PRAYER_STORAGE_KEYS.PRAYER_CARDS);
    if (!stored) return [];

    const cards: UserPrayerCard[] = JSON.parse(stored);
    return cards.filter(c => !c.deletedAt);
  } catch (error) {
    console.error('[PrayerStorage] Error reading prayer cards:', error);
    return [];
  }
}

/**
 * Get all prayer cards including soft-deleted (for sync)
 */
export function getAllPrayerCards(): UserPrayerCard[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(PRAYER_STORAGE_KEYS.PRAYER_CARDS);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('[PrayerStorage] Error reading all prayer cards:', error);
    return [];
  }
}

/**
 * Get active (non-answered, non-deleted) prayer cards
 */
export function getActivePrayerCards(): UserPrayerCard[] {
  return getPrayerCards().filter(c => c.status === 'active');
}

/**
 * Get answered (non-deleted) prayer cards
 */
export function getAnsweredPrayerCards(): UserPrayerCard[] {
  return getPrayerCards().filter(c => c.status === 'answered');
}

/**
 * Get a single prayer card by ID
 */
export function getPrayerCard(id: string): UserPrayerCard | null {
  const cards = getAllPrayerCards();
  return cards.find(c => c.id === id) || null;
}

/**
 * Get a prayer card by cloud ID
 */
export function getPrayerCardByCloudId(cloudId: string): UserPrayerCard | null {
  const cards = getAllPrayerCards();
  return cards.find(c => c.cloudId === cloudId) || null;
}

/**
 * Create a new prayer card
 */
export function createPrayerCard(
  title: string,
  details: string | null = null
): UserPrayerCard {
  const cards = getAllPrayerCards();
  const now = new Date().toISOString();
  const id = `card_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  const newCard: UserPrayerCard = {
    id,
    cloudId: null,
    title,
    details,
    status: 'active',
    dateCreated: now,
    updatedAt: now,
    deletedAt: null,
    dateAnswered: null,
    testimony: null,
    prayerCount: 0,
  };

  cards.push(newCard);
  localStorage.setItem(PRAYER_STORAGE_KEYS.PRAYER_CARDS, JSON.stringify(cards));

  console.log('[PrayerStorage] Created prayer card:', newCard.id);
  return newCard;
}

/**
 * Update an existing prayer card
 */
export function updatePrayerCard(
  id: string,
  updates: Partial<UserPrayerCard>
): UserPrayerCard | null {
  const cards = getAllPrayerCards();
  const index = cards.findIndex(c => c.id === id);

  if (index === -1) {
    console.error('[PrayerStorage] Card not found for update:', id);
    return null;
  }

  const updatedCard: UserPrayerCard = {
    ...cards[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  cards[index] = updatedCard;
  localStorage.setItem(PRAYER_STORAGE_KEYS.PRAYER_CARDS, JSON.stringify(cards));

  console.log('[PrayerStorage] Updated prayer card:', id);
  return updatedCard;
}

/**
 * Mark a prayer card as answered
 */
export function markCardAsAnswered(
  id: string,
  testimony: string | null = null
): UserPrayerCard | null {
  const now = new Date().toISOString();
  return updatePrayerCard(id, {
    status: 'answered',
    dateAnswered: now,
    testimony,
  });
}

/**
 * Increment prayer count for a card
 */
export function incrementPrayerCount(id: string): UserPrayerCard | null {
  const card = getPrayerCard(id);
  if (!card) return null;

  return updatePrayerCard(id, {
    prayerCount: card.prayerCount + 1,
  });
}

/**
 * Soft delete a prayer card
 */
export function deletePrayerCard(id: string): boolean {
  const card = getPrayerCard(id);
  if (!card) {
    console.error('[PrayerStorage] Card not found for delete:', id);
    return false;
  }

  const now = new Date().toISOString();
  updatePrayerCard(id, { deletedAt: now });

  // Add to deletion log if has cloudId
  if (card.cloudId) {
    addToDeletedLog(card.cloudId);
  }

  console.log('[PrayerStorage] Soft deleted prayer card:', id);
  return true;
}

/**
 * Hard delete a prayer card (removes completely)
 */
export function hardDeletePrayerCard(id: string): boolean {
  const cards = getAllPrayerCards();
  const filtered = cards.filter(c => c.id !== id);

  if (filtered.length === cards.length) {
    console.error('[PrayerStorage] Card not found for hard delete:', id);
    return false;
  }

  localStorage.setItem(PRAYER_STORAGE_KEYS.PRAYER_CARDS, JSON.stringify(filtered));
  console.log('[PrayerStorage] Hard deleted prayer card:', id);
  return true;
}

/**
 * Update cloud metadata after successful sync
 */
export function updateCardCloudMetadata(id: string, cloudId: string): void {
  updatePrayerCard(id, { cloudId });
}

/**
 * Save cards directly (for sync operations)
 */
export function saveCardsDirect(cards: UserPrayerCard[]): void {
  localStorage.setItem(PRAYER_STORAGE_KEYS.PRAYER_CARDS, JSON.stringify(cards));
}

// ============================================
// DELETION LOG
// ============================================

/**
 * Get the deletion log (cloudIds of deleted cards)
 */
export function getDeletedLog(): string[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(PRAYER_STORAGE_KEYS.DELETED_CARDS);
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
    localStorage.setItem(PRAYER_STORAGE_KEYS.DELETED_CARDS, JSON.stringify(log));
  }
}

/**
 * Remove a cloudId from the deletion log
 */
export function removeFromDeletedLog(cloudId: string): void {
  const log = getDeletedLog();
  const filtered = log.filter(id => id !== cloudId);
  localStorage.setItem(PRAYER_STORAGE_KEYS.DELETED_CARDS, JSON.stringify(filtered));
}

/**
 * Check if a card was deleted locally
 */
export function wasDeletedLocally(cloudId: string): boolean {
  return getDeletedLog().includes(cloudId);
}

/**
 * Clean up all soft-deleted cards (after successful cloud sync)
 */
export function cleanupDeletedCards(): void {
  const cards = getAllPrayerCards();
  const active = cards.filter(c => !c.deletedAt);
  localStorage.setItem(PRAYER_STORAGE_KEYS.PRAYER_CARDS, JSON.stringify(active));
  console.log('[PrayerStorage] Cleaned up deleted cards');
}

// ============================================
// THEME & PREFERENCES
// ============================================

/**
 * Get the saved prayer theme
 */
export function getPrayerTheme(): PrayerTheme {
  if (typeof window === 'undefined') return 'fire';

  try {
    const stored = localStorage.getItem(PRAYER_STORAGE_KEYS.PRAYER_THEME);
    if (stored && ['fire', 'ocean', 'forest'].includes(stored)) {
      return stored as PrayerTheme;
    }
    return 'fire';
  } catch {
    return 'fire';
  }
}

/**
 * Save the prayer theme
 */
export function setPrayerTheme(theme: PrayerTheme): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PRAYER_STORAGE_KEYS.PRAYER_THEME, theme);
}

/**
 * Get the saved music volume (0-1)
 */
export function getMusicVolume(): number {
  if (typeof window === 'undefined') return 0.5;

  try {
    const stored = localStorage.getItem(PRAYER_STORAGE_KEYS.PRAYER_VOLUME);
    if (stored) {
      const vol = parseFloat(stored);
      return isNaN(vol) ? 0.5 : Math.max(0, Math.min(1, vol));
    }
    return 0.5;
  } catch {
    return 0.5;
  }
}

/**
 * Save the music volume
 */
export function setMusicVolume(volume: number): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PRAYER_STORAGE_KEYS.PRAYER_VOLUME, volume.toString());
}

/**
 * Check if this is the user's first time in prayer
 */
export function isFirstTimePrayer(): boolean {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(PRAYER_STORAGE_KEYS.PRAYER_FIRST_TIME) !== 'false';
}

/**
 * Mark first time as complete
 */
export function setFirstTimeComplete(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PRAYER_STORAGE_KEYS.PRAYER_FIRST_TIME, 'false');
}

// ============================================
// STREAK MANAGEMENT
// ============================================

export interface PrayerStreak {
  current: number;
  longest: number;
  lastDate: string | null;
}

/**
 * Get the user's prayer streak data
 */
export function getPrayerStreak(): PrayerStreak {
  if (typeof window === 'undefined') {
    return { current: 0, longest: 0, lastDate: null };
  }

  try {
    const stored = localStorage.getItem(PRAYER_STORAGE_KEYS.PRAYER_STREAK);
    if (!stored) return { current: 0, longest: 0, lastDate: null };
    return JSON.parse(stored);
  } catch {
    return { current: 0, longest: 0, lastDate: null };
  }
}

/**
 * Update the user's streak after completing a prayer session
 */
export function updatePrayerStreak(): PrayerStreak {
  const streak = getPrayerStreak();
  const today = new Date().toISOString().split('T')[0];
  const lastDate = streak.lastDate;

  if (lastDate === today) {
    // Already prayed today, no change
    return streak;
  }

  // Check if yesterday
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  let newCurrent: number;
  if (lastDate === yesterdayStr) {
    // Consecutive day - increment
    newCurrent = streak.current + 1;
  } else {
    // Gap in prayer - reset to 1
    newCurrent = 1;
  }

  const newStreak: PrayerStreak = {
    current: newCurrent,
    longest: Math.max(streak.longest, newCurrent),
    lastDate: today,
  };

  localStorage.setItem(PRAYER_STORAGE_KEYS.PRAYER_STREAK, JSON.stringify(newStreak));
  console.log('[PrayerStorage] Streak updated:', newStreak);

  return newStreak;
}

// ============================================
// SYNC TIMESTAMP
// ============================================

/**
 * Get the last sync timestamp
 */
export function getLastSyncTime(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(PRAYER_STORAGE_KEYS.LAST_SYNC);
}

/**
 * Set the last sync timestamp
 */
export function setLastSyncTime(timestamp: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PRAYER_STORAGE_KEYS.LAST_SYNC, timestamp);
}

// ============================================
// DEDUPLICATION
// ============================================

/**
 * Deduplicate cards by cloudId (keeps newest by updatedAt)
 */
export function deduplicatePrayerCards(): number {
  const cards = getAllPrayerCards();
  const seenCloudIds = new Map<string, UserPrayerCard>();
  const result: UserPrayerCard[] = [];
  let removedCount = 0;

  // Sort newest first
  const sorted = [...cards].sort((a, b) =>
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  for (const card of sorted) {
    if (card.cloudId && seenCloudIds.has(card.cloudId)) {
      removedCount++;
      console.log('[PrayerStorage] Removing duplicate card:', card.id, 'cloudId:', card.cloudId);
    } else {
      if (card.cloudId) {
        seenCloudIds.set(card.cloudId, card);
      }
      result.push(card);
    }
  }

  if (removedCount > 0) {
    // Re-sort by dateCreated ascending
    result.sort((a, b) =>
      new Date(a.dateCreated).getTime() - new Date(b.dateCreated).getTime()
    );
    localStorage.setItem(PRAYER_STORAGE_KEYS.PRAYER_CARDS, JSON.stringify(result));
    console.log('[PrayerStorage] Deduplication complete. Removed:', removedCount);
  }

  return removedCount;
}

// ============================================
// UTILITIES
// ============================================

/**
 * Get cards that need to be synced
 */
export function getUnsyncedCards(): UserPrayerCard[] {
  const cards = getAllPrayerCards();
  const lastSync = getLastSyncTime();

  return cards.filter(card => {
    if (!card.cloudId) return true; // Never synced
    if (card.deletedAt) return false; // Handle deletions separately
    if (!lastSync) return true;
    return new Date(card.updatedAt) > new Date(lastSync);
  });
}

/**
 * Get soft-deleted cards that have a cloudId (need cloud deletion)
 */
export function getDeletedCardsToSync(): UserPrayerCard[] {
  const cards = getAllPrayerCards();
  return cards.filter(c => c.deletedAt && c.cloudId);
}

/**
 * Get total active card count
 */
export function getTotalActiveCards(): number {
  return getActivePrayerCards().length;
}

/**
 * Get total answered card count
 */
export function getTotalAnsweredCards(): number {
  return getAnsweredPrayerCards().length;
}
