import type { PathwayProgress, WeekProgress, CheckpointProgress } from '@/types/pathway';
import { PATHWAY_STORAGE_KEYS } from '@/types/pathway';
import { getAllWeeks, getWeeksForMonth, getWeek } from './pathwayData';

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

// Data version — bump this to reset all pathway progress
// v2: removed auto-tracking, all checkpoints are now self-marked
// v3: removed "attended group meeting" checkpoints, added Q&A + listening prayer tools
const PATHWAY_DATA_VERSION = 3;
const VERSION_KEY = 'dna_pathway_version';

function checkVersion(): void {
  if (!isBrowser()) return;
  const stored = localStorage.getItem(VERSION_KEY);
  const currentVersion = String(PATHWAY_DATA_VERSION);
  if (stored === currentVersion) return; // already current

  // Safety check: if existing data has a weeks array with progress, NEVER wipe it
  // regardless of version — preserve any checkpoint progress the disciple has made
  const existingRaw = localStorage.getItem(PATHWAY_STORAGE_KEYS.PATHWAY_PROGRESS);
  if (existingRaw) {
    try {
      const existingData = JSON.parse(existingRaw);
      if (Array.isArray(existingData?.weeks) && existingData.weeks.length > 0) {
        // Data has real progress — just stamp the new version, never wipe
        localStorage.setItem(VERSION_KEY, currentVersion);
        return;
      }
    } catch {
      // Corrupt data — safe to clear
    }
  }

  // Only wipe if there's no meaningful progress data
  // (null version key = new user, or v1 = ancient incompatible schema)
  if (stored === '1' || stored === null) {
    localStorage.removeItem(PATHWAY_STORAGE_KEYS.PATHWAY_PROGRESS);
  }
  localStorage.setItem(VERSION_KEY, currentVersion);
}

// ============================================
// CORE CRUD
// ============================================

export function getPathwayProgress(): PathwayProgress | null {
  if (!isBrowser()) return null;
  checkVersion();
  try {
    const stored = localStorage.getItem(PATHWAY_STORAGE_KEYS.PATHWAY_PROGRESS);
    if (!stored) return null;
    return JSON.parse(stored) as PathwayProgress;
  } catch {
    return null;
  }
}

function saveProgress(progress: PathwayProgress): void {
  if (!isBrowser()) return;
  localStorage.setItem(PATHWAY_STORAGE_KEYS.PATHWAY_PROGRESS, JSON.stringify(progress));
}

export function initializePathway(): PathwayProgress {
  const existing = getPathwayProgress();
  if (existing) return existing;

  const progress: PathwayProgress = {
    startedAt: new Date().toISOString(),
    currentWeek: 1,
    weeks: [],
  };
  saveProgress(progress);
  return progress;
}

// ============================================
// WEEK PROGRESS
// ============================================

function ensureWeekProgress(progress: PathwayProgress, weekNumber: number): WeekProgress {
  let weekProgress = progress.weeks.find(w => w.weekNumber === weekNumber);
  if (!weekProgress) {
    const weekDef = getWeek(weekNumber);
    if (!weekDef) return { weekNumber, checkpoints: [] };

    weekProgress = {
      weekNumber,
      checkpoints: weekDef.checkpoints.map(cp => ({
        checkpointId: cp.id,
        completed: false,
        completedAt: null,
      })),
    };
    progress.weeks.push(weekProgress);
  }
  return weekProgress;
}

export function getWeekProgress(weekNumber: number): WeekProgress | null {
  const progress = getPathwayProgress();
  if (!progress) return null;
  return progress.weeks.find(w => w.weekNumber === weekNumber) || null;
}

// ============================================
// CHECKPOINT OPERATIONS
// ============================================

export function toggleCheckpoint(weekNumber: number, checkpointId: string): boolean {
  const progress = getPathwayProgress() || initializePathway();
  const weekProgress = ensureWeekProgress(progress, weekNumber);

  const checkpoint = weekProgress.checkpoints.find(c => c.checkpointId === checkpointId);
  if (!checkpoint) return false;

  checkpoint.completed = !checkpoint.completed;
  checkpoint.completedAt = checkpoint.completed ? new Date().toISOString() : null;

  // Auto-advance currentWeek when all checkpoints in this week are complete
  if (checkpoint.completed) {
    const weekDef = getWeek(weekNumber);
    if (weekDef) {
      const allComplete = weekDef.checkpoints.every(cpDef => {
        const cp = weekProgress.checkpoints.find(c => c.checkpointId === cpDef.id);
        return cp?.completed;
      });
      if (allComplete && progress.currentWeek === weekNumber && weekNumber < 12) {
        progress.currentWeek = weekNumber + 1;
      }
    }
  }

  saveProgress(progress);
  return checkpoint.completed;
}

