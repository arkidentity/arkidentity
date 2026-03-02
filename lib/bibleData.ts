/**
 * Bible data constants - USFM codes, version IDs, book lists
 */

import type { BibleVersion, BibleBook } from '@/types/journal';

// ============================================
// BIBLE VERSIONS
// ============================================

export const BIBLE_VERSIONS: Record<string, BibleVersion> = {
  NIV: { id: 111, name: 'New International Version', abbreviation: 'NIV', language: 'en' },
  NVI: { id: 128, name: 'Nueva Version Internacional', abbreviation: 'NVI', language: 'es' },
  NASB: { id: 100, name: 'New American Standard Bible 1995', abbreviation: 'NASB', language: 'en' },
  NBLA: { id: 103, name: 'Nueva Biblia de las Americas', abbreviation: 'NBLA', language: 'es' },
};

export const VERSION_IDS = {
  NIV: 111,
  NVI: 128,
  NASB: 100,
  NBLA: 103,
} as const;

export const DEFAULT_VERSION = VERSION_IDS.NIV;

// Get version info by ID
export function getVersionById(id: number): BibleVersion | undefined {
  return Object.values(BIBLE_VERSIONS).find(v => v.id === id);
}

// Get version name by ID
export function getVersionName(id: number): string {
  const version = getVersionById(id);
  return version?.abbreviation || 'NIV';
}

// ============================================
// USFM BOOK CODES
// ============================================

// Book name to USFM code mapping
export const BOOK_CODES: Record<string, string> = {
  // Old Testament
  'Genesis': 'GEN',
  'Exodus': 'EXO',
  'Leviticus': 'LEV',
  'Numbers': 'NUM',
  'Deuteronomy': 'DEU',
  'Joshua': 'JOS',
  'Judges': 'JDG',
  'Ruth': 'RUT',
  '1 Samuel': '1SA',
  '2 Samuel': '2SA',
  '1 Kings': '1KI',
  '2 Kings': '2KI',
  '1 Chronicles': '1CH',
  '2 Chronicles': '2CH',
  'Ezra': 'EZR',
  'Nehemiah': 'NEH',
  'Esther': 'EST',
  'Job': 'JOB',
  'Psalms': 'PSA',
  'Psalm': 'PSA',
  'Proverbs': 'PRO',
  'Ecclesiastes': 'ECC',
  'Song of Solomon': 'SNG',
  'Song of Songs': 'SNG',
  'Isaiah': 'ISA',
  'Jeremiah': 'JER',
  'Lamentations': 'LAM',
  'Ezekiel': 'EZK',
  'Daniel': 'DAN',
  'Hosea': 'HOS',
  'Joel': 'JOL',
  'Amos': 'AMO',
  'Obadiah': 'OBA',
  'Jonah': 'JON',
  'Micah': 'MIC',
  'Nahum': 'NAM',
  'Habakkuk': 'HAB',
  'Zephaniah': 'ZEP',
  'Haggai': 'HAG',
  'Zechariah': 'ZEC',
  'Malachi': 'MAL',
  // New Testament
  'Matthew': 'MAT',
  'Mark': 'MRK',
  'Luke': 'LUK',
  'John': 'JHN',
  'Acts': 'ACT',
  'Romans': 'ROM',
  '1 Corinthians': '1CO',
  '2 Corinthians': '2CO',
  'Galatians': 'GAL',
  'Ephesians': 'EPH',
  'Philippians': 'PHP',
  'Colossians': 'COL',
  '1 Thessalonians': '1TH',
  '2 Thessalonians': '2TH',
  '1 Timothy': '1TI',
  '2 Timothy': '2TI',
  'Titus': 'TIT',
  'Philemon': 'PHM',
  'Hebrews': 'HEB',
  'James': 'JAS',
  '1 Peter': '1PE',
  '2 Peter': '2PE',
  '1 John': '1JN',
  '2 John': '2JN',
  '3 John': '3JN',
  'Jude': 'JUD',
  'Revelation': 'REV',
};

// USFM code to book name mapping (reverse lookup)
export const CODE_TO_BOOK: Record<string, string> = Object.fromEntries(
  Object.entries(BOOK_CODES).map(([name, code]) => [code, name])
);

// ============================================
// BIBLE BOOKS (Ordered: NT first, then OT)
// ============================================

