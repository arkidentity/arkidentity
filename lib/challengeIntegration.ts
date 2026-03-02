/**
 * Challenge Integration - Popup rules and post-journal logic
 * Determines which popup to show after saving a journal entry
 */

import {
  isRegistered,
  getLocalRegistration,
  wasInvited,
  markInvited,
  getTierInfo,
  getNextTier,
  shouldShowUpgradeOffer,
  isMilestoneDay,
  isCompletionDay,
  isHalfwayDay,
  checkAndAwardBadge,
  getChallengeProgress,
} from './challenge';
import type { ChallengePopupType, ChallengeProgress } from '@/types/journal';

// Random encouragement messages
const ENCOURAGEMENT_MESSAGES = [
  { title: 'Great Job!', message: 'Keep building that habit!' },
  { title: "You're On Fire!", message: 'Another day closer to transformation.' },
  { title: 'Keep Going!', message: 'Small steps lead to big change.' },
  { title: 'Awesome Work!', message: 'God is doing something in you.' },
  { title: 'Momentum!', message: "You're building something beautiful." },
  { title: 'Faithful!', message: 'Every day counts. Keep showing up.' },
  { title: 'Well Done!', message: 'The Word is taking root in your heart.' },
];

export interface PopupDecision {
  type: ChallengePopupType;
  data: PopupData;
}

export interface PopupData {
  streak: number;
  targetDays: number;
  progress: ChallengeProgress;
  tierInfo?: ReturnType<typeof getTierInfo>;
  nextTier?: number | null;
  badgeAwarded?: number;
  encouragement?: { title: string; message: string };
  isFirstEntry?: boolean;
}

/**
 * Determine which popup to show after saving a journal entry
 *
 * Priority order:
 * 1. First entry + not registered → Challenge invitation
 * 2. Badge earned (streak >= target) → Badge popup
 * 3. Upgrade offer (1 day before completion) → Upgrade popup
 * 4. Milestone day (7, 14, 21, etc.) → Milestone popup
 * 5. Halfway point → Halfway celebration
 * 6. Default → Generic encouragement
 */
export function determinePostJournalPopup(
  streak: number,
  totalEntries: number
): PopupDecision | null {
  const progress = getChallengeProgress(streak);
  const registered = isRegistered();

  // 1. First entry + not registered → Challenge invitation
  if (totalEntries === 1 && !registered && !wasInvited()) {
    markInvited();
    return {
      type: 'invitation',
      data: {
        streak,
        targetDays: 0,
        progress,
        isFirstEntry: true,
      },
    };
  }

  // If not registered, show generic encouragement
  if (!registered) {
    return {
      type: 'encouragement',
      data: {
        streak,
        targetDays: 0,
        progress,
        encouragement: getRandomEncouragement(),
      },
    };
  }

  const registration = getLocalRegistration();
  if (!registration) {
    return null;
  }

  const targetDays = registration.currentDays;
  const tierInfo = getTierInfo(targetDays);

  // 2. Badge earned (streak >= target)
  if (streak >= targetDays && !registration.badgeAwarded) {
    const awarded = checkAndAwardBadge(streak);
    if (awarded) {
      return {
        type: 'badge',
        data: {
          streak,
          targetDays,
          progress,
          tierInfo,
          badgeAwarded: awarded,
          nextTier: getNextTier(targetDays),
        },
      };
    }
  }

  // 3. Upgrade offer (1 day before completion)
  if (shouldShowUpgradeOffer(targetDays, streak)) {
    return {
      type: 'upgrade',
      data: {
        streak,
        targetDays,
        progress,
        tierInfo,
        nextTier: getNextTier(targetDays),
      },
    };
  }

  // 4. Milestone day
  if (isMilestoneDay(targetDays, streak)) {
    return {
      type: 'milestone',
      data: {
        streak,
        targetDays,
        progress,
        tierInfo,
      },
    };
  }

  // 5. Halfway point
  if (isHalfwayDay(targetDays, streak)) {
    return {
      type: 'halfway',
      data: {
        streak,
        targetDays,
        progress,
        tierInfo,
      },
    };
  }

  // 6. Default: generic encouragement
  return {
    type: 'encouragement',
    data: {
      streak,
      targetDays,
      progress,
      tierInfo,
      encouragement: getRandomEncouragement(),
    },
  };
}

/**
 * Get a random encouragement message
 */
export function getRandomEncouragement(): { title: string; message: string } {
  return ENCOURAGEMENT_MESSAGES[Math.floor(Math.random() * ENCOURAGEMENT_MESSAGES.length)];
}

/**
 * Get tier features for registration UI
 */
export function getTierFeatures(days: number): string[] {
  const features: Record<number, string[]> = {
    7: [
      'Daily Scripture journaling with HEAD, HEART, HANDS',
      'Build your first streak',
      'Unlock the 7-day badge',
      'Option to upgrade to 21 days after completing',
    ],
    21: [
      'Daily Scripture journaling with HEAD, HEART, HANDS',
      'Form a lasting habit (21 days to build a habit)',
      'Unlock the 21-day badge',
      'Join the community leaderboard',
      'Option to upgrade to 50 days after completing',
    ],
    50: [
      'Daily Scripture journaling with HEAD, HEART, HANDS',
      'Deep spiritual transformation',
      'Unlock the prestigious 50-day badge',
      'Top leaderboard position',
      'Option to continue to 100 days after completing',
    ],
  };

  return features[days] || features[21];
}

/**
 * Get tier tagline
 */
export function getTierTagline(days: number): string {
  const taglines: Record<number, string> = {
    7: 'Build the Foundation',
    21: 'Form the Habit',
    50: 'Go All In',
    100: 'Pursue Excellence',
    365: 'Total Transformation',
  };

  return taglines[days] || taglines[21];
}
