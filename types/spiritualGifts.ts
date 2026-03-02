// ============================================
// SPIRITUAL GIFTS ASSESSMENT TYPES
// ============================================

export type GiftTier = 1 | 2 | 3;

export type Tier1Gift =
  | 'serving'
  | 'teaching'
  | 'encouraging'
  | 'giving'
  | 'administration'
  | 'mercy'
  | 'hospitality'
  | 'evangelism'
  | 'worship_music'
  | 'intercessory_prayer'
  | 'craftsmanship_arts';

export type Tier2Gift =
  | 'word_of_wisdom'
  | 'word_of_knowledge'
  | 'faith'
  | 'healing'
  | 'miracles'
  | 'prophecy'
  | 'discernment'
  | 'tongues'
  | 'interpretation';

export type Tier3Gift =
  | 'apostle'
  | 'prophet'
  | 'evangelist_calling'
  | 'pastor'
  | 'teacher_calling';

export type GiftCategory = Tier1Gift | Tier2Gift | Tier3Gift;

export type GiftQuestionType = 'likert' | 'multiple_choice';

// ============================================
// QUESTION TYPES
// ============================================

export interface GiftQuestion {
  id: number;                // 1-96
  tier: GiftTier;
  giftCategory: GiftCategory;
  questionText: string;
  questionType: GiftQuestionType;
  /** For multiple_choice questions, the choice options (a-d) */
  options?: {
    a: string;
    b: string;
    c: string;
    d: string;
  };
}

export interface GiftCategoryInfo {
  id: GiftCategory;
  label: string;
  tier: GiftTier;
  scripture: string;
  questionCount: number;
}

export interface TierInfo {
  tier: GiftTier;
  label: string;
  subtitle: string;
  description: string;
  giftCount: number;
  questionCount: number;
}

// ============================================
// RESPONSE / PROGRESS TYPES (localStorage)
// ============================================

/** Answer is 1-5 for likert, or 'a'|'b'|'c'|'d' for multiple_choice */
export type GiftAnswerValue = number | string;

export interface GiftScore {
  giftCategory: GiftCategory;
  label: string;
  tier: GiftTier;
  totalScore: number;
  maxPossible: number;
  percentage: number;
}

export interface TierResults {
  tier: GiftTier;
  primary: GiftScore;
  secondary: GiftScore;
  allScores: GiftScore[];
}

export interface SpiritualGiftsResponse {
  /** Map of question id → answer value */
  responses: Record<number, GiftAnswerValue>;
  /** Scores per gift category (calculated on submit) */
  giftScores: Record<string, GiftScore> | null;
  /** Top gifts per tier */
  tierResults: TierResults[] | null;
  /** Overall top 6 gifts across all tiers */
  topGifts: GiftScore[] | null;
  status: 'in_progress' | 'submitted';
  /** Current tier being answered (1, 2, or 3) */
  currentTier: GiftTier;
  /** Current question index within the shuffled order */
  currentQuestionIndex: number;
  /** Shuffled question order (question IDs) */
  questionOrder: number[];
  startedAt: string;
  submittedAt: string | null;
  /** For public users - captured email */
  email?: string;
  /** For public users - captured name */
  name?: string;
  /** Cloud sync fields */
  cloudId?: string;
  localId: string;
  syncToken?: string;
}

// ============================================
// VIEW STATE
// ============================================

export type GiftsView = 'welcome' | 'questions' | 'results';

// ============================================
// STORAGE KEYS
// ============================================

export const GIFTS_STORAGE_KEY = 'dna_spiritual_gifts' as const;
