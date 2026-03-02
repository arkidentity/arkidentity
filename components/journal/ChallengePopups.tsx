'use client';

/**
 * ChallengePopups - All challenge-related popup modals
 * Includes: Invitation, Badge, Upgrade, Milestone, Halfway, Encouragement
 */

import { useEffect, useState } from 'react';
import {
  getTierInfo,
  getProgressPercentage,
  getDaysRemaining,
  getVisibleTiers,
} from '@/lib/challenge';
import { getTierFeatures, getTierTagline } from '@/lib/challengeIntegration';
import type { ChallengePopupType, ChallengeTier } from '@/types/journal';

// ============================================
// SHARED MODAL WRAPPER
// ============================================

interface ModalWrapperProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

function ModalWrapper({ isOpen, onClose, children }: ModalWrapperProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70" />
      <div
        className="relative bg-[var(--ark-navy)] rounded-2xl max-w-md w-full max-h-[90vh] flex flex-col border border-white/10 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

// ============================================
// INVITATION POPUP (First entry, not registered)
// ============================================

export interface InvitationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onStartChallenge: () => void;
}

export function InvitationPopup({ isOpen, onClose, onStartChallenge }: InvitationPopupProps) {
  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose}>
      {/* Header */}
      <div className="bg-gradient-to-br from-[var(--ark-maroon)] to-[#7a1a19] px-6 py-8 text-center">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-white/60 hover:text-white"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
        <div className="text-5xl mb-3">🔥</div>
        <h2 className="text-white font-bold text-xl">Great First Entry!</h2>
        <p className="text-white/70 text-sm mt-1">Ready to build a habit?</p>
      </div>

      {/* Body */}
      <div className="p-6 text-center">
        <p className="text-white/80 text-sm leading-relaxed mb-4">
          The <strong className="text-white">3D Bible Challenge</strong> helps you journal daily
          and go from distracted to devoted.
        </p>

        {/* Tier preview */}
        <div className="flex justify-center gap-4 mb-4">
          {[7, 21, 50].map((days) => (
            <div
              key={days}
              className={`
                px-4 py-3 rounded-lg
                ${days === 21 ? 'bg-[var(--ark-gold)]/20 border border-[var(--ark-gold)]/40' : 'bg-white/5'}
              `}
            >
              <div className={`text-xl font-bold ${days === 21 ? 'text-[var(--ark-gold)]' : 'text-white'}`}>
                {days}
              </div>
              <div className="text-white/50 text-xs">days</div>
            </div>
          ))}
        </div>

        <p className="text-white/50 text-xs">
          Choose your commitment level and earn badges!
        </p>
      </div>

      {/* Footer */}
      <div className="px-6 pb-6 space-y-3">
        <button
          type="button"
          onClick={onStartChallenge}
          className="w-full py-3 rounded-lg font-semibold bg-[var(--ark-gold)] text-[var(--ark-navy)] hover:bg-[var(--ark-gold)]/90 transition-colors"
        >
          Start the Challenge
        </button>
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2 text-white/60 text-sm hover:text-white/80 transition-colors"
        >
          Maybe Later
        </button>
      </div>
    </ModalWrapper>
  );
}

// ============================================
// TIER SELECTION POPUP
// ============================================

export interface TierSelectionPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTier: (days: number) => void;
}

export function TierSelectionPopup({ isOpen, onClose, onSelectTier }: TierSelectionPopupProps) {
  const tiers = getVisibleTiers();

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose}>
      {/* Header */}
      <div className="bg-gradient-to-br from-[var(--ark-maroon)] to-[#7a1a19] px-6 py-8 text-center">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-white/60 hover:text-white"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
        <div className="text-5xl mb-3">🔥</div>
        <h2 className="text-white font-bold text-xl">The 3D Bible Challenge</h2>
        <p className="text-white/70 text-sm mt-1">Pick your commitment level</p>
      </div>

      {/* Body */}
      <div className="p-6 space-y-3 overflow-y-auto">
        {tiers.map((tier) => (
          <TierCard
            key={tier.days}
            tier={tier}
            onClick={() => onSelectTier(tier.days)}
          />
        ))}

        <p className="text-white/40 text-xs text-center mt-4">
          You can level up to longer challenges after completing
        </p>
      </div>

      {/* Footer */}
      <div className="px-6 pb-6">
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2 text-white/60 text-sm hover:text-white/80 transition-colors"
        >
          Maybe Later
        </button>
      </div>
    </ModalWrapper>
  );
}

interface TierCardProps {
  tier: ChallengeTier;
  onClick: () => void;
}

