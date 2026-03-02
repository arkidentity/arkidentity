/**
 * Challenge - Core logic for 3D Bible Challenge
 * Multi-tier system: 7, 21, 50, 100, 365 days
 */

import type { ChallengeTier, ChallengeRegistration, ChallengeProgress, UserStreak } from '@/types/journal';

// ============================================
// CONFIGURATION
// ============================================

export const CHALLENGE_TIERS: Record<number, ChallengeTier> = {
  7: { days: 7, level: 1, color: '#143348', name: 'navy', label: 'Foundation' },
  21: { days: 21, level: 2, color: '#5f0c0b', name: 'maroon', label: 'Commitment', recommended: true },
  50: { days: 50, level: 3, color: '#e8b562', name: 'gold', label: 'Achievement' },
  100: { days: 100, level: 4, color: '#0369a1', name: 'ocean-blue', label: 'Excellence', hidden: true },
  365: { days: 365, level: 5, color: '#047857', name: 'deep-emerald', label: 'Transformation', hidden: true },
};

// When to offer next tier (1 day before completion)
export const UPGRADE_PATHS: Record<number, { offerAt: number; nextTier: number | null }> = {
  7: { offerAt: 6, nextTier: 21 },
  21: { offerAt: 20, nextTier: 50 },
  50: { offerAt: 49, nextTier: 100 },
  100: { offerAt: 99, nextTier: 365 },
  365: { offerAt: 364, nextTier: null },
};

// Milestone days for special popups
export const MILESTONES: Record<number, number[]> = {
  7: [6, 7],
  21: [10, 20, 21],
  50: [25, 49, 50],
  100: [50, 99, 100],
  365: [100, 200, 300, 364, 365],
};

// Storage keys
const STORAGE_KEYS = {
  REGISTRATION: 'challenge_registration',
  BADGES: 'challenge_badges',
  POPUP_CLICKED: 'challenge_popup_clicked',
  POPUP_DISMISSED: 'challenge_popup_dismissed',
  SELECTED_TIER: 'challenge_selected_tier',
  PENDING_REGISTRATION: 'challenge_pending_registration',
  INVITED: 'ark_challenge_invited',
};

// ============================================
// TIER UTILITIES
// ============================================

/**
 * Get tier info for a given number of days
 */
export function getTierInfo(days: number): ChallengeTier {
  return CHALLENGE_TIERS[days] || CHALLENGE_TIERS[7];
}

/**
 * Get visible tiers (not hidden)
 */
export function getVisibleTiers(): ChallengeTier[] {
  return Object.values(CHALLENGE_TIERS).filter(t => !t.hidden);
}

/**
 * Get next tier after current
 */
export function getNextTier(currentDays: number): number | null {
  return UPGRADE_PATHS[currentDays]?.nextTier || null;
}

/**
 * Check if should show upgrade offer
 */
export function shouldShowUpgradeOffer(currentDays: number, streak: number): boolean {
  const path = UPGRADE_PATHS[currentDays];
  return path?.offerAt === streak;
}

/**
 * Check if today is a milestone day
 */
export function isMilestoneDay(currentDays: number, streak: number): boolean {
  const milestones = MILESTONES[currentDays] || [];
  return milestones.includes(streak);
}

/**
 * Check if today is completion day
 */
export function isCompletionDay(currentDays: number, streak: number): boolean {
  return streak === currentDays;
}

/**
 * Check if today is halfway day
 */
export function isHalfwayDay(currentDays: number, streak: number): boolean {
  return streak === Math.floor(currentDays / 2);
}

/**
 * Get progress percentage
 */
export function getProgressPercentage(currentDays: number, streak: number): number {
  if (!currentDays) return 0;
  return Math.min((streak / currentDays) * 100, 100);
}

/**
 * Get days remaining
 */
export function getDaysRemaining(currentDays: number, streak: number): number {
  return Math.max(currentDays - streak, 0);
}

// ============================================
// REGISTRATION
// ============================================

/**
 * Save registration to local storage
 */
export function saveLocalRegistration(registration: ChallengeRegistration): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.REGISTRATION, JSON.stringify(registration));
  }
}

/**
 * Get registration from local storage
 */
export function getLocalRegistration(): ChallengeRegistration | null {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem(STORAGE_KEYS.REGISTRATION);
  return data ? JSON.parse(data) : null;
}

/**
 * Clear registration from local storage
 */
export function clearLocalRegistration(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEYS.REGISTRATION);
  }
}

/**
 * Check if user is registered
 */
export function isRegistered(): boolean {
  return getLocalRegistration() !== null;
}

/**
 * Create a new registration
 */
export function createRegistration(
  displayName: string,
  email: string,
  initialDays: number,
  userId: string | null = null
): ChallengeRegistration {
  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + initialDays - 1);

  const registration: ChallengeRegistration = {
    id: `local_${Date.now()}`,
    userId,
    challengeName: 'The 3D Bible Challenge',
    initialDays,
    currentDays: initialDays,
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    displayName,
    email,
    completed: false,
    badgeAwarded: false,
    createdAt: new Date().toISOString(),
  };

  saveLocalRegistration(registration);
  return registration;
}

