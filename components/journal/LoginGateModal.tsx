'use client';

/**
 * LoginGateModal - Prompts user to sign in before saving
 * Shows when user tries to save while not logged in
 */

import { useEffect } from 'react';

export interface LoginGateModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Called when modal should close */
  onClose: () => void;
  /** Called when user wants to sign in */
  onSignIn: () => void;
  /** Called when user wants to continue without account */
  onContinueAsGuest?: () => void;
}

export function LoginGateModal({
  isOpen,
  onClose,
  onSignIn,
  onContinueAsGuest,
}: LoginGateModalProps) {
  // Lock body scroll when open
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

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70" />

      {/* Modal */}
      <div
        className="
          relative bg-[var(--ark-navy)] rounded-2xl
          max-w-sm w-full
          border border-white/10
          shadow-2xl
          overflow-hidden
        "
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-8 text-center bg-gradient-to-br from-[var(--ark-navy)] to-[#1e4a6b]">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-white/60 hover:text-white"
          >
            <svg
              className="w-6 h-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>

          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-[var(--ark-gold)]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>

          <h2 className="text-white font-bold text-xl">Sign In to Save</h2>
          <p className="text-white/60 text-sm mt-2">
            Create an account to save your journal entries and sync across devices
          </p>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Benefits */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 text-white/70 text-sm">
              <svg
                className="w-5 h-5 text-[var(--ark-gold)] shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Save unlimited journal entries</span>
            </div>
            <div className="flex items-center gap-3 text-white/70 text-sm">
              <svg
                className="w-5 h-5 text-[var(--ark-gold)] shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Sync across all your devices</span>
            </div>
            <div className="flex items-center gap-3 text-white/70 text-sm">
              <svg
                className="w-5 h-5 text-[var(--ark-gold)] shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Track your streak and earn badges</span>
            </div>
            <div className="flex items-center gap-3 text-white/70 text-sm">
              <svg
                className="w-5 h-5 text-[var(--ark-gold)] shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Join the 3D Bible Challenge</span>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={onSignIn}
              className="
                w-full py-3 rounded-lg font-semibold
                bg-[var(--ark-gold)] text-[var(--ark-navy)]
                hover:bg-[var(--ark-gold)]/90
                transition-colors
              "
            >
              Sign In / Create Account
            </button>

            {onContinueAsGuest && (
              <button
                type="button"
                onClick={onContinueAsGuest}
                className="
                  w-full py-2 text-white/50 text-sm
                  hover:text-white/70
                  transition-colors
                "
              >
                Continue without account
              </button>
            )}
          </div>

          {/* Note */}
          <p className="text-white/40 text-xs text-center mt-4">
            Your entry will be saved to this device. Sign in later to sync.
          </p>
        </div>
      </div>
    </div>
  );
}
