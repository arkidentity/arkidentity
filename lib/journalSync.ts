/**
 * Journal Sync - Two-way sync between localStorage and ARK Supabase
 *
 * TODO: Update table references for ARK schema:
 * - ARK uses journal_entries table (not disciple_journal_entries)
 * - ARK uses user_id from auth.users / profiles (not account_id)
 * - RPC function name may differ from DNA Hub
 *
 * Key sync features:
 * 1. RPC returns UUID string directly, not object array
 * 2. Match by cloudId, then local_id, then content (triple deduplication)
 * 3. Run deduplication before AND after sync
 * 4. Incremental push/pull using lastSyncTimestamp
 * 5. Soft deletes with deleted_at for cross-device visibility
 */

import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import {
  getJournalEntries,
  saveJournalEntry,
  updateJournalEntry,
  getDeletedLog,
  removeFromDeletedLog,
  hardDeleteEntry,
  getLastSyncTime,
  setLastSyncTime,
  getDeviceId,
  updateEntryCloudMetadata,
} from './journalStorage';
import type { JournalEntry, CloudJournalEntry, SyncResult } from '@/types/journal';

const SYNC_VERSION = '1.0.0';
const SYNC_BATCH_SIZE = 5;

// ============================================
// SUPABASE CLIENT
// ============================================

let supabaseClient: SupabaseClient | null = null;

/**
 * Initialize or get Supabase client
 */
export function getSupabase(): SupabaseClient | null {
  if (supabaseClient) return supabaseClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    console.warn('[Sync] Missing Supabase credentials');
    return null;
  }

  supabaseClient = createClient(url, anonKey);
  return supabaseClient;
}

// ============================================
// PUSH (Local → Cloud)
// ============================================

/**
 * Push local journal entries to cloud using upsert RPC
 * Uses the corrected RPC that matches by local_id and content (without created_at)
 */
export async function pushToCloud(user: User): Promise<{
  synced: number;
  linked: number;
  deleted: number;
  error: string | null;
}> {
  const supabase = getSupabase();
  if (!supabase) {
    return { synced: 0, linked: 0, deleted: 0, error: 'Supabase not initialized' };
  }

  try {
    const allEntries = getJournalEntries();
    const lastSync = getLastSyncTime();

    // Only push entries that need syncing:
    // 1. No cloudId (never synced)
    // 2. Updated after last sync
    const entriesToPush = allEntries.filter(entry => {
      if (!entry.cloudId) return true; // Never synced
      if (entry.deletedAt) return false; // Handle deletions separately
      if (!lastSync) return true; // No last sync, push all
      return new Date(entry.updatedAt) > new Date(lastSync);
    });

    // Get soft-deleted entries that have cloudIds (need to sync deletion)
    const deletedEntries = allEntries.filter(e => e.deletedAt && e.cloudId);

    let synced = 0;
    let linked = 0;
    let deleted = 0;

    // Push active entries in batches
    for (let i = 0; i < entriesToPush.length; i += SYNC_BATCH_SIZE) {
      const batch = entriesToPush.slice(i, i + SYNC_BATCH_SIZE);
      const results = await Promise.all(batch.map(entry => pushEntry(supabase, user.id, entry)));

      for (const result of results) {
        if (result.success) {
          if (result.isNew) synced++;
          else linked++;
        }
      }
    }

    // Sync deletions (soft delete in cloud)
    for (let i = 0; i < deletedEntries.length; i += SYNC_BATCH_SIZE) {
      const batch = deletedEntries.slice(i, i + SYNC_BATCH_SIZE);
      const results = await Promise.all(batch.map(entry => softDeleteInCloud(supabase, user.id, entry)));
      deleted += results.filter(r => r).length;
    }

    console.log(`[Sync] Push complete: ${synced} created, ${linked} linked, ${deleted} deleted`);
    return { synced, linked, deleted, error: null };
  } catch (error) {
    console.error('[Sync] Push error:', error);
    return { synced: 0, linked: 0, deleted: 0, error: String(error) };
  }
}

