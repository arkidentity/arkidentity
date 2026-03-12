'use client';

/**
 * Journal Page - Main 3D Journal entry form
 * Combines all journal components into a complete experience
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { JournalForm } from '@/components/journal/JournalForm';
import { BibleSelector } from '@/components/journal/BibleSelector';
import { PassagePopup } from '@/components/journal/PassagePopup';
import { JournalInfoModal } from '@/components/journal/JournalInfoModal';
import { SaveConfirmPopup } from '@/components/journal/SaveConfirmPopup';
import { LoginGateModal } from '@/components/journal/LoginGateModal';
import { AppHeader } from '@/components/navigation/AppHeader';
import {
  InvitationPopup,
  TierSelectionPopup,
  TierConfirmationPopup,
  EncouragementPopup,
  MilestonePopup,
  HalfwayPopup,
  UpgradeOfferPopup,
  BadgeAwardPopup,
} from '@/components/journal/ChallengePopups';
import { useJournal } from '@/hooks/useJournal';
import { useChallenge } from '@/hooks/useChallenge';
import { useTranslationPreference } from '@/hooks/useTranslationPreference';
import { useAuth } from '@/components/auth/AuthProvider';
import { getJournalEntry, storePendingEntry, getPendingEntry, clearPendingEntry } from '@/lib/journalStorage';
import { getPassage } from '@/lib/youversionApi';
import { getVersionById, getVersionName } from '@/lib/bibleData';
import type { JournalEntry, BiblePassage, ChallengePopupType } from '@/types/journal';
import type { PopupDecision } from '@/lib/challengeIntegration';

export default function JournalPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoggedIn } = useAuth();
  const { versionId: defaultVersion, setVersion: saveTranslationPreference } = useTranslationPreference();
  const { entries, streak, save, update, refresh } = useJournal();
  const {
    registered,
    progress,
    register,
    upgrade,
    getPostJournalPopup,
    getTierInfo,
    getTierFeatures,
    getTierTagline,
  } = useChallenge();

  // UI State
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [selectedPassage, setSelectedPassage] = useState<BiblePassage | null>(null);

  // Modal states
  const [showBibleSelector, setShowBibleSelector] = useState(false);
  const [showPassagePopup, setShowPassagePopup] = useState(false);
  const [passageForPopup, setPassageForPopup] = useState<{ text: string; explanation?: string; reference?: string } | null>(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [savedScripture, setSavedScripture] = useState('');
  const [showLoginGate, setShowLoginGate] = useState(false);

  // Challenge popup states
  const [postJournalPopup, setPostJournalPopup] = useState<PopupDecision | null>(null);
  const [showTierSelection, setShowTierSelection] = useState(false);
  const [showTierConfirmation, setShowTierConfirmation] = useState(false);
  const [selectedTierDays, setSelectedTierDays] = useState(21);

  // Check for editing entry from archive
  useEffect(() => {
    const editId = sessionStorage.getItem('editing_entry_id');
    if (editId) {
      sessionStorage.removeItem('editing_entry_id');
      const entry = getJournalEntry(parseInt(editId, 10));
      if (entry) {
        setEditingEntry(entry);
      }
    }
  }, []);

  // Handle deep-link from Reading Plan: ?usfm=MAT.1&version=111&ref=Matthew+1
  useEffect(() => {
    const usfm = searchParams.get('usfm');
    const versionParam = searchParams.get('version');
    const refParam = searchParams.get('ref');
    if (!usfm) return;

    const versionId = versionParam ? parseInt(versionParam, 10) : 111;
    const versionInfo = getVersionById(versionId);

    void (async () => {
      try {
        const result = await getPassage(versionId, usfm);
        // Parse book/chapter from USFM (e.g. "MAT.1" or "JHN.3")
        const parts = usfm.split('.');
        const bookId = parts[0] ?? '';
        const chapter = parseInt(parts[1] ?? '1', 10);

        setSelectedPassage({
          version: versionId,
          versionName: versionInfo?.abbreviation ?? getVersionName(versionId),
          book: refParam ? refParam.split(' ')[0] : bookId,
          bookId,
          chapter,
          verseStart: 1,
          verseEnd: 999,
          usfm,
          reference: result.reference || refParam || usfm,
          content: result.content,
          formattedText: result.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(),
        });
      } catch {
        // Silently fail — user can pick passage manually
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount — searchParams is stable on first render

  // Check for pending entry after login
  useEffect(() => {
    if (isLoggedIn) {
      const pending = getPendingEntry();
      if (pending) {
        // Save the pending entry now that user is logged in
        save(pending);
        clearPendingEntry();
      }
    }
  }, [isLoggedIn, save]);

  // Handle Bible selector passage selection
  const handlePassageSelect = useCallback((passage: BiblePassage) => {
    setSelectedPassage(passage);
    setShowBibleSelector(false);
  }, []);

  // Handle passage popup open
  const handleOpenPassagePopup = useCallback((text: string, explanation?: string, reference?: string) => {
    setPassageForPopup({ text, explanation, reference });
    setShowPassagePopup(true);
  }, []);

  // Handle save
  const handleSaved = useCallback((entry: JournalEntry) => {
    setSavedScripture(entry.scripture);
    setEditingEntry(null);
    refresh();

    // Determine which popup to show
    const totalEntries = entries.length + 1; // +1 for the just-saved entry
    const currentStreak = (streak?.current || 0) + 1; // Streak updates after save

    const popup = getPostJournalPopup(currentStreak, totalEntries);
    if (popup) {
      setPostJournalPopup(popup);
    } else {
      setShowSaveConfirm(true);
    }
  }, [entries.length, streak, refresh, getPostJournalPopup]);

  // Handle login required (user tried to save without being logged in)
  const handleLoginRequired = useCallback(() => {
    setShowLoginGate(true);
  }, []);

  // Handle sign in from login gate
  const handleSignIn = useCallback(() => {
    setShowLoginGate(false);
    router.push('/login');
  }, [router]);

  // Handle continue as guest
  const handleContinueAsGuest = useCallback(() => {
    setShowLoginGate(false);
    // Entry will be saved locally
  }, []);

  // Challenge registration flow
  const handleStartChallenge = useCallback(() => {
    setPostJournalPopup(null);
    setShowTierSelection(true);
  }, []);

  const handleSelectTier = useCallback((days: number) => {
    setSelectedTierDays(days);
    setShowTierSelection(false);
    setShowTierConfirmation(true);
  }, []);

  const handleConfirmTier = useCallback(() => {
    if (user) {
      register(selectedTierDays, user.user_metadata?.display_name || user.email || 'User', user.email || '');
    } else {
      register(selectedTierDays, 'Guest', '');
    }
    setShowTierConfirmation(false);
    setShowSaveConfirm(true);
  }, [user, selectedTierDays, register]);

  const handleUpgrade = useCallback(() => {
    if (postJournalPopup?.data.nextTier) {
      upgrade(postJournalPopup.data.nextTier);
    }
    setPostJournalPopup(null);
  }, [postJournalPopup, upgrade]);

  // Close popup and show save confirm
  const handleClosePopup = useCallback(() => {
    setPostJournalPopup(null);
    setShowSaveConfirm(true);
  }, []);

  // Navigate to archive
  const handleViewArchive = useCallback(() => {
    setShowSaveConfirm(false);
    router.push('/journal/archive');
  }, [router]);

  // Keep journaling (reset form)
  const handleKeepJournaling = useCallback(() => {
    setShowSaveConfirm(false);
    setSelectedPassage(null);
    setEditingEntry(null);
  }, []);

  // Render challenge popup based on type
  const renderChallengePopup = () => {
    if (!postJournalPopup) return null;

    const { type, data } = postJournalPopup;

    switch (type) {
      case 'invitation':
        return (
          <InvitationPopup
            isOpen={true}
            onClose={handleClosePopup}
            onStartChallenge={handleStartChallenge}
          />
        );

      case 'badge':
        return (
          <BadgeAwardPopup
            isOpen={true}
            awardedDays={data.badgeAwarded!}
            nextTierDays={data.nextTier || null}
            onClose={handleClosePopup}
            onContinue={data.nextTier ? handleUpgrade : undefined}
          />
        );

      case 'upgrade':
        return (
          <UpgradeOfferPopup
            isOpen={true}
            currentDays={data.targetDays}
            nextTierDays={data.nextTier!}
            streak={data.streak}
            onClose={handleClosePopup}
            onUpgrade={handleUpgrade}
          />
        );

      case 'milestone':
        return (
          <MilestonePopup
            isOpen={true}
            streak={data.streak}
            targetDays={data.targetDays}
            onClose={handleClosePopup}
          />
        );

      case 'halfway':
        return (
          <HalfwayPopup
            isOpen={true}
            streak={data.streak}
            targetDays={data.targetDays}
            onClose={handleClosePopup}
          />
        );

      case 'encouragement':
      default:
        return (
          <EncouragementPopup
            isOpen={true}
            streak={data.streak}
            targetDays={data.targetDays}
            title={data.encouragement?.title || 'Great Job!'}
            message={data.encouragement?.message || 'Keep building that habit!'}
            onClose={handleClosePopup}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[var(--ark-navy)] pb-20">
      <AppHeader />

      {/* Content */}
      <main className="px-6 pt-5 pb-6 space-y-6 max-w-2xl mx-auto">
        {/* Journal Form */}
        <JournalForm
          editingEntry={editingEntry}
          onSaved={handleSaved}
          onOpenBibleSelector={() => setShowBibleSelector(true)}
          onOpenPassagePopup={handleOpenPassagePopup}
          onOpenInfoModal={() => setShowInfoModal(true)}
          onLoginRequired={handleLoginRequired}
          isLoggedIn={isLoggedIn}
          selectedPassage={selectedPassage}
        />
      </main>

      {/* Bible Selector Modal */}
      <BibleSelector
        isOpen={showBibleSelector}
        defaultVersion={defaultVersion}
        onSelect={handlePassageSelect}
        onClose={() => setShowBibleSelector(false)}
        onVersionChange={saveTranslationPreference}
      />

      {/* Passage Popup */}
      <PassagePopup
        isOpen={showPassagePopup}
        passage={passageForPopup?.text || ''}
        reference={passageForPopup?.reference}
        explanation={passageForPopup?.explanation}
        onClose={() => setShowPassagePopup(false)}
      />

      {/* Info Modal */}
      <JournalInfoModal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
      />

      {/* Save Confirm Popup */}
      {showSaveConfirm && (
        <SaveConfirmPopup
          scripture={savedScripture}
          onKeepJournaling={handleKeepJournaling}
          onViewArchive={handleViewArchive}
        />
      )}

      {/* Login Gate Modal */}
      <LoginGateModal
        isOpen={showLoginGate}
        onClose={() => setShowLoginGate(false)}
        onSignIn={handleSignIn}
        onContinueAsGuest={handleContinueAsGuest}
      />

      {/* Challenge Popups */}
      {renderChallengePopup()}

      {/* Tier Selection */}
      <TierSelectionPopup
        isOpen={showTierSelection}
        onClose={() => setShowTierSelection(false)}
        onSelectTier={handleSelectTier}
      />

      {/* Tier Confirmation */}
      <TierConfirmationPopup
        isOpen={showTierConfirmation}
        selectedDays={selectedTierDays}
        onClose={() => setShowTierConfirmation(false)}
        onBack={() => {
          setShowTierConfirmation(false);
          setShowTierSelection(true);
        }}
        onConfirm={handleConfirmTier}
      />

      {/* Footer Links */}
      <footer className="journal-footer-links">
        <a href="/privacy">Privacy Policy</a>
        <span>|</span>
        <a href="/terms">Terms of Service</a>
      </footer>
    </div>
  );
}