export const NEW_TESTAMENT_BOOKS: BibleBook[] = [
  { id: 'MAT', name: 'Matthew', chapters: 28, testament: 'NT' },
  { id: 'MRK', name: 'Mark', chapters: 16, testament: 'NT' },
  { id: 'LUK', name: 'Luke', chapters: 24, testament: 'NT' },
  { id: 'JHN', name: 'John', chapters: 21, testament: 'NT' },
  { id: 'ACT', name: 'Acts', chapters: 28, testament: 'NT' },
  { id: 'ROM', name: 'Romans', chapters: 16, testament: 'NT' },
  { id: '1CO', name: '1 Corinthians', chapters: 16, testament: 'NT' },
  { id: '2CO', name: '2 Corinthians', chapters: 13, testament: 'NT' },
  { id: 'GAL', name: 'Galatians', chapters: 6, testament: 'NT' },
  { id: 'EPH', name: 'Ephesians', chapters: 6, testament: 'NT' },
  { id: 'PHP', name: 'Philippians', chapters: 4, testament: 'NT' },
  { id: 'COL', name: 'Colossians', chapters: 4, testament: 'NT' },
  { id: '1TH', name: '1 Thessalonians', chapters: 5, testament: 'NT' },
  { id: '2TH', name: '2 Thessalonians', chapters: 3, testament: 'NT' },
  { id: '1TI', name: '1 Timothy', chapters: 6, testament: 'NT' },
  { id: '2TI', name: '2 Timothy', chapters: 4, testament: 'NT' },
  { id: 'TIT', name: 'Titus', chapters: 3, testament: 'NT' },
  { id: 'PHM', name: 'Philemon', chapters: 1, testament: 'NT' },
  { id: 'HEB', name: 'Hebrews', chapters: 13, testament: 'NT' },
  { id: 'JAS', name: 'James', chapters: 5, testament: 'NT' },
  { id: '1PE', name: '1 Peter', chapters: 5, testament: 'NT' },
  { id: '2PE', name: '2 Peter', chapters: 3, testament: 'NT' },
  { id: '1JN', name: '1 John', chapters: 5, testament: 'NT' },
  { id: '2JN', name: '2 John', chapters: 1, testament: 'NT' },
  { id: '3JN', name: '3 John', chapters: 1, testament: 'NT' },
  { id: 'JUD', name: 'Jude', chapters: 1, testament: 'NT' },
  { id: 'REV', name: 'Revelation', chapters: 22, testament: 'NT' },
];

export const OLD_TESTAMENT_BOOKS: BibleBook[] = [
  { id: 'GEN', name: 'Genesis', chapters: 50, testament: 'OT' },
  { id: 'EXO', name: 'Exodus', chapters: 40, testament: 'OT' },
  { id: 'LEV', name: 'Leviticus', chapters: 27, testament: 'OT' },
  { id: 'NUM', name: 'Numbers', chapters: 36, testament: 'OT' },
  { id: 'DEU', name: 'Deuteronomy', chapters: 34, testament: 'OT' },
  { id: 'JOS', name: 'Joshua', chapters: 24, testament: 'OT' },
  { id: 'JDG', name: 'Judges', chapters: 21, testament: 'OT' },
  { id: 'RUT', name: 'Ruth', chapters: 4, testament: 'OT' },
  { id: '1SA', name: '1 Samuel', chapters: 31, testament: 'OT' },
  { id: '2SA', name: '2 Samuel', chapters: 24, testament: 'OT' },
  { id: '1KI', name: '1 Kings', chapters: 22, testament: 'OT' },
  { id: '2KI', name: '2 Kings', chapters: 25, testament: 'OT' },
  { id: '1CH', name: '1 Chronicles', chapters: 29, testament: 'OT' },
  { id: '2CH', name: '2 Chronicles', chapters: 36, testament: 'OT' },
  { id: 'EZR', name: 'Ezra', chapters: 10, testament: 'OT' },
  { id: 'NEH', name: 'Nehemiah', chapters: 13, testament: 'OT' },
  { id: 'EST', name: 'Esther', chapters: 10, testament: 'OT' },
  { id: 'JOB', name: 'Job', chapters: 42, testament: 'OT' },
  { id: 'PSA', name: 'Psalms', chapters: 150, testament: 'OT' },
  { id: 'PRO', name: 'Proverbs', chapters: 31, testament: 'OT' },
  { id: 'ECC', name: 'Ecclesiastes', chapters: 12, testament: 'OT' },
  { id: 'SNG', name: 'Song of Solomon', chapters: 8, testament: 'OT' },
  { id: 'ISA', name: 'Isaiah', chapters: 66, testament: 'OT' },
  { id: 'JER', name: 'Jeremiah', chapters: 52, testament: 'OT' },
  { id: 'LAM', name: 'Lamentations', chapters: 5, testament: 'OT' },
  { id: 'EZK', name: 'Ezekiel', chapters: 48, testament: 'OT' },
  { id: 'DAN', name: 'Daniel', chapters: 12, testament: 'OT' },
  { id: 'HOS', name: 'Hosea', chapters: 14, testament: 'OT' },
  { id: 'JOL', name: 'Joel', chapters: 3, testament: 'OT' },
  { id: 'AMO', name: 'Amos', chapters: 9, testament: 'OT' },
  { id: 'OBA', name: 'Obadiah', chapters: 1, testament: 'OT' },
  { id: 'JON', name: 'Jonah', chapters: 4, testament: 'OT' },
  { id: 'MIC', name: 'Micah', chapters: 7, testament: 'OT' },
  { id: 'NAM', name: 'Nahum', chapters: 3, testament: 'OT' },
  { id: 'HAB', name: 'Habakkuk', chapters: 3, testament: 'OT' },
  { id: 'ZEP', name: 'Zephaniah', chapters: 3, testament: 'OT' },
  { id: 'HAG', name: 'Haggai', chapters: 2, testament: 'OT' },
  { id: 'ZEC', name: 'Zechariah', chapters: 14, testament: 'OT' },
  { id: 'MAL', name: 'Malachi', chapters: 4, testament: 'OT' },
];

