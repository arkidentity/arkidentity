'use client';

/**
 * Hook for managing user's Bible translation preference
 * Persists to localStorage and provides version info
 */

import { useState, useEffect, useCallback } from 'react';
import { STORAGE_KEYS } from '@/types/journal';
import { BIBLE_VERSIONS, VERSION_IDS, DEFAULT_VERSION, getVersionById } from '@/lib/bibleData';
import type { BibleVersion } from '@/types/journal';

export interface UseTranslationPreferenceReturn {
  /** Current version ID */
  versionId: number;
  /** Current version info */
  version: BibleVersion | undefined;
  /** All available versions */
  versions: typeof BIBLE_VERSIONS;
  /** Version ID constants */
  VERSION_IDS: typeof VERSION_IDS;
  /** Update the preferred version */
  setVersion: (versionId: number) => void;
  /** Whether preference has loaded from storage */
  isLoaded: boolean;
}

/**
 * Hook to manage Bible translation preference
 *
 * @example
 * ```tsx
 * const { versionId, version, setVersion, versions } = useTranslationPreference();
 *
 * // Display current version
 * <span>{version?.abbreviation}</span>
 *
 * // Version selector
 * <select value={versionId} onChange={(e) => setVersion(Number(e.target.value))}>
 *   {Object.values(versions).map(v => (
 *     <option key={v.id} value={v.id}>{v.name}</option>
 *   ))}
 * </select>
 * ```
 */
export function useTranslationPreference(): UseTranslationPreferenceReturn {
  const [versionId, setVersionId] = useState<number>(DEFAULT_VERSION);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load preference from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const stored = localStorage.getItem(STORAGE_KEYS.TRANSLATION_PREF);
    if (stored) {
      const parsedId = parseInt(stored, 10);
      // Validate it's a known version
      if (getVersionById(parsedId)) {
        setVersionId(parsedId);
      }
    }
    setIsLoaded(true);
  }, []);

  // Update preference and persist
  const setVersion = useCallback((newVersionId: number) => {
    // Validate it's a known version
    if (!getVersionById(newVersionId)) {
      console.warn('[TranslationPreference] Unknown version ID:', newVersionId);
      return;
    }

    setVersionId(newVersionId);

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.TRANSLATION_PREF, String(newVersionId));
      console.log('[TranslationPreference] Updated to:', newVersionId);
    }
  }, []);

  return {
    versionId,
    version: getVersionById(versionId),
    versions: BIBLE_VERSIONS,
    VERSION_IDS,
    setVersion,
    isLoaded,
  };
}

/**
 * Get the stored translation preference (non-reactive)
 * Useful for initial values outside of React components
 */
export function getStoredTranslationPreference(): number {
  if (typeof window === 'undefined') return DEFAULT_VERSION;

  const stored = localStorage.getItem(STORAGE_KEYS.TRANSLATION_PREF);
  if (stored) {
    const parsedId = parseInt(stored, 10);
    if (getVersionById(parsedId)) {
      return parsedId;
    }
  }

  return DEFAULT_VERSION;
}