/**
 * Extend/upgrade challenge to new tier
 */
export function extendChallenge(newDays: number): ChallengeRegistration | null {
  const registration = getLocalRegistration();
  if (!registration) return null;

  const startDate = new Date(registration.startDate);
  const newEndDate = new Date(startDate);
  newEndDate.setDate(newEndDate.getDate() + newDays - 1);

  const updated: ChallengeRegistration = {
    ...registration,
    currentDays: newDays,
    endDate: newEndDate.toISOString().split('T')[0],
    completed: false,
    badgeAwarded: false,
  };

  saveLocalRegistration(updated);
  return updated;
}

// ============================================
// BADGES
// ============================================

/**
 * Get earned badges
 */
export function getBadges(): string[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEYS.BADGES);
  return data ? JSON.parse(data) : [];
}

/**
 * Check if user has a specific badge
 */
export function hasBadge(days: number): boolean {
  return getBadges().includes(`${days}day`);
}

/**
 * Award a badge
 */
export function awardBadge(days: number): boolean {
  const badgeName = `${days}day`;
  const badges = getBadges();

  if (!badges.includes(badgeName)) {
    badges.push(badgeName);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.BADGES, JSON.stringify(badges));
    }

    // Update registration
    const registration = getLocalRegistration();
    if (registration) {
      registration.completed = true;
      registration.badgeAwarded = true;
      saveLocalRegistration(registration);
    }

    return true;
  }

  return false;
}

/**
 * Check and award badge if streak meets target
 */
export function checkAndAwardBadge(streak: number): number | null {
  const registration = getLocalRegistration();
  if (!registration) return null;

  const targetDays = registration.currentDays;

  if (streak >= targetDays && !registration.badgeAwarded) {
    if (awardBadge(targetDays)) {
      return targetDays;
    }
  }

  return null;
}

// ============================================
// PROGRESS
// ============================================

/**
 * Get current challenge progress
 */
export function getChallengeProgress(streak: number): ChallengeProgress {
  const registration = getLocalRegistration();
  const badges = getBadges();

  // Get streak from storage if not provided
  if (typeof window !== 'undefined' && !streak) {
    const streakData = localStorage.getItem('ark_user_streak');
    if (streakData) {
      const parsed = JSON.parse(streakData);
      streak = parsed.current || 0;
    }
  }

  // Get total entries
  let totalEntries = 0;
  if (typeof window !== 'undefined') {
    const entries = localStorage.getItem('ark_journal_entries');
    if (entries) {
      totalEntries = JSON.parse(entries).length;
    }
  }

  // Get longest streak
  let longestStreak = streak;
  if (typeof window !== 'undefined') {
    const streakData = localStorage.getItem('ark_user_streak');
    if (streakData) {
      const parsed = JSON.parse(streakData);
      longestStreak = parsed.longest || streak;
    }
  }

  return {
    registration,
    currentStreak: streak,
    longestStreak,
    totalEntries,
    badges,
  };
}

// ============================================
// POPUP STATE
// ============================================

/**
 * Check if popup was dismissed today
 */
export function wasPopupDismissedToday(): boolean {
  if (typeof window === 'undefined') return false;
  const dismissed = localStorage.getItem(STORAGE_KEYS.POPUP_DISMISSED);
  const today = new Date().toISOString().split('T')[0];
  return dismissed === today;
}

/**
 * Mark popup as dismissed for today
 */
export function dismissPopupToday(): void {
  if (typeof window !== 'undefined') {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(STORAGE_KEYS.POPUP_DISMISSED, today);
  }
}

/**
 * Mark popup as clicked (user engaged)
 */
export function markPopupClicked(): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.POPUP_CLICKED, 'true');
  }
}

/**
 * Check if user was already invited to challenge
 */
export function wasInvited(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEYS.INVITED) === 'true';
}

/**
 * Mark user as invited
 */
export function markInvited(): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.INVITED, 'true');
  }
}

/**
 * Save selected tier
 */
export function saveSelectedTier(days: number): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.SELECTED_TIER, days.toString());
  }
}

/**
 * Get selected tier
 */
export function getSelectedTier(): number | null {
  if (typeof window === 'undefined') return null;
  const tier = localStorage.getItem(STORAGE_KEYS.SELECTED_TIER);
  return tier ? parseInt(tier, 10) : null;
}

/**
 * Set pending registration flag
 */
export function setPendingRegistration(pending: boolean): void {
  if (typeof window !== 'undefined') {
    if (pending) {
      localStorage.setItem(STORAGE_KEYS.PENDING_REGISTRATION, 'true');
    } else {
      localStorage.removeItem(STORAGE_KEYS.PENDING_REGISTRATION);
    }
  }
}

/**
 * Check if there's a pending registration
 */
export function hasPendingRegistration(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEYS.PENDING_REGISTRATION) === 'true';
}
