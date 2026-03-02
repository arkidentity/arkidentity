/**
 * YouVersion Platform API wrapper
 * Fetches Bible passages via server-side proxy with persistent Supabase cache.
 *
 * All passage requests go through /api/bible/passage which:
 * 1. Checks the bible_passage_cache table in Supabase first
 * 2. Only calls YouVersion API on a cache miss (first request ever for that passage)
 * 3. Stores the result so every future request is served from the DB
 *
 * This means the YouVersion 5,000/day rate limit is effectively irrelevant at scale —
 * each unique passage is fetched from YouVersion at most once, ever.
 */

import type { ParsedVerse, BibleBook } from '@/types/journal';
import { ALL_BOOKS, buildChapterUSFM, CODE_TO_BOOK } from './bibleData';

// ============================================
// IN-MEMORY CACHE (session-level, second layer)
// Avoids even the DB round-trip for repeated same-session requests
// ============================================

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const cache = new Map<string, { data: unknown; timestamp: number }>();

// ============================================
// PROXY REQUEST
// ============================================

/**
 * Fetch a passage via the server-side proxy (/api/bible/passage).
 * The proxy checks Supabase cache first, only hitting YouVersion on a miss.
 */
async function fetchViaProxy(usfm: string, versionId: number, format: 'text' | 'html' = 'text'): Promise<{
  content: string;
  reference: string;
}> {
  const cacheKey = `${usfm}:${versionId}:${format}`;

  // Check in-memory cache first (avoids DB round-trip within same session)
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as { content: string; reference: string };
  }

  const params = new URLSearchParams({
    usfm,
    version: String(versionId),
    format,
  });

  // In browser: use relative URL. In SSR: need absolute URL.
  const baseUrl = typeof window !== 'undefined'
    ? ''
    : (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_HUB_URL || 'http://localhost:3001');

  const response = await fetch(`${baseUrl}/api/bible/passage?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`Bible proxy error: ${response.status}`);
  }

  const data = await response.json() as { content: string; reference: string };

  // Store in in-memory cache
  cache.set(cacheKey, { data, timestamp: Date.now() });

  return data;
}

// ============================================
// PUBLIC API FUNCTIONS
// ============================================

/**
 * Get list of Bible versions
 */
export async function getVersions(): Promise<unknown[]> {
  // Version list is static — not proxied, called rarely
  const appKey = process.env.NEXT_PUBLIC_YV_APP_KEY;
  if (!appKey) throw new Error('YouVersion API key not configured');
  const response = await fetch('https://api.youversion.com/v1/bibles?language_ranges[]=en*', {
    headers: { 'X-YVP-App-Key': appKey, 'Accept': 'application/json' },
  });
  if (!response.ok) throw new Error(`YouVersion API error: ${response.status}`);
  const data = await response.json();
  return data.versions;
}

/**
 * Get books for a specific Bible version
 */
export async function getBooks(_versionId: number): Promise<BibleBook[]> {
  return ALL_BOOKS;
}

/**
 * Get a passage by USFM reference
 * Routes through /api/bible/passage proxy with persistent Supabase cache.
 * @param versionId - Bible version ID (e.g., 111 for NIV)
 * @param usfm - USFM reference (e.g., "JHN.3.16-17")
 */
export async function getPassage(versionId: number, usfm: string): Promise<{
  content: string;
  reference: string;
}> {
  return fetchViaProxy(usfm, versionId, 'text');
}

/**
 * Get a passage with HTML format (required for verse parsing)
 * Routes through /api/bible/passage proxy with persistent Supabase cache.
 * CRITICAL: Always use this instead of plain getPassage when you need verse markers
 */
export async function getPassageWithFormat(
  versionId: number,
  usfm: string,
  format: 'html' | 'text' = 'html'
): Promise<{
  content: string;
  reference: string;
}> {
  return fetchViaProxy(usfm, versionId, format);
}

/**
 * Get an entire chapter with HTML format for verse selection
 */
export async function getChapter(versionId: number, bookCode: string, chapter: number): Promise<{
  content: string;
  reference: string;
  verses: ParsedVerse[];
}> {
  const usfm = buildChapterUSFM(bookCode, chapter);
  const response = await getPassageWithFormat(versionId, usfm, 'html');

  return {
    content: response.content,
    reference: response.reference,
    verses: parseVersesFromHTML(response.content),
  };
}

// ============================================
// VERSE PARSING
// ============================================

/**
 * Parse verses from YouVersion HTML content
 *
 * The API returns HTML with markers like:
 * <span class="yv-v" v="1"></span><span class="yv-vlbl">1</span>Verse text here...
 *
 * Algorithm:
 * 1. Find all .yv-v[v] markers
 * 2. Replace markers with delimiters: |||VERSE:N|||
 * 3. Remove .yv-vlbl labels
 * 4. Extract text content and split by delimiters
 * 5. Parse verse number and text from each part
 */
export function parseVersesFromHTML(htmlContent: string): ParsedVerse[] {
  if (typeof window === 'undefined') {
    return parseVersesRegex(htmlContent);
  }

  const temp = document.createElement('div');
  temp.innerHTML = htmlContent;

  const verses: ParsedVerse[] = [];

  const markers = temp.querySelectorAll('.yv-v[v]');
  markers.forEach(marker => {
    const verseNum = marker.getAttribute('v');
    if (verseNum) {
      marker.textContent = `|||VERSE:${verseNum}|||`;
    }
  });

  temp.querySelectorAll('.yv-vlbl').forEach(el => el.remove());
  temp.querySelectorAll('.yv-c').forEach(el => el.remove());
  temp.querySelectorAll('.yv-clbl').forEach(el => el.remove());

  const textWithDelimiters = temp.textContent || '';
  const parts = textWithDelimiters.split('|||VERSE:');

  parts.forEach(part => {
    const pipeIndex = part.indexOf('|||');
    if (pipeIndex === -1) return;

    const verseNum = parseInt(part.substring(0, pipeIndex));
    const text = part.substring(pipeIndex + 3).replace(/\s+/g, ' ').trim();

    if (verseNum > 0 && text.length > 0) {
      verses.push({ num: verseNum, text });
    }
  });

  return verses.sort((a, b) => a.num - b.num);
}

/**
 * Fallback regex-based verse parsing for server-side
 */
function parseVersesRegex(htmlContent: string): ParsedVerse[] {
  const verses: ParsedVerse[] = [];

  const verseMarkerRegex = /<span[^>]*class="yv-v"[^>]*v="(\d+)"[^>]*>/g;
  const markers: { num: number; index: number }[] = [];

  let match;
  while ((match = verseMarkerRegex.exec(htmlContent)) !== null) {
    markers.push({ num: parseInt(match[1]), index: match.index });
  }

  const stripHTML = (html: string) => html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

  for (let i = 0; i < markers.length; i++) {
    const start = markers[i].index;
    const end = i < markers.length - 1 ? markers[i + 1].index : htmlContent.length;
    const segment = htmlContent.substring(start, end);
    const text = stripHTML(segment);

    if (text.length > 0) {
      verses.push({ num: markers[i].num, text });
    }
  }

  return verses.sort((a, b) => a.num - b.num);
}

/**
 * Format verses as readable text with verse numbers
 */
export function formatVersesAsText(verses: ParsedVerse[]): string {
  return verses.map(v => `[${v.num}] ${v.text}`).join(' ');
}

/**
 * Format a verse range as readable text
 */
export function formatVerseRange(verses: ParsedVerse[], startVerse: number, endVerse: number): string {
  const rangeVerses = verses.filter(v => v.num >= startVerse && v.num <= endVerse);
  return formatVersesAsText(rangeVerses);
}

/**
 * Get plain text from HTML content (strips all HTML)
 */
export function getPlainTextFromHTML(htmlContent: string): string {
  if (typeof window === 'undefined') {
    return htmlContent.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  const temp = document.createElement('div');
  temp.innerHTML = htmlContent;

  temp.querySelectorAll('.yv-vlbl').forEach(el => el.remove());
  temp.querySelectorAll('.yv-clbl').forEach(el => el.remove());

  return (temp.textContent || '').replace(/\s+/g, ' ').trim();
}

// ============================================
// CACHE MANAGEMENT
// ============================================

/**
 * Clear the in-memory session cache
 */
export function clearCache(): void {
  cache.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { entries: number; oldestEntry: number | null } {
  let oldest: number | null = null;

  cache.forEach(entry => {
    if (oldest === null || entry.timestamp < oldest) {
      oldest = entry.timestamp;
    }
  });

  return { entries: cache.size, oldestEntry: oldest };
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Build a human-readable reference from components
 */
export function buildHumanReference(
  bookCode: string,
  chapter: number,
  verseStart: number,
  verseEnd?: number
): string {
  const bookName = CODE_TO_BOOK[bookCode] || bookCode;

  if (!verseEnd || verseStart === verseEnd) {
    return `${bookName} ${chapter}:${verseStart}`;
  }

  return `${bookName} ${chapter}:${verseStart}-${verseEnd}`;
}

/**
 * Check if the API is configured
 */
export function isApiConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_YV_APP_KEY;
}

// Aliases for backward compatibility
export const fetchPassage = getPassage;
export const fetchChapterVerses = getChapter;
