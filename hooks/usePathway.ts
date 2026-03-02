'use client';

import { useState, useEffect, useCallback } from 'react';
import type { PathwayProgress, PathwayViewState } from '@/types/pathway';
import {
  getPathwayProgress,
  initializePathway,
  toggleCheckpoint as storageToggle,
  isMonthUnlocked as checkMonthUnlocked,
  isMonthComplete as checkMonthComplete,
  getWeekStatus as storageWeekStatus,
  getProgressStats,
  type WeekStatus,
} from '@/lib/pathwayStorage';
import { syncPathway } from '@/lib/pathwaySync';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/lib/supabase';

// Leader roles that get full pathway access regardless of group membership
const LEADER_ROLES = ['dna_leader', 'church_leader', 'admin'];

export interface UsePathwayReturn {
  progress: PathwayProgress | null;
  viewState: PathwayViewState;
  stats: {
    totalCheckpoints: number;
    completedCheckpoints: number;
    percentage: number;
    completedWeeks: number;
    totalWeeks: number;
  };
  isLeader: boolean;
  isInGroup: boolean;        // true once we confirm active group membership
  groupCheckLoading: boolean; // true while the membership query is in-flight

  // Navigation
  navigateToMain: () => void;
  navigateToPhase: (phaseId: number) => void;
  navigateToWeek: (weekNumber: number) => void;

  // Checkpoint actions
  toggleCheckpoint: (weekNumber: number, checkpointId: string) => void;

  // Unlock checks
  isMonthUnlocked: (month: 1 | 2 | 3) => boolean;
  isMonthComplete: (month: 1 | 2 | 3) => boolean;
  getWeekStatus: (weekNumber: number) => WeekStatus;

  // Refresh
  refresh: () => void;
}

export function usePathway(): UsePathwayReturn {
  const { user, profile } = useAuth();
  const [progress, setProgress] = useState<PathwayProgress | null>(null);
  const [viewState, setViewState] = useState<PathwayViewState>({ view: 'main' });
  const [stats, setStats] = useState({
    totalCheckpoints: 0,
    completedCheckpoints: 0,
    percentage: 0,
    completedWeeks: 0,
    totalWeeks: 12,
  });
  const [isInGroup, setIsInGroup] = useState(false);
  const [groupCheckLoading, setGroupCheckLoading] = useState(true);

  // Determine if user is a leader — gets full pathway access regardless of group
  const isLeader = !!profile?.role && LEADER_ROLES.includes(profile.role as string);

  // Load state from localStorage
  const loadState = useCallback(() => {
    let data = getPathwayProgress();
    if (!data) {
      data = initializePathway();
    }
    setProgress(data);
    setStats(getProgressStats());
  }, []);

  // Initial load
  useEffect(() => {
    loadState();
  }, [loadState]);

  // Check if disciple is in an active DNA group
  // Leaders skip this — they always see the full pathway
  useEffect(() => {
    // No user (logged out) — show the no-group gate
    if (!user) {
      setIsInGroup(false);
      setGroupCheckLoading(false);
      return;
    }

    if (isLeader) {
      setIsInGroup(true);
      setGroupCheckLoading(false);
      return;
    }

    const discipleId = (profile as Record<string, unknown> | null)?.disciple_id as string | null | undefined;
    if (!profile) {
      // Still loading profile — keep groupCheckLoading true
      return;
    }

    if (!discipleId) {
      // Profile loaded but no disciple_id — not linked to a group
      setIsInGroup(false);
      setGroupCheckLoading(false);
      return;
    }

    // Check for active group_disciples membership
    void (async () => {
      try {
        const { count } = await supabase
          .from('group_disciples')
          .select('group_id', { count: 'exact', head: true })
          .eq('disciple_id', discipleId)
          .eq('current_status', 'active');
        setIsInGroup((count ?? 0) > 0);
      } catch {
        setIsInGroup(false);
      } finally {
        setGroupCheckLoading(false);
      }
    })();
  }, [user, isLeader, profile]);

  // Sync to Supabase on mount if logged in (fire-and-forget)
  useEffect(() => {
    if (user) {
      syncPathway(user);
    }
  }, [user]);

  // Navigation
  const navigateToMain = useCallback(() => {
    setViewState({ view: 'main' });
  }, []);

  const navigateToPhase = useCallback((phaseId: number) => {
    setViewState({ view: 'phase-detail', selectedPhase: phaseId });
  }, []);

  const navigateToWeek = useCallback((weekNumber: number) => {
    // Only update the view — don't touch the progress pointer (currentWeek).
    // The progress pointer should only advance via toggleCheckpoint / markAutoCheckpoint.
    setViewState({ view: 'week-detail', selectedWeek: weekNumber });
  }, []);

  // Checkpoint toggle — sync to Supabase after each toggle (fire-and-forget)
  const toggleCheckpoint = useCallback((weekNumber: number, checkpointId: string) => {
    storageToggle(weekNumber, checkpointId);
    loadState();
    if (user) {
      syncPathway(user);
    }
  }, [loadState, user]);

  // Refresh
  const refresh = useCallback(() => {
    loadState();
  }, [loadState]);

  // Month unlock — leaders bypass the completion gate entirely
  const isMonthUnlocked = useCallback((month: 1 | 2 | 3): boolean => {
    if (isLeader) return true;
    return checkMonthUnlocked(month);
  }, [isLeader]);

  return {
    progress,
    viewState,
    stats,
    isLeader,
    isInGroup,
    groupCheckLoading,
    navigateToMain,
    navigateToPhase,
    navigateToWeek,
    toggleCheckpoint,
    isMonthUnlocked,
    isMonthComplete: checkMonthComplete,
    getWeekStatus: storageWeekStatus,
    refresh,
  };
}
