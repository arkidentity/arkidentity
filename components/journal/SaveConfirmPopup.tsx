'use client';

/**
 * SaveConfirmPopup - Shows after successfully saving a journal entry
 * Offers options to keep journaling or view archive
 */

import { useEffect } from 'react';

export interface SaveConfirmPopupProps {
  /** Scripture reference that was saved */
  scripture: string;
  /** Called when user wants to keep journaling */
  onKeepJournaling: () => void;
  /** Called when user wants to view archive */
  onViewArchive: () => void;
  // TODO: Future - onShareWithCommunity for community sharing feature
}

export function SaveConfirmPopup({
  scripture,
  onKeepJournaling,
  onViewArchive,
}: SaveConfirmPopupProps) {
  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onKeepJournaling}
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
        <div className="bg-gradient-to-br from-[var(--ark-gold)] to-[#d4a04a] px-6 py-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-[var(--ark-navy)]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 className="text-[var(--ark-navy)] font-bold text-xl">Entry Saved!</h2>
          <p className="text-[var(--ark-navy)]/70 text-sm mt-1">{scripture}</p>
        </div>

        {/* Body */}
        <div className="p-6 text-center">
          <p className="text-white/70 text-sm mb-6">
            Your journal entry has been saved. What would you like to do next?
          </p>

          {/* Actions */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={onKeepJournaling}
              className="
                w-full py-3 rounded-lg font-semibold
                bg-[var(--ark-gold)] text-[var(--ark-navy)]
                hover:bg-[var(--ark-gold)]/90
                transition-colors
              "
            >
              Keep Journaling
            </button>

            <button
              type="button"
              onClick={onViewArchive}
              className="
                w-full py-3 rounded-lg font-medium
                bg-white/10 text-white
                hover:bg-white/20
                transition-colors
              "
            >
              View Journal Archive
            </button>

            {/* TODO: Future - Share with Community button */}
            {/* Placeholder for future community sharing feature */}
          </div>
        </div>
      </div>
    </div>
  );
}