function TierCard({ tier, onClick }: TierCardProps) {
  const tagline = getTierTagline(tier.days);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        w-full p-4 rounded-xl text-left
        border transition-all
        ${tier.recommended
          ? 'bg-[var(--ark-gold)]/10 border-[var(--ark-gold)]/40 hover:bg-[var(--ark-gold)]/20'
          : 'bg-white/5 border-white/10 hover:bg-white/10'
        }
      `}
    >
      {tier.recommended && (
        <span className="inline-block text-xs font-semibold text-[var(--ark-gold)] mb-2">
          ⭐ RECOMMENDED
        </span>
      )}
      <div className="flex items-center gap-4">
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-xl"
          style={{ backgroundColor: tier.color }}
        >
          {tier.days}
        </div>
        <div>
          <h3 className="text-white font-semibold">{tier.days}-Day Challenge</h3>
          <p className="text-white/60 text-sm">{tagline}</p>
        </div>
      </div>
    </button>
  );
}

// ============================================
// TIER CONFIRMATION POPUP
// ============================================

export interface TierConfirmationPopupProps {
  isOpen: boolean;
  selectedDays: number;
  onClose: () => void;
  onBack: () => void;
  onConfirm: () => void;
}

export function TierConfirmationPopup({
  isOpen,
  selectedDays,
  onClose,
  onBack,
  onConfirm,
}: TierConfirmationPopupProps) {
  const tierInfo = getTierInfo(selectedDays);
  const tagline = getTierTagline(selectedDays);
  const features = getTierFeatures(selectedDays);

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose}>
      {/* Header */}
      <div
        className="px-6 py-8 text-center"
        style={{ background: `linear-gradient(135deg, ${tierInfo.color}, ${tierInfo.color}dd)` }}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-white/60 hover:text-white"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
        <button
          type="button"
          onClick={onBack}
          className="absolute top-4 left-4 text-white/60 hover:text-white"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="w-16 h-16 mx-auto rounded-xl bg-white/20 flex items-center justify-center text-white font-bold text-2xl mb-3">
          {selectedDays}
        </div>
        <h2 className="text-white font-bold text-xl">{selectedDays}-Day Challenge</h2>
        <p className="text-white/70 text-sm mt-1">{tagline}</p>
      </div>

      {/* Body */}
      <div className="p-6 overflow-y-auto">
        <h3 className="text-white font-semibold text-sm mb-3">What You&apos;ll Get:</h3>
        <ul className="space-y-2 mb-6">
          {features.map((feature, i) => (
            <li key={i} className="flex items-start gap-2 text-white/70 text-sm">
              <span className="text-[var(--ark-gold)] shrink-0">✓</span>
              {feature}
            </li>
          ))}
        </ul>

        <div className="bg-white/5 rounded-lg p-4 text-center">
          <p className="text-white/80 text-sm">
            Starting today means journaling every day for{' '}
            <strong className="text-white">{selectedDays} days</strong>.
          </p>
          <p className="text-[var(--ark-gold)] text-sm font-medium mt-2">
            You&apos;ve got this!
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 pb-6 space-y-3">
        <button
          type="button"
          onClick={onConfirm}
          className="w-full py-3 rounded-lg font-semibold bg-[var(--ark-gold)] text-[var(--ark-navy)] hover:bg-[var(--ark-gold)]/90 transition-colors"
        >
          Start My {selectedDays}-Day Challenge
        </button>
        <button
          type="button"
          onClick={onBack}
          className="w-full py-2 text-white/60 text-sm hover:text-white/80 transition-colors"
        >
          Choose a different challenge
        </button>
      </div>
    </ModalWrapper>
  );
}

// ============================================
// ENCOURAGEMENT POPUP (Default post-journal)
// ============================================

export interface EncouragementPopupProps {
  isOpen: boolean;
  streak: number;
  targetDays: number;
  title: string;
  message: string;
  onClose: () => void;
  onShare?: () => void;
}

export function EncouragementPopup({
  isOpen,
  streak,
  targetDays,
  title,
  message,
  onClose,
  onShare,
}: EncouragementPopupProps) {
  const displayStreak = streak > 0 ? streak : 1;
  const progressPercent = targetDays > 0 ? getProgressPercentage(targetDays, displayStreak) : 0;

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose}>
      {/* Header */}
      <div className="bg-gradient-to-br from-[var(--ark-navy)] to-[#1e4a6b] px-6 py-6 text-center">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-white/60 hover:text-white"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
        <h2 className="text-white font-bold text-xl">🎉 {title}</h2>
      </div>

      {/* Body */}
      <div className="p-6 text-center">
        <p className="text-white/80 text-lg mb-6">{message}</p>

        {/* Streak display */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="text-3xl">🔥</span>
          <span className="text-4xl font-bold text-[var(--ark-gold)]">{displayStreak}</span>
          <span className="text-white/50 text-sm">Day Streak</span>
        </div>

        {/* Progress bar (if in challenge) */}
        {targetDays > 0 && (
          <div className="mt-4">
            <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-gradient-to-r from-[var(--ark-gold)] to-[var(--hands)] rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-white/50 text-xs">
              {displayStreak} of {targetDays} days
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 pb-6 space-y-3">
        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 rounded-lg font-semibold bg-[var(--ark-gold)] text-[var(--ark-navy)] hover:bg-[var(--ark-gold)]/90 transition-colors"
        >
          Keep Going!
        </button>
        {onShare && (
          <button
            type="button"
            onClick={onShare}
            className="w-full py-2 text-white/60 text-sm hover:text-white/80 transition-colors"
          >
            Share What You Wrote
          </button>
        )}
      </div>
    </ModalWrapper>
  );
}

// ============================================
// MILESTONE POPUP
// ============================================

export interface MilestonePopupProps {
  isOpen: boolean;
  streak: number;
  targetDays: number;
  onClose: () => void;
}

export function MilestonePopup({ isOpen, streak, targetDays, onClose }: MilestonePopupProps) {
  const tierInfo = getTierInfo(targetDays);
  const daysRemaining = getDaysRemaining(targetDays, streak);

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose}>
      {/* Header */}
      <div
        className="px-6 py-8 text-center"
        style={{ background: `linear-gradient(135deg, ${tierInfo.color}, ${tierInfo.color}dd)` }}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-white/60 hover:text-white"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
        <h2 className="text-white font-bold text-xl">🌟 Day {streak}!</h2>
        <p className="text-white/70 text-sm mt-1">Incredible Consistency</p>
      </div>

      {/* Body */}
      <div className="p-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="text-4xl">🔥</span>
          <span className="text-5xl font-bold text-[var(--ark-gold)]">{streak}</span>
        </div>

        <p className="text-white/80">
          {streak} days of faithfulness! Only {daysRemaining} more to complete your challenge.
        </p>
      </div>

      {/* Footer */}
      <div className="px-6 pb-6">
        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 rounded-lg font-semibold bg-[var(--ark-gold)] text-[var(--ark-navy)] hover:bg-[var(--ark-gold)]/90 transition-colors"
        >
          Keep Going!
        </button>
      </div>
    </ModalWrapper>
  );
}

// ============================================
// HALFWAY POPUP
// ============================================

export interface HalfwayPopupProps {
  isOpen: boolean;
  streak: number;
  targetDays: number;
  onClose: () => void;
}

export function HalfwayPopup({ isOpen, streak, targetDays, onClose }: HalfwayPopupProps) {
  const tierInfo = getTierInfo(targetDays);
  const daysRemaining = getDaysRemaining(targetDays, streak);

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose}>
      {/* Header */}
      <div
        className="px-6 py-8 text-center"
        style={{ background: `linear-gradient(135deg, ${tierInfo.color}, ${tierInfo.color}dd)` }}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-white/60 hover:text-white"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
        <h2 className="text-white font-bold text-xl">🔥 Halfway There!</h2>
        <p className="text-white/70 text-sm mt-1">Day {streak} of {targetDays}</p>
      </div>

      {/* Body */}
      <div className="p-6 text-center">
        <div className="text-6xl mb-4">🔥</div>

        <p className="text-white/80 mb-4">
          You&apos;re at the halfway point! {daysRemaining} days to go.
        </p>

        {/* Progress bar */}
        <div className="h-3 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[var(--ark-gold)] to-[var(--hands)] rounded-full w-1/2" />
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 pb-6">
        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 rounded-lg font-semibold bg-[var(--ark-gold)] text-[var(--ark-navy)] hover:bg-[var(--ark-gold)]/90 transition-colors"
        >
          Keep Pushing!
        </button>
      </div>
    </ModalWrapper>
  );
}

// ============================================
// UPGRADE OFFER POPUP
// ============================================

export interface UpgradeOfferPopupProps {
  isOpen: boolean;
  currentDays: number;
  nextTierDays: number;
  streak: number;
  onClose: () => void;
  onUpgrade: () => void;
}

export function UpgradeOfferPopup({
  isOpen,
  currentDays,
  nextTierDays,
  streak,
  onClose,
  onUpgrade,
}: UpgradeOfferPopupProps) {
  const nextTierInfo = getTierInfo(nextTierDays);

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose}>
      {/* Header */}
      <div className="bg-gradient-to-br from-[var(--ark-gold)] to-[#d4a04a] px-6 py-8 text-center">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-[var(--ark-navy)]/60 hover:text-[var(--ark-navy)]"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
        <h2 className="text-[var(--ark-navy)] font-bold text-xl">🔥 One Day Left!</h2>
        <p className="text-[var(--ark-navy)]/70 text-sm mt-1">Day {streak} of {currentDays}</p>
      </div>

      {/* Body */}
      <div className="p-6 text-center">
        <p className="text-white/80 mb-6">
          You&apos;re about to complete your {currentDays}-day challenge!
          <br />
          Want to keep the momentum going?
        </p>

        {/* Next tier preview */}
        <div className="flex items-center gap-4 bg-white/5 rounded-xl p-4 mb-4">
          <div
            className="w-16 h-16 rounded-xl flex items-center justify-center text-white font-bold text-2xl"
            style={{ backgroundColor: nextTierInfo.color }}
          >
            {nextTierDays}
          </div>
          <div className="text-left">
            <div className="text-white font-semibold">{nextTierDays}-Day Challenge</div>
            <div className="text-white/60 text-sm">{nextTierInfo.label}</div>
          </div>
        </div>

        <p className="text-white/60 text-sm">
          Your streak continues seamlessly. Day {streak + 1} becomes Day {streak + 1} of {nextTierDays}.
        </p>
      </div>

      {/* Footer */}
      <div className="px-6 pb-6 space-y-3">
        <button
          type="button"
          onClick={onUpgrade}
          className="w-full py-3 rounded-lg font-semibold bg-[var(--ark-gold)] text-[var(--ark-navy)] hover:bg-[var(--ark-gold)]/90 transition-colors"
        >
          Yes, Level Up to {nextTierDays} Days!
        </button>
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2 text-white/60 text-sm hover:text-white/80 transition-colors"
        >
          Finish at {currentDays} Days
        </button>
      </div>
    </ModalWrapper>
  );
}

// ============================================
// BADGE AWARD POPUP
// ============================================

export interface BadgeAwardPopupProps {
  isOpen: boolean;
  awardedDays: number;
  nextTierDays: number | null;
  onClose: () => void;
  onContinue?: () => void;
}

export function BadgeAwardPopup({
  isOpen,
  awardedDays,
  nextTierDays,
  onClose,
  onContinue,
}: BadgeAwardPopupProps) {
  const tierInfo = getTierInfo(awardedDays);

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose}>
      {/* Header */}
      <div className="bg-gradient-to-br from-[var(--ark-gold)] to-[#d4a04a] px-6 py-8 text-center">
        <h2 className="text-[var(--ark-navy)] font-bold text-xl">🏆 Challenge Complete!</h2>
        <p className="text-[var(--ark-navy)]/70 text-sm mt-1">{awardedDays}-Day Badge Earned</p>
      </div>

      {/* Body */}
      <div className="p-6 text-center">
        {/* Badge celebration */}
        <div className="relative mb-6">
          <div
            className="w-24 h-24 mx-auto rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-lg"
            style={{ backgroundColor: tierInfo.color }}
          >
            {awardedDays}
          </div>
          <div className="absolute inset-0 flex items-center justify-center animate-ping opacity-30">
            <div
              className="w-24 h-24 rounded-2xl"
              style={{ backgroundColor: tierInfo.color }}
            />
          </div>
        </div>

        <p className="text-white/80 mb-4">
          {awardedDays} days of faithfulness. You went from distracted to devoted!
        </p>

        {/* TODO: Testimony prompt for >= 21 days */}
      </div>

      {/* Footer */}
      <div className="px-6 pb-6 space-y-3">
        {nextTierDays && onContinue ? (
          <>
            <button
              type="button"
              onClick={onContinue}
              className="w-full py-3 rounded-lg font-semibold bg-[var(--ark-gold)] text-[var(--ark-navy)] hover:bg-[var(--ark-gold)]/90 transition-colors"
            >
              Continue to {nextTierDays} Days
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2 text-white/60 text-sm hover:text-white/80 transition-colors"
            >
              I&apos;m Done For Now
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-lg font-semibold bg-[var(--ark-gold)] text-[var(--ark-navy)] hover:bg-[var(--ark-gold)]/90 transition-colors"
          >
            Amazing Work!
          </button>
        )}
      </div>
    </ModalWrapper>
  );
}