/**
 * Push a single entry to cloud using upsert RPC
 * Uses DNA Hub's upsert_journal_entry function with account_id
 */
async function pushEntry(
  supabase: SupabaseClient,
  accountId: string,
  entry: JournalEntry
): Promise<{ success: boolean; isNew: boolean; cloudId?: string }> {
  try {
    const { data, error } = await supabase.rpc('upsert_journal_entry', {
      p_account_id: accountId,
      p_local_id: entry.localId || entry.id.toString(),
      p_scripture: entry.scripture || '',
      p_scripture_passage: entry.scripturePassage || null,
      p_head: entry.head || '',
      p_heart: entry.heart || '',
      p_hands: entry.hands || '',
      p_bible_version_id: entry.bibleVersion || 111,
      p_created_at: entry.createdAt,
      p_updated_at: entry.updatedAt || entry.createdAt,
    });

    if (error) {
      console.error('[Sync] Upsert error:', error);
      return { success: false, isNew: false };
    }

    // RPC returns UUID string directly (not array of objects)
    if (data) {
      const cloudId = data as string;
      const isNew = !entry.cloudId;

      // Update local entry with cloud metadata
      updateEntryCloudMetadata(entry.id, cloudId, null);

      return { success: true, isNew, cloudId };
    }

    return { success: false, isNew: false };
  } catch (err) {
    console.error('[Sync] Error pushing entry:', entry.id, err);
    return { success: false, isNew: false };
  }
}

/**
 * Soft delete entry in cloud (sets deleted_at)
 * Uses DNA Hub's disciple_journal_entries table with account_id
 */
async function softDeleteInCloud(
  supabase: SupabaseClient,
  accountId: string,
  entry: JournalEntry
): Promise<boolean> {
  try {
    if (!entry.cloudId) return false;

    const { error } = await supabase
      .from('disciple_journal_entries')
      .update({ deleted_at: entry.deletedAt })
      .eq('id', entry.cloudId)
      .eq('account_id', accountId);

    if (error) {
      console.error('[Sync] Error soft deleting:', error);
      return false;
    }

    // Entry is now synced as deleted, remove from local storage completely
    hardDeleteEntry(entry.id);
    removeFromDeletedLog(entry.cloudId);

    return true;
  } catch (err) {
    console.error('[Sync] Error soft deleting entry:', err);
    return false;
  }
}

// ============================================
// PULL (Cloud → Local)
// ============================================

/**
 * Pull entries from cloud to local
 * Uses incremental sync based on lastSyncTimestamp
 */
