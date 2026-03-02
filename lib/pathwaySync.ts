/**
 * Pathway Sync — Push 90-Day Toolkit progress to Supabase
 *
 * Syncs two things:
 *   1. disciple_toolkit_progress  — current week/month, month completion dates, unlock flags
 *   2. disciple_checkpoint_completions — individual checkpoint completions (by checkpoint_key)
 *
 * Push-only, fire-and-forget. localStorage is the source of truth on-device.
 * Supabase is the source of truth for leader visibility in DNA Hub.
 *
 * Follows the same pattern as assessmentSync.ts.
 */

import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import {
  getPathwayProgress,
  isMonthComplete,
} from './pathwayStorage';
import { getAllWeeks } from './pathwayData';

// Uses the shared Supabase client (from @/lib/supabase) which carries the
// user's active Auth session — required for RLS to allow writes.
// A standalone createClient() would have no JWT and fail silently.

// ============================================
// SYNC TOOLKIT PROGRESS
// ============================================

/**
 * Upsert the disciple's overall toolkit progress row.
 * Tracks current week/month position and month completion dates.
 */
export async function syncToolkitProgress(
  user: User
): Promise<{ success: boolean; error: string | null }> {
  const progress = getPathwayProgress();
  if (!progress) return { success: false, error: 'No pathway progress found' };

  // Determine current month from current week
  const currentWeek = progress.currentWeek || 1;
  const currentMonth = currentWeek <= 4 ? 1 : currentWeek <= 8 ? 2 : 3;

  // Check month completions
  const month1Done = isMonthComplete(1);
  const month2Done = isMonthComplete(2);
  const month3Done = isMonthComplete(3);

  try {
    const { error } = await supabase
      .from('disciple_toolkit_progress')
      .upsert(
        {
          account_id: user.id,
          current_week: currentWeek,
          current_month: currentMonth,
          month_1_unlocked: true,
          month_2_unlocked: month1Done,
          month_3_unlocked: month2Done,
          started_at: progress.startedAt,
          month_1_completed_at: month1Done
            ? (progress.weeks.flatMap(w => w.checkpoints)
                .filter(c => c.completed && c.completedAt)
                .sort((a, b) => (a.completedAt! > b.completedAt! ? 1 : -1))
                .find(() => true)?.completedAt ?? null)
            : null,
          month_2_completed_at: month2Done
            ? getMonthCompletedAt(progress, 2)
            : null,
          month_3_completed_at: month3Done
            ? getMonthCompletedAt(progress, 3)
            : null,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'account_id',
          ignoreDuplicates: false,
        }
      );

    if (error) {
      console.error('[PathwaySync] Toolkit progress upsert error:', error);
      return { success: false, error: error.message };
    }

    console.log('[PathwaySync] Synced toolkit progress for', user.id);
    return { success: true, error: null };
  } catch (err) {
    console.error('[PathwaySync] Unexpected error:', err);
    return { success: false, error: String(err) };
  }
}

// ============================================
// SYNC CHECKPOINT COMPLETIONS
// ============================================

/**
 * Upsert all completed checkpoints from localStorage to Supabase.
 * Uses checkpoint_key (string) since the app and DB seed use different IDs.
 * Skips already-completed checkpoints (idempotent).
 */
export async function syncCheckpointCompletions(
  user: User
): Promise<{ success: boolean; synced: number; error: string | null }> {
  const progress = getPathwayProgress();
  if (!progress) return { success: false, synced: 0, error: 'No pathway progress found' };

  // Build list of completed checkpoints with their week context
  const completed: Array<{
    account_id: string;
    checkpoint_key: string;
    week_number: number;
    completed_at: string;
    marked_by: string;
  }> = [];

  for (const weekProgress of progress.weeks) {
    for (const cp of weekProgress.checkpoints) {
      if (cp.completed && cp.completedAt) {
        completed.push({
          account_id: user.id,
          checkpoint_key: cp.checkpointId,
          week_number: weekProgress.weekNumber,
          completed_at: cp.completedAt,
          marked_by: 'self',
        });
      }
    }
  }

  if (completed.length === 0) {
    return { success: true, synced: 0, error: null };
  }

  try {
    const { error } = await supabase
      .from('disciple_checkpoint_completions')
      .upsert(completed, {
        onConflict: 'account_id,checkpoint_key',
        ignoreDuplicates: true, // Don't overwrite existing completions
      });

    if (error) {
      console.error('[PathwaySync] Checkpoint completions upsert error:', error);
      return { success: false, synced: 0, error: error.message };
    }

    console.log(`[PathwaySync] Synced ${completed.length} checkpoints for`, user.id);
    return { success: true, synced: completed.length, error: null };
  } catch (err) {
    console.error('[PathwaySync] Unexpected error:', err);
    return { success: false, synced: 0, error: String(err) };
  }
}

// ============================================
// FULL SYNC (both progress + checkpoints)
// ============================================

/**
 * Fire-and-forget full sync. Call after checkpoint toggle or on app load.
 * Non-blocking — errors are logged but not thrown.
 */
export function syncPathway(user: User): void {
  Promise.all([
    syncToolkitProgress(user),
    syncCheckpointCompletions(user),
  ]).catch(err => {
    console.error('[PathwaySync] Sync failed:', err);
  });
}

// ============================================
// HELPERS
// ============================================

/**
 * Find the latest completedAt timestamp among all checkpoints in a given month.
 * Used to set month_X_completed_at.
 */
function getMonthCompletedAt(
  progress: ReturnType<typeof getPathwayProgress>,
  month: 1 | 2 | 3
): string | null {
  if (!progress) return null;

  const allWeeks = getAllWeeks();
  const monthWeeks = allWeeks.filter(w => w.month === month);

  let latest: string | null = null;

  for (const weekDef of monthWeeks) {
    const weekProgress = progress.weeks.find(w => w.weekNumber === weekDef.weekNumber);
    if (!weekProgress) continue;

    for (const cp of weekProgress.checkpoints) {
      if (cp.completed && cp.completedAt) {
        if (!latest || cp.completedAt > latest) {
          latest = cp.completedAt;
        }
      }
    }
  }

  return latest;
}
