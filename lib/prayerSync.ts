/**
 * Prayer Cards Sync - Two-way sync between localStorage and ARK Supabase
 *
 * TODO: Update table references for ARK schema:
 * - ARK may use prayer_cards table (not disciple_prayer_cards)
 * - ARK uses user_id from auth.users / profiles (not account_id)
 * - RPC function name may differ from DNA Hub
 */

import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import {
  getAllPrayerCards,
  getPrayerCard,
  updatePrayerCard,
  hardDeletePrayerCard,
  getDeletedLog,
  removeFromDeletedLog,
  getLastSyncTime,
  setLastSyncTime,
  deduplicatePrayerCards,
  saveCardsDirect,
  updateCardCloudMetadata,
} from './prayerStorage';
import type { UserPrayerCard } from './prayerData';

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
    console.warn('[PrayerSync] Missing Supabase credentials');
    return null;
  }

  supabaseClient = createClient(url, anonKey);
  return supabaseClient;
}

// ============================================
// TYPES
// ============================================

export interface CloudPrayerCard {
  id: string; // UUID
  account_id: string; // disciple_app_accounts.id (was user_id)
  local_id: string;
  title: string;
  details: string | null;
  scripture: string | null;
  photo_url: string | null;
  status: 'active' | 'answered';
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  date_answered: string | null;
  testimony: string | null;
  prayer_count: number;
  last_prayed_at: string | null;
}

export interface PrayerSyncResult {
  success: boolean;
  pushed: number;
  pulled: number;
  deleted: number;
  linked: number;
  errors: string[];
  lastSyncTimestamp: string;
}

// ============================================
// PUSH (Local → Cloud)
// ============================================

/**
 * Push local prayer cards to cloud
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
    const allCards = getAllPrayerCards();
    const lastSync = getLastSyncTime();

    // Only push cards that need syncing
    const cardsToPush = allCards.filter(card => {
      if (!card.cloudId) return true; // Never synced
      if (card.deletedAt) return false; // Handle deletions separately
      if (!lastSync) return true;
      return new Date(card.updatedAt) > new Date(lastSync);
    });

    // Get soft-deleted cards that have cloudIds
    const deletedCards = allCards.filter(c => c.deletedAt && c.cloudId);

    let synced = 0;
    let linked = 0;
    let deleted = 0;

    // Push active cards in batches
    for (let i = 0; i < cardsToPush.length; i += SYNC_BATCH_SIZE) {
      const batch = cardsToPush.slice(i, i + SYNC_BATCH_SIZE);
      const results = await Promise.all(batch.map(card => pushCard(supabase, user.id, card)));

      for (const result of results) {
        if (result.success) {
          if (result.isNew) synced++;
          else linked++;
        }
      }
    }

    // Sync deletions
    for (let i = 0; i < deletedCards.length; i += SYNC_BATCH_SIZE) {
      const batch = deletedCards.slice(i, i + SYNC_BATCH_SIZE);
      const results = await Promise.all(batch.map(card => softDeleteInCloud(supabase, user.id, card)));
      deleted += results.filter(r => r).length;
    }

    console.log(`[PrayerSync] Push complete: ${synced} created, ${linked} linked, ${deleted} deleted`);
    return { synced, linked, deleted, error: null };
  } catch (error) {
    console.error('[PrayerSync] Push error:', error);
    return { synced: 0, linked: 0, deleted: 0, error: String(error) };
  }
}

/**
 * Push a single card to cloud using upsert RPC
 * Uses DNA Hub's upsert_prayer_card function with account_id
 */
