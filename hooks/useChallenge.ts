'use client';

/**
 * Hook for managing challenge state and operations
 */

import { useState, useEffect, useCallback } from 'react';
import {
  isRegistered,
  getLocalRegistration,
  createRegistration,
  extendChallenge,
  getChallengeProgress,
  getBadges,
  getTierInfo,
  getVisibleTiers,
  wasPopupDismissedToday,
  dismissPopupToday,
  markPopupClicked,
  saveSelectedTier,
  getSelectedTier,
  setPendingRegistration,
  hasPendingRegistration,
  clearLocalRegistration,
} from '@/lib/challenge';
import {
  determinePostJournalPopup,
  getTierFeatures,
  getTierTagline,
  type PopupDecision,
} from '@/lib/challengeIntegration';
import type { ChallengeRegistration, ChallengeProgress, ChallengeTier } from '@/types/journal';

export interface UseChallengeReturn {
  /** Whether user is registered for a challenge */
  registered: boolean;
  /** Current registration data */
  registration: ChallengeRegistration | null;
  /** Current progress data */
  progress: ChallengeProgress | null;
  /** Available tiers */
  tiers: ChallengeTier[];
  /** Register for a challenge */
  register: (days: number, displayName: string, email: string) => ChallengeRegistration;
  /** Upgrade to a new tier */
  upgrade: (newDays: number) => ChallengeRegistration | null;
  /** Get popup to show after journal save */
  getPostJournalPopup: (streak: number, totalEntries: number) => PopupDecision | null;
  /** Dismiss popup for today */
  dismissPopup: () => void;
  /** Mark popup as clicked */
  markClicked: () => void;
  /** Whether popup was dismissed today */
  wasPopupDismissed: boolean;
  /** Save selected tier for pending registration */
  saveSelectedTier: (days: number) => void;
  /** Get selected tier */
  selectedTier: number | null;
  /** Set pending registration flag */
  setPendingRegistration: (pending: boolean) => void;
  /** Check if there's a pending registration */
  hasPendingRegistration: boolean;
  /** Get tier info */
  getTierInfo: typeof getTierInfo;
  /** Get tier features */
  getTierFeatures: typeof getTierFeatures;
  /** Get tier tagline */
  getTierTagline: typeof getTierTagline;
  /** Earned badges */
  badges: string[];
  /** Refresh state */
  refresh: () => void;
  /** Clear registration (for testing) */
  clearRegistration: () => void;
}

export function useChallenge(): UseChallengeReturn {
  const [registered, setRegistered] = useState(false);
  const [registration, setRegistration] = useState<ChallengeRegistration | null>(null);
  const [progress, setProgress] = useState<ChallengeProgress | null>(null);
  const [badges, setBadges] = useState<string[]>([]);
  const [wasPopupDismissed, setWasPopupDismissed] = useState(false);
  const [selectedTier, setSelectedTierState] = useState<number | null>(null);
  const [hasPending, setHasPending] = useState(false);

  // Load state from storage
  const loadState = useCallback(() => {
    setRegistered(isRegistered());
    setRegistration(getLocalRegistration());
    setBadges(getBadges());
    setWasPopupDismissed(wasPopupDismissedToday());
    setSelectedTierState(getSelectedTier());
    setHasPending(hasPendingRegistration());

    // Get streak from storage
    let streak = 0;
    if (typeof window !== 'undefined') {
      const streakData = localStorage.getItem('ark_user_streak');
      if (streakData) {
        const parsed = JSON.parse(streakData);
        streak = parsed.current || 0;
      }
    }
    setProgress(getChallengeProgress(streak));
  }, []);

  // Initial load
  useEffect(() => {
    loadState();
  }, [loadState]);

  // Register for a challenge
  const register = useCallback(
    (days: number, displayName: string, email: string): ChallengeRegistration => {
      const reg = createRegistration(displayName, email, days);
      setRegistration(reg);
      setRegistered(true);
      markPopupClicked();
      return reg;
    },
    []
  );

  // Upgrade to new tier
  const upgrade = useCallback((newDays: number): ChallengeRegistration | null => {
    const updated = extendChallenge(newDays);
    if (updated) {
      setRegistration(updated);
    }
    return updated;
  }, []);

  // Get post-journal popup
  const getPostJournalPopup = useCallback(
    (streak: number, totalEntries: number): PopupDecision | null => {
      return determinePostJournalPopup(streak, totalEntries);
    },
    []
  );

  // Dismiss popup
  const dismissPopup = useCallback(() => {
    dismissPopupToday();
    setWasPopupDismissed(true);
  }, []);

  // Mark popup clicked
  const markClicked = useCallback(() => {
    markPopupClicked();
  }, []);

  // Save selected tier
  const handleSaveSelectedTier = useCallback((days: number) => {
    saveSelectedTier(days);
    setSelectedTierState(days);
  }, []);

  // Set pending registration
  const handleSetPendingRegistration = useCallback((pending: boolean) => {
    setPendingRegistration(pending);
    setHasPending(pending);
  }, []);

  // Clear registration (for testing)
  const clearRegistrationHandler = useCallback(() => {
    clearLocalRegistration();
    setRegistered(false);
    setRegistration(null);
  }, []);

  // Refresh state
  const refresh = useCallback(() => {
    loadState();
  }, [loadState]);

  return {
    registered,
    registration,
    progress,
    tiers: getVisibleTiers(),
    register,
    upgrade,
    getPostJournalPopup,
    dismissPopup,
    markClicked,
    wasPopupDismissed,
    saveSelectedTier: handleSaveSelectedTier,
    selectedTier,
    setPendingRegistration: handleSetPendingRegistration,
    hasPendingRegistration: hasPending,
    getTierInfo,
    getTierFeatures,
    getTierTagline,
    badges,
    refresh,
    clearRegistration: clearRegistrationHandler,
  };
}
