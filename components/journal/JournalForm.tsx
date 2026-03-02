'use client';

/**
 * JournalForm - Main journal form component
 * Orchestrates the Scripture hero, 3D dimension accordion cards,
 * auto-save, and Bible selector
 */

import { useState, useCallback, useEffect } from 'react';
import { ScriptureHero } from './ScriptureHero';
import { DimensionCard } from './DimensionCard';
import { JournalStepper } from './JournalStepper';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useWakeLock } from '@/hooks/useWakeLock';
import { useTranslationPreference } from '@/hooks/useTranslationPreference';
import { getPassageOfTheDay, getPassageUSFM } from '@/lib/passageOfTheDay';
import { getPassageWithFormat } from '@/lib/youversionApi';
import { saveJournalEntry, updateJournalEntry, clearDraft } from '@/lib/journalStorage';
import type { DimensionType, JournalEntry, BiblePassage } from '@/types/journal';

export interface JournalFormProps {
  /** Entry being edited (null for new entry) */
  editingEntry?: JournalEntry | null;
  /** Called when entry is saved successfully */
  onSaved?: (entry: JournalEntry) => void;
  /** Called when user wants to change scripture */
  onOpenBibleSelector?: () => void;
  /** Called when user taps on passage to see full text */
  onOpenPassagePopup?: (passage: string, explanation?: string, reference?: string) => void;
  /** Called when user taps "What is 3D Journal?" */
  onOpenInfoModal?: () => void;
  /** Called when save requires login */
  onLoginRequired?: () => void;
  /** Current user session */
  isLoggedIn?: boolean;
  /** Externally selected Bible passage (from BibleSelector) */
  selectedPassage?: BiblePassage | null;
}