async function pushCard(
  supabase: SupabaseClient,
  accountId: string,
  card: UserPrayerCard
): Promise<{ success: boolean; isNew: boolean; cloudId?: string }> {
  try {
    const { data, error } = await supabase.rpc('upsert_prayer_card', {
      p_account_id: accountId,
      p_local_id: card.id,
      p_title: card.title,
      p_details: card.details || null,
      p_scripture: null, // Not used in current app version
      p_status: card.status,
      p_prayer_count: card.prayerCount || 0,
      p_date_answered: card.dateAnswered || null,
      p_testimony: card.testimony || null,
      p_created_at: card.dateCreated,
      p_updated_at: card.updatedAt,
    });

    if (error) {
      console.error('[PrayerSync] Upsert error:', error);
      return { success: false, isNew: false };
    }

    // RPC returns UUID string directly
    if (data) {
      const cloudId = data as string;
      const isNew = !card.cloudId;

      // Update local card with cloud metadata
      updateCardCloudMetadata(card.id, cloudId);

      return { success: true, isNew, cloudId };
    }

    return { success: false, isNew: false };
  } catch (err) {
    console.error('[PrayerSync] Error pushing card:', card.id, err);
    return { success: false, isNew: false };
  }
}

/**
 * Soft delete card in cloud
 * Uses DNA Hub's disciple_prayer_cards table with account_id
 */
async function softDeleteInCloud(
  supabase: SupabaseClient,
  accountId: string,
  card: UserPrayerCard
): Promise<boolean> {
  try {
    if (!card.cloudId) return false;

    const { error } = await supabase
      .from('disciple_prayer_cards')
      .update({ deleted_at: card.deletedAt })
      .eq('id', card.cloudId)
      .eq('account_id', accountId);

    if (error) {
      console.error('[PrayerSync] Error soft deleting:', error);
      return false;
    }

    // Remove from local storage completely
    hardDeletePrayerCard(card.id);
    removeFromDeletedLog(card.cloudId);

    return true;
  } catch (err) {
    console.error('[PrayerSync] Error soft deleting card:', err);
    return false;
  }
}

// ============================================
// PULL (Cloud → Local)
// ============================================

/**
 * Pull cards from cloud to local
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
    const localCards = getAllPrayerCards();
    const deletedLog = getDeletedLog();
    const lastSync = getLastSyncTime();

    // Build lookup maps
    const localByCloudId = new Map<string, UserPrayerCard>();
    const localByLocalId = new Map<string, UserPrayerCard>();

    for (const card of localCards) {
      if (card.cloudId) {
        localByCloudId.set(card.cloudId, card);
      }
      localByLocalId.set(card.id, card);
    }

    // Single query: fetch all cards (active + deleted) to avoid a second round-trip
    let query = supabase
      .from('disciple_prayer_cards')
      .select('*')
      .eq('account_id', user.id)
      .order('created_at', { ascending: true });

    // Incremental sync — on first visit (no lastSync) this fetches everything once
    if (lastSync) {
      query = query.gte('updated_at', lastSync);
    }

    const { data: allCloudCards, error } = await query;

    if (error) throw error;

    const cloudCards = (allCloudCards || []).filter(c => !c.deleted_at);
    const deletedCloudCards = (allCloudCards || []).filter(c => c.deleted_at);

    let synced = 0;
    let updated = 0;
    let skipped = 0;

    for (const cloudCard of cloudCards) {
      // Skip if deleted locally
      if (deletedLog.includes(cloudCard.id)) {
        skipped++;
        continue;
      }

      // Try to find local card by cloudId first
      let localCard = localByCloudId.get(cloudCard.id);

      // If not found, try by local_id
      if (!localCard && cloudCard.local_id) {
        localCard = localByLocalId.get(cloudCard.local_id);
        if (localCard) {
          // Link local card to cloud
          updateCardCloudMetadata(localCard.id, cloudCard.id);
          localByCloudId.set(cloudCard.id, localCard);
        }
      }

      if (localCard) {
        // Card exists - update if cloud is newer
        const localUpdated = new Date(localCard.updatedAt);
        const cloudUpdated = new Date(cloudCard.updated_at);

        if (cloudUpdated > localUpdated) {
          updatePrayerCard(localCard.id, formatCardFromCloud(cloudCard));
          updated++;
        }
      } else {
        // Create new local card
        const newCard = createCardFromCloud(cloudCard);
        const cards = getAllPrayerCards();
        cards.push(newCard);
        saveCardsDirect(cards);
        localByCloudId.set(cloudCard.id, newCard);
        synced++;
      }
    }

    // Handle cloud deletions inline — no extra round-trip needed
    for (const cloudCard of deletedCloudCards) {
      const localCard = localByCloudId.get(cloudCard.id);
      if (localCard && !localCard.deletedAt) {
        hardDeletePrayerCard(localCard.id);
        console.log('[PrayerSync] Card deleted in cloud, removing locally:', cloudCard.id);
      }
    }

    console.log(`[PrayerSync] Pull complete: ${synced} new, ${updated} updated, ${skipped} skipped`);
    return { synced, updated, skipped, error: null };
  } catch (error) {
    console.error('[PrayerSync] Pull error:', error);
    return { synced: 0, updated: 0, skipped: 0, error: String(error) };
  }
}

/**
 * Format cloud card for local storage
 */
