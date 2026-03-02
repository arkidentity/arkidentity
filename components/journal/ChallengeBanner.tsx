'use client';

/**
 * ChallengeBanner - Shows challenge progress or invitation
 * Displays at top of journal page
 */

import { getTierInfo, getProgressPercentage, getDaysRemaining } from '@/lib/challenge';
import type { ChallengeProgress } from '@/types/journal';

export interface ChallengeBannerProps {
  /** Current progress (null if not registered) */
  progress: ChallengeProgress | null;
  /** Called when banner is tapped */
  onTap: () => void;
}

export function ChallengeBanner({ progress, onTap }: ChallengeBannerProps) {
  // Not registered - show invitation
  if (!progress?.registration) {
    return (
      <button
        type="button"
        onClick={onTap}
        className="w-full bg-[var(--ark-gold)] text-left hover:bg-[var(--ark-gold)]/90 transition-all"
      >
        <div className="max-w-2xl mx-auto flex items-center justify-between py-3 px-4">
          <span className="text-[var(--ark-navy)] font-semibold text-sm">Join a 3D Bible Challenge</span>
          <div className="flex items-center gap-2">
            <span className="text-[var(--ark-navy)] font-medium text-sm">7, 21, or 50 Days</span>
            <svg
              className="w-4 h-4 text-[var(--ark-navy)]"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M6 3l5 5-5 5" />
            </svg>
          </div>
        </div>
      </button>
    );
  }

  // Registered - show progress
  const { registration, currentStreak } = progress;
  const targetDays = registration.currentDays;
  const tierInfo = getTierInfo(targetDays);
  const progressPercent = getProgressPercentage(targetDays, currentStreak);
  const daysRemaining = getDaysRemaining(targetDays, currentStreak);

  return (
    <button
      type="button"
      onClick={onTap}
      className="w-full bg-[var(--ark-gold)] text-left hover:bg-[var(--ark-gold)]/90 transition-all"
    >
      {/* Compact progress display */}
      <div className="max-w-2xl mx-auto flex items-center justify-between py-3 px-4">
        <span className="text-[var(--ark-navy)] font-semibold text-sm">
          {targetDays}-Day Challenge - Day {currentStreak}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[var(--ark-navy)] font-bold text-sm">
            {progressPercent}%
          </span>
          <svg
            className="w-4 h-4 text-[var(--ark-navy)]"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M6 3l5 5-5 5" />
          </svg>
        </div>
      </div>
    </button>
  );
}