export async function pullFromCloud(user: User): Promise<{
  synced: number;
  updated: number;
  skipped: number;
  error: string | null;
}> {
  const supabase = getSupabase();
  if (!supabase) {
    return { synced: 0, updated: 0, skipped: 0, error: 'Supabase not initialized' };
  }

  try {
    const localEntries = getJournalEntries();
    const deletedLog = getDeletedLog();
    const lastSync = getLastSyncTime();

    // Build lookup maps
    const localByCloudId = new Map<string, JournalEntry>();
    const localByLocalId = new Map<string, JournalEntry>();

    for (const entry of localEntries) {
      if (entry.cloudId) {
        localByCloudId.set(entry.cloudId, entry);
      }
      localByLocalId.set(entry.localId || entry.id.toString(), entry);
    }

    // Single query: fetch all entries (active + deleted) to avoid a second round-trip
    let query = supabase
      .from('disciple_journal_entries')
      .select('*')
      .eq('account_id', user.id)
      .order('created_at', { ascending: true });

    // Incremental sync: only fetch entries updated since last sync
    if (lastSync) {
      query = query.gte('updated_at', lastSync);
    }

    const { data: allCloudEntries, error } = await query;

    if (error) throw error;

    const cloudEntries = (allCloudEntries || []).filter(e => !e.deleted_at);
    const deletedCloudEntries = (allCloudEntries || []).filter(e => e.deleted_at);

    let synced = 0;
    let updated = 0;
    let skipped = 0;

    for (const cloudEntry of cloudEntries) {
      // Skip if deleted locally
      if (deletedLog.includes(cloudEntry.id)) {
        skipped++;
        continue;
      }

      // Try to find local entry by cloudId first
      let localEntry = localByCloudId.get(cloudEntry.id);

      // If not found, try by local_id
      if (!localEntry && cloudEntry.local_id) {
        localEntry = localByLocalId.get(cloudEntry.local_id);
        if (localEntry) {
          // Link local entry to cloud entry
          updateEntryCloudMetadata(localEntry.id, cloudEntry.id, null);
          localByCloudId.set(cloudEntry.id, localEntry);
        }
      }

      if (localEntry) {
        // Entry exists - update if cloud is newer
        const localUpdated = new Date(localEntry.updatedAt || localEntry.createdAt);
        const cloudUpdated = new Date(cloudEntry.updated_at);

        if (cloudUpdated > localUpdated) {
          const updates = formatEntryFromCloud(cloudEntry);
          updateJournalEntry(localEntry.id, {
            ...updates,
            cloudId: cloudEntry.id,
          });
          updated++;
        }
      } else {
        // Try content-based matching for entries without local_id
        const existingByContent = findLocalEntryByContent(
          localEntries,
          cloudEntry.scripture,
          cloudEntry.head,
          cloudEntry.heart,
          cloudEntry.hands
        );

        if (existingByContent) {
          // Link existing entry to cloud
          updateEntryCloudMetadata(existingByContent.id, cloudEntry.id, null);
        } else {
          // Create new local entry
          const newEntry = createEntryFromCloud(cloudEntry);
          saveJournalEntry(newEntry);
          localByCloudId.set(cloudEntry.id, newEntry as JournalEntry);
          synced++;
        }
      }
    }

    // Handle cloud deletions inline — no extra round-trip needed
    for (const cloudEntry of deletedCloudEntries) {
      const localEntry = localByCloudId.get(cloudEntry.id);
      if (localEntry && !localEntry.deletedAt) {
        hardDeleteEntry(localEntry.id);
        console.log('[Sync] Entry deleted in cloud, removing locally:', cloudEntry.id);
      }
    }

    console.log(`[Sync] Pull complete: ${synced} new, ${updated} updated, ${skipped} skipped`);
    return { synced, updated, skipped, error: null };
  } catch (error) {
    console.error('[Sync] Pull error:', error);
    return { synced: 0, updated: 0, skipped: 0, error: String(error) };
  }
}

/**
 * Find local entry by content match
 */
function findLocalEntryByContent(
  entries: JournalEntry[],
  scripture: string,
  head: string | null,
  heart: string | null,
  hands: string | null
): JournalEntry | undefined {
  return entries.find(
    e =>
      !e.deletedAt &&
      !e.cloudId &&
      e.scripture === scripture &&
      (e.head || '') === (head || '') &&
      (e.heart || '') === (heart || '') &&
      (e.hands || '') === (hands || '')
  );
}

/**
 * Format cloud entry for local storage
 */
function formatEntryFromCloud(cloudEntry: CloudJournalEntry): Partial<JournalEntry> {
  return {
    scripture: cloudEntry.scripture,
    scripturePassage: cloudEntry.scripture_passage || '',
    bibleVersion: cloudEntry.bible_version_id || 111,
    head: cloudEntry.head || '',
    heart: cloudEntry.heart || '',
    hands: cloudEntry.hands || '',
    createdAt: cloudEntry.created_at,
    updatedAt: cloudEntry.updated_at,
  };
}

/**
 * Create new local entry from cloud entry
 */
function createEntryFromCloud(cloudEntry: CloudJournalEntry): Omit<JournalEntry, 'id'> & { cloudId: string } {
  return {
    cloudId: cloudEntry.id,
    syncToken: null,
    localId: cloudEntry.local_id || `cloud_${cloudEntry.id}`,
    scripture: cloudEntry.scripture,
    scripturePassage: cloudEntry.scripture_passage || '',
    bibleVersion: cloudEntry.bible_version_id || 111,
    head: cloudEntry.head || '',
    heart: cloudEntry.heart || '',
    hands: cloudEntry.hands || '',
    createdAt: cloudEntry.created_at,
    updatedAt: cloudEntry.updated_at,
    deletedAt: null,
  };
}

