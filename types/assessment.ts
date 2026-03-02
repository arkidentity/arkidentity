// ============================================
// ASSESSMENT QUESTION TYPES
// ============================================

export type AssessmentQuestionType = 'likert' | 'multiple_choice' | 'checkbox' | 'open_ended';

export type AssessmentCategoryId =
  | 'relationship_with_god'
  | 'spiritual_freedom'
  | 'identity_emotions'
  | 'relationships'
  | 'calling_purpose'
  | 'lifestyle_stewardship'
  | 'spiritual_fruit'
  | 'reflection';

/** Structured options for questions (stored as JSONB in DB) */
export interface AssessmentOptions {
  /** Choice labels for multiple_choice/checkbox, or undefined for likert/open_ended */
  choices?: string[];
  /** Endpoint labels for likert scale, e.g. {"1": "Not true of me", "5": "Very true of me"} */
  scale_labels?: Record<string, string>;
  /** Follow-up prompt displayed below the main answer widget, e.g. "Explain:" */
  follow_up?: string;
}

export interface AssessmentQuestion {
  id: number;               // 1-42 (matches sort_order from DB)
  category: AssessmentCategoryId;
  questionText: string;
  questionType: AssessmentQuestionType;
  options: AssessmentOptions | null; // structured options or null for plain open_ended
  fruitName?: string;       // For spiritual fruit questions (e.g. "Love", "Joy")
  maxScore: number | null;  // 5 for likert, N for scored multiple_choice, null for unscored
}

export interface AssessmentCategory {
  id: AssessmentCategoryId;
  label: string;
  description: string;
  questionCount: number;
}

// ============================================
// RESPONSE / PROGRESS TYPES (localStorage shape)
// ============================================

export type AssessmentType = 'week_1' | 'week_12';

/** Individual answer: number (1-5) for likert/scored multiple_choice, string for open_ended/unscored multiple_choice, string[] for checkbox */
export type AnswerValue = number | string | string[];

/** Follow-up text answers stored separately, keyed by question id */
export type FollowUpAnswers = Record<number, string>;

export interface AssessmentResponse {
  assessmentType: AssessmentType;
  /** Map of question id → answer value */
  responses: Record<number, AnswerValue>;
  /** Map of question id → follow-up text answer */
  followUps?: FollowUpAnswers;
  /** Average score per scored category (calculated on submit) */
  categoryScores: Record<string, number> | null;
  /** Overall average across all scored categories */
  overallScore: number | null;
  status: 'in_progress' | 'submitted';
  /** Which section (0-indexed) the user last viewed */
  currentSection: number;
  startedAt: string;
  submittedAt: string | null;
}

// ============================================
// COMPARISON DATA
// ============================================

export interface ComparisonData {
  week1: AssessmentResponse;
  week12: AssessmentResponse;
  categoryChanges: Record<string, { week1: number; week12: number; change: number }>;
  overallChange: number;
}

// ============================================
// VIEW STATE
// ============================================

export type AssessmentView = 'welcome' | 'questions' | 'results' | 'comparison';

// ============================================
// STORAGE KEYS
// ============================================

export const ASSESSMENT_STORAGE_KEYS = {
  WEEK_1: 'dna_life_assessment_week_1',
  WEEK_12: 'dna_life_assessment_week_12',
} as const;