export function JournalForm({
  editingEntry = null,
  onSaved,
  onOpenBibleSelector,
  onOpenPassagePopup,
  onOpenInfoModal,
  onLoginRequired,
  isLoggedIn = false,
  selectedPassage,
}: JournalFormProps) {
  // Translation preference
  const { versionId: translationPref } = useTranslationPreference();

  // Form state
  const [scripture, setScripture] = useState('');
  const [scripturePassage, setScripturePassage] = useState('');
  const [bibleVersion, setBibleVersion] = useState(translationPref);
  const [head, setHead] = useState('');
  const [heart, setHeart] = useState('');
  const [hands, setHands] = useState('');
  const [expandedDimension, setExpandedDimension] = useState<DimensionType>('head');

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingPassage, setLoadingPassage] = useState(false);

  // Current passage explanation (for "What does this mean?")
  const [passageExplanation, setPassageExplanation] = useState<string | undefined>();

  // Keep screen awake while journaling
  useWakeLock();

  // Determine if we're editing
  const isEditing = editingEntry !== null;

  // Auto-save draft (only for new entries)
  const { draftRestored, clear: clearAutoSaveDraft } = useAutoSave(
    () => ({
      scripture,
      scripturePassage,
      bibleVersion,
      head,
      heart,
      hands,
      expandedDimension,
      isEditing,
      editingEntryId: editingEntry?.id ?? null,
    }),
    {
      enabled: !isEditing, // Don't auto-save when editing existing entry
      onDraftRestored: (draft) => {
        // Restore draft values
        setScripture(draft.scripture);
        setScripturePassage(draft.scripturePassage);
        setBibleVersion(draft.bibleVersion);
        setHead(draft.head);
        setHeart(draft.heart);
        setHands(draft.hands);
        setExpandedDimension(draft.expandedDimension || 'head');
      },
    }
  );

  // Load editing entry data
  useEffect(() => {
    if (editingEntry) {
      setScripture(editingEntry.scripture);
      setScripturePassage(editingEntry.scripturePassage);
      setBibleVersion(editingEntry.bibleVersion);
      setHead(editingEntry.head);
      setHeart(editingEntry.heart);
      setHands(editingEntry.hands);
      // Start with head expanded when editing
      setExpandedDimension('head');
    }
  }, [editingEntry]);

  // Load Passage of the Day on mount (only for new entries without draft)
  useEffect(() => {
    if (!isEditing && !draftRestored && !scripture) {
      loadPassageOfTheDay();
    }
  }, [isEditing, draftRestored]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle externally selected passage from Bible selector
  useEffect(() => {
    if (selectedPassage) {
      setScripture(selectedPassage.reference);
      setScripturePassage(selectedPassage.formattedText);
      setBibleVersion(selectedPassage.version);
      setPassageExplanation(undefined); // Clear explanation for custom selection
    }
  }, [selectedPassage]);

  // Load the passage of the day
  const loadPassageOfTheDay = async () => {
    setLoadingPassage(true);
    setError(null);

    try {
      const potd = getPassageOfTheDay();
      setPassageExplanation(potd.explanation);

      // Fetch the actual passage text from YouVersion with HTML format to include verse numbers
      const usfm = getPassageUSFM(potd);
      if (usfm) {
        const passage = await getPassageWithFormat(translationPref, usfm, 'html');
        // Use our full book name reference (e.g., "Colossians 1:9-14") instead of API's
        // abbreviated format (e.g., "Col. 1:9-14")
        setScripture(potd.reference);
        setScripturePassage(passage.content);
        setBibleVersion(translationPref);
      } else {
        // Fallback if API fails
        setScripture(potd.reference);
        setScripturePassage('');
        setBibleVersion(translationPref);
      }
    } catch (err) {
      console.error('[JournalForm] Error loading passage:', err);
      setError('Failed to load passage. You can select one manually.');

      // Set reference anyway so user can still journal
      const potd = getPassageOfTheDay();
      setScripture(potd.reference);
      setPassageExplanation(potd.explanation);
    } finally {
      setLoadingPassage(false);
    }
  };

  // Handle dimension toggle
  const handleDimensionToggle = useCallback((dimension: DimensionType) => {
    setExpandedDimension((prev) => (prev === dimension ? dimension : dimension));
  }, []);

  // Handle "Next" button - advance to next dimension
  const handleNext = useCallback((currentDimension: DimensionType) => {
    if (currentDimension === 'head') {
      setExpandedDimension('heart');
    } else if (currentDimension === 'heart') {
      setExpandedDimension('hands');
    }
  }, []);

  // Handle save
  const handleSave = async () => {
    // Validate
    if (!scripture.trim()) {
      setError('Please select a scripture passage.');
      return;
    }

    const hasContent = head.trim() || heart.trim() || hands.trim();
    if (!hasContent) {
      setError('Please write something in at least one dimension.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      let savedEntry: JournalEntry | null;

      if (isEditing && editingEntry) {
        // Update existing entry
        savedEntry = updateJournalEntry(editingEntry.id, {
          scripture,
          scripturePassage,
          bibleVersion,
          head,
          heart,
          hands,
        });
        if (!savedEntry) {
          throw new Error('Failed to update entry');
        }
      } else {
        // Create new entry
        savedEntry = saveJournalEntry({
          scripture,
          scripturePassage,
          bibleVersion,
          head,
          heart,
          hands,
        });

        // Clear draft after successful save
        clearAutoSaveDraft();
        clearDraft();
      }

      // Notify parent
      onSaved?.(savedEntry);

      // Reset form for new entry
      if (!isEditing) {
        resetForm();
      }
    } catch (err) {
      console.error('[JournalForm] Save error:', err);
      setError('Failed to save entry. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset form to initial state
  const resetForm = () => {
    setHead('');
    setHeart('');
    setHands('');
    setExpandedDimension('head');
    // Load new passage of the day
    loadPassageOfTheDay();
  };

  // Handle passage tap (show full passage popup)
  const handlePassageTap = () => {
    if (scripturePassage) {
      onOpenPassagePopup?.(scripturePassage, passageExplanation, scripture);
    }
  };

  // Handle scripture change click
  const handleChangeScripture = () => {
    onOpenBibleSelector?.();
  };

  // Handle info click
  const handleInfoClick = () => {
    onOpenInfoModal?.();
  };

  return (
    <div className="space-y-4">
      {/* Draft restored notification */}
      {draftRestored && (
        <div className="bg-[var(--ark-gold)]/20 border border-[var(--ark-gold)]/30 rounded-lg p-3 flex items-center justify-between">
          <span className="text-white/90 text-sm">
            Unsaved draft restored
          </span>
          <button
            type="button"
            onClick={() => {
              clearAutoSaveDraft();
              clearDraft();
              resetForm();
            }}
            className="text-[var(--ark-gold)] text-sm font-medium hover:underline"
          >
            Discard
          </button>
        </div>
      )}

      {/* Error notification */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
          <span className="text-red-200 text-sm">{error}</span>
        </div>
      )}

      {/* Loading state */}
      {loadingPassage && (
        <div className="bg-white/10 rounded-xl p-4 mb-4 flex items-center justify-center">
          <div className="animate-pulse text-white/60">Loading passage...</div>
        </div>
      )}

      {/* 1D → 2D → 3D progress stepper */}
      <JournalStepper activeStep={expandedDimension} />

      {/* Scripture Hero */}
      {!loadingPassage && (
        <ScriptureHero
          reference={scripture}
          passage={scripturePassage}
          version={bibleVersion}
          isEditing={isEditing}
          onChangeClick={handleChangeScripture}
          onPassageTap={handlePassageTap}
          onInfoClick={handleInfoClick}
        />
      )}

      {/* 3D Dimension Cards */}
      <div className="space-y-5">
        {/* HEAD */}
        <DimensionCard
          dimension="head"
          content={head}
          expanded={expandedDimension === 'head'}
          preview={head}
          placeholder=""
          onChange={setHead}
          onToggle={() => handleDimensionToggle('head')}
          onNext={() => handleNext('head')}
          isEditing={isEditing}
        />

        {/* HEART */}
        <DimensionCard
          dimension="heart"
          content={heart}
          expanded={expandedDimension === 'heart'}
          preview={heart}
          placeholder=""
          onChange={setHeart}
          onToggle={() => handleDimensionToggle('heart')}
          onNext={() => handleNext('heart')}
          isEditing={isEditing}
        />

        {/* HANDS */}
        <DimensionCard
          dimension="hands"
          content={hands}
          expanded={expandedDimension === 'hands'}
          preview={hands}
          placeholder=""
          onChange={setHands}
          onToggle={() => handleDimensionToggle('hands')}
          onSave={handleSave}
          isLastDimension={true}
          isSaving={isSaving}
          isEditing={isEditing}
        />
      </div>
    </div>
  );
}
