// ============================================
// CHECKPOINT TYPES
// ============================================

export type CheckpointTrackingType = 'self-marked' | 'auto-tracked';

export type AutoTrackSource =
  | 'life-assessment'
  | 'journal-entry'
  | 'challenge-started'
  | 'prayer-card-created'
  | 'prayer-session-done'
  | 'spiritual-gifts'
  | 'testimony-created';

export interface CheckpointDefinition {
  id: string;
  label: string;
  trackingType: CheckpointTrackingType;
  autoTrackSource?: AutoTrackSource;
  toolLink?: {
    label: string;
    href: string;
  };
}

// ============================================
// WEEK / MONTH / PHASE TYPES
// ============================================

export interface WeekDefinition {
  weekNumber: number;
  month: 1 | 2 | 3;
  title: string;
  subtitle: string;
  teaching: string;
  checkpoints: CheckpointDefinition[];
  toolLinks?: {
    label: string;
    href: string;
  }[];
}

export interface MonthDefinition {
  month: 1 | 2 | 3;
  title: string;
  weeks: WeekDefinition[];
}

export interface PhaseDefinition {
  id: 1 | 2 | 3;
  title: string;
  subtitle: string;
  description: string;
  months?: MonthDefinition[];
}

// ============================================
// PROGRESS TYPES (localStorage shape)
// ============================================

export interface CheckpointProgress {
  checkpointId: string;
  completed: boolean;
  completedAt: string | null;
}

export interface WeekProgress {
  weekNumber: number;
  checkpoints: CheckpointProgress[];
}

export interface PathwayProgress {
  startedAt: string;
  currentWeek: number;
  weeks: WeekProgress[];
}

// ============================================
// STORAGE KEYS
// ============================================

export const PATHWAY_STORAGE_KEYS = {
  PATHWAY_PROGRESS: 'dna_pathway_progress',
} as const;

// ============================================
// VIEW STATE
// ============================================

export type PathwayView = 'main' | 'phase-detail' | 'week-detail';

export interface PathwayViewState {
  view: PathwayView;
  selectedPhase?: number;
  selectedWeek?: number;
}