// ============================================
// DEDUPLICATION
// ============================================

/**
 * Deduplicate local entries by cloudId
 * Keeps only the newest entry for each cloudId
 */
export function deduplicateLocalEntries(): number {
  const entries = getJournalEntries();
  const seenCloudIds = new Map<string, boolean>();
  const keepEntries: JournalEntry[] = [];
  let removedCount = 0;

  // Sort by updatedAt descending (newest first)
  const sortedEntries = [...entries].sort((a, b) => {
    const dateA = new Date(a.updatedAt || a.createdAt || 0);
    const dateB = new Date(b.updatedAt || b.createdAt || 0);
    return dateB.getTime() - dateA.getTime();
  });

  for (const entry of sortedEntries) {
    if (entry.cloudId) {
      if (seenCloudIds.has(entry.cloudId)) {
        removedCount++;
        console.log('[Sync] Removing duplicate with cloudId:', entry.cloudId);
      } else {
        seenCloudIds.set(entry.cloudId, true);
        keepEntries.push(entry);
      }
    } else {
      keepEntries.push(entry);
    }
  }

  if (removedCount > 0) {
    console.log('[Sync] Removed', removedCount, 'duplicate entries');
    // Re-sort by createdAt ascending
    keepEntries.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return dateA.getTime() - dateB.getTime();
    });
    // Save deduplicated entries
    if (typeof window !== 'undefined') {
      localStorage.setItem('ark_journal_entries', JSON.stringify(keepEntries));
    }
  }

  return removedCount;
}

// ============================================
// MAIN SYNC FUNCTION
// ============================================

/**
 * Full two-way sync
 */
export async function syncJournalEntries(user: User): Promise<SyncResult> {
  console.log(`[Sync] Starting two-way sync (v${SYNC_VERSION})...`);

  const errors: string[] = [];

  // Pre-sync deduplication
  const preCleanup = deduplicateLocalEntries();
  if (preCleanup > 0) {
    console.log('[Sync] Pre-sync cleanup removed', preCleanup, 'duplicates');
  }

  // Push and pull in parallel — push only writes, pull only reads, no conflict
  const [pushResult, pullResult] = await Promise.all([
    pushToCloud(user),
    pullFromCloud(user),
  ]);

  if (pushResult.error) errors.push(`Push: ${pushResult.error}`);
  if (pullResult.error) errors.push(`Pull: ${pullResult.error}`);

  // Post-sync deduplication
  deduplicateLocalEntries();

  // Update last sync time
  const now = new Date().toISOString();
  setLastSyncTime(now);

  console.log('[Sync] Two-way sync complete');

  return {
    success: errors.length === 0,
    pushed: pushResult.synced,
    pulled: pullResult.synced,
    deleted: pushResult.deleted,
    linked: pushResult.linked,
    errors,
    lastSyncTimestamp: now,
  };
}

/**
 * Manual sync trigger (for use with button press)
 */
export async function manualSync(user: User | null): Promise<SyncResult> {
  if (!user) {
    return {
      success: false,
      pushed: 0,
      pulled: 0,
      deleted: 0,
      linked: 0,
      errors: ['Not logged in'],
      lastSyncTimestamp: '',
    };
  }

  return syncJournalEntries(user);
}

/**
 * Get sync status info
 */
export function getSyncStatus(): {
  version: string;
  lastSync: string | null;
  deviceId: string;
  localEntryCount: number;
} {
  const entries = getJournalEntries();
  return {
    version: SYNC_VERSION,
    lastSync: getLastSyncTime(),
    deviceId: getDeviceId(),
    localEntryCount: entries.filter(e => !e.deletedAt).length,
  };
}
