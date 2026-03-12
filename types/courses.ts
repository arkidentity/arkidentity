// ============================================================
// Course Engine Types — ARK Identity
// ============================================================

// --- Content Blocks ---

export type ContentBlockType =
  | 'paragraph'
  | 'scripture'
  | 'keyDefinition'
  | 'discussion'
  | 'sectionHeader'
  | 'reflectWrite'
  | 'introspective'
  | 'askGod'
  | 'mission'
  | 'revealTable'
  | 'interactiveDiagram'
  | 'interactiveWorksheet'
  | 'pdfDownload'
  | 'featureLink'
  | 'bridgeLesson';

export interface ContentBlock {
  type: ContentBlockType;
  // paragraph, scripture, keyDefinition
  text?: string;
  ref?: string;
  // discussion
  questions?: string[];
  // sectionHeader
  title?: string;
  // reflectWrite, introspective, askGod, mission
  id?: string;
  prompt?: string;
  // mission
  action?: string;
  // revealTable
  headers?: string[];
  rows?: string[][];
  // interactiveWorksheet
  instruction?: string;
  columns?: { id: string; label: string; placeholder: string }[];
  downloadOption?: boolean;
  // pdfDownload
  description?: string;
  filename?: string;
  buttonText?: string;
  // featureLink
  linkType?: 'internal' | 'external';
  linkTarget?: string;
  // bridgeLesson
  headline?: string;
  subtitle?: string;
  coverImage?: string;
  ctaPrimary?: { text: string; course: string };
  ctaSecondary?: { text: string; session: number };
}

// --- Quiz ---

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
}

export interface Quiz {
  questions: QuizQuestion[];
}

// --- Lesson ---

export interface Lesson {
  id: number;
  title: string;
  duration: string;
  videoId?: string;
  imageId?: string;
  isBonus?: boolean;
  isBridgeLesson?: boolean;
  bridgeCourse?: string;
  content: ContentBlock[];
  quiz?: Quiz;
}

// --- Session ---

export interface SupportingScripture {
  text: string;
  ref: string;
}

export interface Session {
  id: number;
  title: string;
  synopsis?: string;
  verse: string;
  verseRef: string;
  warmUp: string[];
  supportingScriptures?: SupportingScripture[];
  lessons: Lesson[];
}

// --- Vocabulary ---

export interface VocabularyTerm {
  term: string;
  definition: string;
}

// --- Pre-Session Content (The Way) ---

export interface PreSessionContent {
  openingCreed?: {
    title: string;
    description: string;
    points: { label: string; text: string }[];
  };
  essentials?: {
    title: string;
    subtitle: string;
    description: string;
    items: { number: number; title: string; description: string }[];
  };
}

// --- Session Overview ---

export interface SessionOverview {
  id: number;
  title: string;
  synopsis: string;
}

// --- Course ---

export interface Course {
  id: string;
  title: string;
  subtitle: string;
  fullTitle: string;
  tagline?: string;
  description: string;
  miniCourse?: boolean;
  vocabulary?: VocabularyTerm[];
  preSessionContent?: PreSessionContent;
  sessionOverviews?: SessionOverview[];
  sessions: Session[];
}

// --- Branding ---

export interface CourseBranding {
  primary: string;
  secondary: string;
  accent: string;
  dark: string;
  gradient?: string;
  cardGradient?: string;
  light?: string;
}

// --- Registry ---

export interface CourseRegistryEntry {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  tagline?: string;
  sessions: number;
  coverImage: string;
  bookCover: string;
  thumbnail: string;
  pdfDownload?: string;
  available: boolean;
  order: number;
}

export interface CourseRegistry {
  version: string;
  lastUpdated: string;
  themes: Record<string, CourseBranding>;
  courses: CourseRegistryEntry[];
}

// --- Progress ---

export interface LessonProgress {
  lessonId: number;
  completed: boolean;
  completedAt: string | null;
}

export interface SessionProgress {
  sessionId: number;
  lessons: LessonProgress[];
  completed: boolean;
  completedAt: string | null;
}

export interface CourseProgress {
  courseId: string;
  sessions: SessionProgress[];
  lastSessionId: number | null;
  lastLessonId: number | null;
  startedAt: string;
  completedAt: string | null;
  updatedAt: string;
}

// --- Storage Keys ---

export const COURSE_STORAGE_KEYS = {
  ALL_PROGRESS: 'ark_course_progress',
  REFLECT_WRITE: 'ark_course_reflections',
  WORKSHEETS: 'ark_course_worksheets',
  LAST_SYNC: 'ark_course_last_sync',
  TV_MODE: 'ark_tv_mode',
} as const;