function formatCardFromCloud(cloudCard: CloudPrayerCard): Partial<UserPrayerCard> {
  return {
    cloudId: cloudCard.id,
    title: cloudCard.title,
    details: cloudCard.details,
    status: cloudCard.status,
    dateCreated: cloudCard.created_at,
    updatedAt: cloudCard.updated_at,
    dateAnswered: cloudCard.date_answered,
    testimony: cloudCard.testimony,
    prayerCount: cloudCard.prayer_count,
  };
}

/**
 * Create new local card from cloud card
 */
function createCardFromCloud(cloudCard: CloudPrayerCard): UserPrayerCard {
  return {
    id: cloudCard.local_id || `cloud_${cloudCard.id}`,
    cloudId: cloudCard.id,
    title: cloudCard.title,
    details: cloudCard.details,
    status: cloudCard.status,
    dateCreated: cloudCard.created_at,
    updatedAt: cloudCard.updated_at,
    deletedAt: null,
    dateAnswered: cloudCard.date_answered,
    testimony: cloudCard.testimony,
    prayerCount: cloudCard.prayer_count,
  };
}

// ============================================
// MAIN SYNC FUNCTION
// ============================================

/**
 * Full two-way sync
 */
export async function syncPrayerCards(user: User): Promise<PrayerSyncResult> {
  console.log(`[PrayerSync] Starting two-way sync (v${SYNC_VERSION})...`);

  const errors: string[] = [];

  // Pre-sync deduplication
  const preCleanup = deduplicatePrayerCards();
  if (preCleanup > 0) {
    console.log('[PrayerSync] Pre-sync cleanup removed', preCleanup, 'duplicates');
  }

  // Push and pull in parallel — push only writes, pull only reads, no conflict
  const [pushResult, pullResult] = await Promise.all([
    pushToCloud(user),
    pullFromCloud(user),
  ]);

  if (pushResult.error) errors.push(`Push: ${pushResult.error}`);
  if (pullResult.error) errors.push(`Pull: ${pullResult.error}`);

  // Post-sync deduplication
  deduplicatePrayerCards();

  // Update last sync time
  const now = new Date().toISOString();
  setLastSyncTime(now);

  console.log('[PrayerSync] Two-way sync complete');

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
 * Manual sync trigger
 */
export async function manualPrayerSync(user: User | null): Promise<PrayerSyncResult> {
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

  return syncPrayerCards(user);
}

/**
 * Get sync status info
 */
export function getPrayerSyncStatus(): {
  version: string;
  lastSync: string | null;
  localCardCount: number;
} {
  const cards = getAllPrayerCards();
  return {
    version: SYNC_VERSION,
    lastSync: getLastSyncTime(),
    localCardCount: cards.filter(c => !c.deletedAt).length,
  };
}