// Combined list: NT first, then OT (for Bible selector)
export const ALL_BOOKS: BibleBook[] = [...NEW_TESTAMENT_BOOKS, ...OLD_TESTAMENT_BOOKS];

// Aliases for backward compatibility
export const BIBLE_BOOKS = ALL_BOOKS;
export const VERSIONS = BIBLE_VERSIONS;

// Get book by USFM code
export function getBookById(id: string): BibleBook | undefined {
  return ALL_BOOKS.find(b => b.id === id);
}

// Get book by name
export function getBookByName(name: string): BibleBook | undefined {
  return ALL_BOOKS.find(b => b.name.toLowerCase() === name.toLowerCase());
}

// ============================================
// USFM PARSING UTILITIES
// ============================================

/**
 * Parse a scripture reference into USFM components
 * e.g., "John 3:16-17" -> { bookCode: "JHN", chapter: 3, verseStart: 16, verseEnd: 17, usfm: "JHN.3.16-17" }
 */
export function parseReferenceToUSFM(reference: string): {
  bookName: string;
  bookCode: string;
  chapter: number;
  verseStart: number;
  verseEnd: number;
  usfm: string;
} | null {
  // Handle various formats:
  // "John 3:16-17", "1 John 4:7-16", "Psalm 23:1-6", "Matthew 5:3-12"
  const match = reference.match(/^(\d?\s?[A-Za-z]+(?:\s+[A-Za-z]+)?)\s+(\d+):(\d+)(?:-(\d+))?$/);

  if (!match) {
    console.error('[Bible] Could not parse reference:', reference);
    return null;
  }

  const bookName = match[1].trim();
  const chapter = parseInt(match[2]);
  const verseStart = parseInt(match[3]);
  const verseEnd = match[4] ? parseInt(match[4]) : verseStart;

  const bookCode = BOOK_CODES[bookName];

  if (!bookCode) {
    console.error('[Bible] Unknown book:', bookName);
    return null;
  }

  const usfm = verseStart === verseEnd
    ? `${bookCode}.${chapter}.${verseStart}`
    : `${bookCode}.${chapter}.${verseStart}-${verseEnd}`;

  return {
    bookName,
    bookCode,
    chapter,
    verseStart,
    verseEnd,
    usfm,
  };
}

/**
 * Build a USFM string from components
 */
export function buildUSFM(bookCode: string, chapter: number, verseStart: number, verseEnd?: number): string {
  if (!verseEnd || verseStart === verseEnd) {
    return `${bookCode}.${chapter}.${verseStart}`;
  }
  return `${bookCode}.${chapter}.${verseStart}-${verseEnd}`;
}

/**
 * Build a human-readable reference from USFM components
 */
export function buildReference(bookCode: string, chapter: number, verseStart: number, verseEnd?: number): string {
  const bookName = CODE_TO_BOOK[bookCode] || bookCode;
  if (!verseEnd || verseStart === verseEnd) {
    return `${bookName} ${chapter}:${verseStart}`;
  }
  return `${bookName} ${chapter}:${verseStart}-${verseEnd}`;
}

/**
 * Build USFM for fetching an entire chapter (use high verse number)
 */
export function buildChapterUSFM(bookCode: string, chapter: number): string {
  return `${bookCode}.${chapter}.1-200`;
}
