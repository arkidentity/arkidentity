/**
 * TypeScript interfaces for the 3D Journal feature
 */

// ============================================
// JOURNAL ENTRY TYPES
// ============================================

export interface JournalEntry {
  id: number;                    // Local timestamp-based ID
  cloudId: string | null;        // UUID from Supabase (null until synced)
  syncToken: string | null;      // For detecting content changes
  localId: string;               // Unique local identifier for sync matching

  // Scripture
  scripture: string;             // Reference (e.g., "John 3:16-17")
  scripturePassage: string;      // Full passage text with verse numbers
  bibleVersion: number;          // YouVersion version ID (111=NIV, etc.)

  // 3D Dimensions
  head: string;                  // HEAD: Information - What is this passage saying?
  heart: string;                 // HEART: Transformation - God, what are You saying to me?
  hands: string;                 // HANDS: Activation - What action should I take?

  // Timestamps
  createdAt: string;             // ISO timestamp
  updatedAt: string;             // ISO timestamp
  deletedAt: string | null;      // ISO timestamp for soft delete (null if active)
}

export interface JournalDraft {
  scripture: string;
  scripturePassage: string;
  bibleVersion: number;
  head: string;
  heart: string;
  hands: string;
  expandedDimension: DimensionType;
  timestamp: number;             // Unix timestamp for draft expiry check
  isEditing: boolean;
  editingEntryId: number | null;
}

export type DimensionType = 'head' | 'heart' | 'hands';

// ============================================
// BIBLE SELECTOR TYPES
// ============================================

export interface BibleVersion {
  id: number;
  name: string;
  abbreviation: string;
  language: 'en' | 'es';
}

export interface BibleBook {
  id: string;                    // USFM code (e.g., "MAT", "JHN")
  name: string;                  // Full name (e.g., "Matthew")
  chapters: number;              // Number of chapters
  testament: 'OT' | 'NT';
}

export interface ParsedVerse {
  num: number;
  text: string;
}

export interface BiblePassage {
  version: number;
  versionName: string;
  book: string;
  bookId: string;
  chapter: number;
  verseStart: number;
  verseEnd: number;
  usfm: string;                  // e.g., "JHN.3.16-17"
  reference: string;             // e.g., "John 3:16-17"
  content: string;               // Raw HTML from API
  formattedText: string;         // Plain text with verse numbers: [16] text [17] text
}

export interface BibleSelectorState {
  isOpen: boolean;
  screen: 'books' | 'chapter';
  version: number;
  expandedBook: string | null;
  selectedBook: BibleBook | null;
  selectedChapter: number | null;
  chapterVerses: ParsedVerse[];
  selectedStart: number | null;
  selectedEnd: number | null;
  loading: boolean;
  error: string | null;
}

// ============================================
// PASSAGE OF THE DAY TYPES
// ============================================

export interface PassageOfTheDay {
  reference: string;             // e.g., "Ephesians 1:3-10"
  theme: string;                 // e.g., "Blessed in Christ"
  category: string;              // e.g., "identity", "salvation", "faith"
  explanation: string;           // "What does this mean?" content
}

// ============================================
// CHALLENGE TYPES
// ============================================

export interface ChallengeTier {
  days: number;
  level: number;
  color: string;
  name: string;
  label: string;
  recommended?: boolean;
  hidden?: boolean;
}

export interface ChallengeRegistration {
  id: string;
  userId: string | null;
  challengeName: string;
  initialDays: number;
  currentDays: number;
  startDate: string;             // ISO date
  endDate: string;               // ISO date
  displayName: string;
  email: string;
  completed: boolean;
  badgeAwarded: boolean;
  createdAt: string;
}

export interface ChallengeProgress {
  registration: ChallengeRegistration | null;
  currentStreak: number;
  longestStreak: number;
  totalEntries: number;
  badges: string[];              // e.g., ["7day", "21day"]
}

export interface UserStreak {
  current: number;
  longest: number;
  lastDate: string | null;       // ISO date of last journal entry
}

export type ChallengePopupType =
  | 'invitation'                 // First entry, not registered
  | 'badge'                      // Completed tier, earned badge
  | 'upgrade'                    // 1 day before completion, offer next tier
  | 'milestone'                  // Special day (7, 14, 21, etc.)
  | 'halfway'                    // 50% progress
  | 'encouragement';             // Generic streak display

// ============================================
// SYNC TYPES
// ============================================

export interface SyncResult {
  success: boolean;
  pushed: number;
  pulled: number;
  deleted: number;
  linked: number;                // Entries linked by local_id match
  errors: string[];
  lastSyncTimestamp: string;
}

export interface CloudJournalEntry {
  id: string;                    // UUID
  account_id: string;            // disciple_app_accounts.id (was user_id)
  local_id: string | null;
  scripture: string;
  scripture_passage: string | null;
  bible_version_id: number | null;
  head: string | null;
  heart: string | null;
  hands: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// ============================================
// STORAGE KEYS
// ============================================

export const STORAGE_KEYS = {
  JOURNAL_ENTRIES: 'ark_journal_entries',
  DELETED_ENTRIES: 'ark_deleted_entries',
  LAST_SYNC: 'ark_last_sync',
  DEVICE_ID: 'ark_device_id',
  JOURNAL_DRAFT: 'ark_journal_draft',
  USER_STREAK: 'ark_user_streak',
  LAST_VISIT: 'ark_last_visit',
  TRANSLATION_PREF: 'ark_translation_preference',
  CHALLENGE_REG: 'challenge_registration',
  CHALLENGE_BADGES: 'challenge_badges',
  CHALLENGE_INVITED: 'ark_challenge_invited',
  PENDING_ENTRY: 'ark_pending_journal_entry',
} as const;

// ============================================
// COMPONENT PROPS TYPES
// ============================================

export interface DimensionCardProps {
  dimension: DimensionType;
  content: string;
  expanded: boolean;
  preview: string;
  placeholder: string;
  onChange: (value: string) => void;
  onToggle: () => void;
  onNext?: () => void;
  onSave?: () => void;
  isLastDimension?: boolean;
  isSaving?: boolean;
  isEditing?: boolean;
}

export interface ScriptureHeroProps {
  reference: string;
  passage: string;
  version: number;
  isEditing: boolean;
  onChangeClick: () => void;
  onPassageTap: () => void;
  onInfoClick?: () => void;
}

export interface BibleSelectorProps {
  isOpen: boolean;
  defaultVersion: number;
  onSelect: (passage: BiblePassage) => void;
  onClose: () => void;
  onVersionChange?: (versionId: number) => void;
}

export interface JournalArchiveEntryProps {
  entry: JournalEntry;
  onView: (entry: JournalEntry) => void;
  onEdit: (entry: JournalEntry) => void;
  onDelete: (entry: JournalEntry) => void;
  // TODO: onShare for future community sharing feature
}

export interface ChallengeBannerProps {
  progress: ChallengeProgress | null;
  onTap: () => void;
}

export interface SaveConfirmPopupProps {
  scripture: string;
  onKeepJournaling: () => void;
  onViewArchive: () => void;
  // TODO: onShareWithCommunity for future feature
}