export function markAutoCheckpoint(checkpointId: string): boolean {
  const progress = getPathwayProgress() || initializePathway();

  // Find which week this checkpoint belongs to
  const allWeeks = getAllWeeks();
  const weekDef = allWeeks.find(w => w.checkpoints.some(cp => cp.id === checkpointId));
  if (!weekDef) return false;

  const weekProgress = ensureWeekProgress(progress, weekDef.weekNumber);
  const checkpoint = weekProgress.checkpoints.find(c => c.checkpointId === checkpointId);
  if (!checkpoint) return false;

  // Idempotent: only mark if not already complete
  if (checkpoint.completed) return false;

  checkpoint.completed = true;
  checkpoint.completedAt = new Date().toISOString();

  // Auto-advance currentWeek when all checkpoints in this week are complete
  const allComplete = weekDef.checkpoints.every(cpDef => {
    const cp = weekProgress.checkpoints.find(c => c.checkpointId === cpDef.id);
    return cp?.completed;
  });
  if (allComplete && progress.currentWeek === weekDef.weekNumber && weekDef.weekNumber < 12) {
    progress.currentWeek = weekDef.weekNumber + 1;
  }

  saveProgress(progress);
  return true;
}

// ============================================
// MONTH UNLOCK LOGIC
// ============================================

export function isMonthComplete(month: 1 | 2 | 3): boolean {
  const progress = getPathwayProgress();
  if (!progress) return false;

  const monthWeeks = getWeeksForMonth(month);

  for (const weekDef of monthWeeks) {
    const weekProgress = progress.weeks.find(w => w.weekNumber === weekDef.weekNumber);
    if (!weekProgress) return false;

    for (const cpDef of weekDef.checkpoints) {
      const cp = weekProgress.checkpoints.find(c => c.checkpointId === cpDef.id);
      if (!cp || !cp.completed) return false;
    }
  }

  return true;
}

export function isMonthUnlocked(month: 1 | 2 | 3): boolean {
  if (month === 1) return true;
  return isMonthComplete((month - 1) as 1 | 2);
}

// ============================================
// WEEK STATUS
// ============================================

export type WeekStatus = 'complete' | 'in-progress' | 'not-started';

export function getWeekStatus(weekNumber: number): WeekStatus {
  const progress = getPathwayProgress();
  if (!progress) return 'not-started';

  const weekDef = getWeek(weekNumber);
  if (!weekDef) return 'not-started';

  // Check if month is unlocked
  if (!isMonthUnlocked(weekDef.month)) return 'not-started';

  const weekProgress = progress.weeks.find(w => w.weekNumber === weekNumber);
  if (!weekProgress) return 'not-started';

  const allComplete = weekDef.checkpoints.every(cpDef => {
    const cp = weekProgress.checkpoints.find(c => c.checkpointId === cpDef.id);
    return cp?.completed;
  });

  if (allComplete) return 'complete';

  const anyComplete = weekProgress.checkpoints.some(c => c.completed);
  if (anyComplete) return 'in-progress';

  return 'not-started';
}

// ============================================
// CURRENT WEEK
// ============================================

export function getCurrentWeek(): number {
  const progress = getPathwayProgress();
  return progress?.currentWeek || 1;
}

export function setCurrentWeek(week: number): void {
  const progress = getPathwayProgress();
  if (!progress) return;
  progress.currentWeek = week;
  saveProgress(progress);
}

// ============================================
// PROGRESS STATS
// ============================================

export function getProgressStats(): {
  totalCheckpoints: number;
  completedCheckpoints: number;
  percentage: number;
  completedWeeks: number;
  totalWeeks: number;
} {
  const progress = getPathwayProgress();
  const allWeeks = getAllWeeks();

  let totalCheckpoints = 0;
  let completedCheckpoints = 0;
  let completedWeeks = 0;

  for (const weekDef of allWeeks) {
    totalCheckpoints += weekDef.checkpoints.length;

    const weekProgress = progress?.weeks.find(w => w.weekNumber === weekDef.weekNumber);
    let weekComplete = true;

    for (const cpDef of weekDef.checkpoints) {
      const cp = weekProgress?.checkpoints.find(c => c.checkpointId === cpDef.id);
      if (cp?.completed) {
        completedCheckpoints++;
      } else {
        weekComplete = false;
      }
    }

    if (weekComplete && weekProgress) {
      completedWeeks++;
    }
  }

  return {
    totalCheckpoints,
    completedCheckpoints,
    percentage: totalCheckpoints > 0 ? Math.round((completedCheckpoints / totalCheckpoints) * 100) : 0,
    completedWeeks,
    totalWeeks: allWeeks.length,
  };
}
