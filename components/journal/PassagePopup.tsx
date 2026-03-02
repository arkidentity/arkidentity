'use client';

/**
 * PassagePopup - Full passage display with "What does this mean?" explanation
 * Shows the complete scripture passage text in a modal
 */

import { useEffect } from 'react';

export interface PassagePopupProps {
  /** Whether the popup is open */
  isOpen: boolean;
  /** The full passage text with verse numbers */
  passage: string;
  /** Bible reference shown in the header, e.g. "Proverbs 3:1-8" */
  reference?: string;
  /** Optional explanation ("What does this mean?") */
  explanation?: string;
  /** Called when popup should close */
  onClose: () => void;
}

export function PassagePopup({
  isOpen,
  passage,
  reference,
  explanation,
  onClose,
}: PassagePopupProps) {
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
          max-w-lg w-full max-h-[80vh]
          flex flex-col
          border border-white/10
          shadow-2xl
        "
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
          <h2 className="text-white font-semibold text-lg">{reference || 'Scripture Passage'}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 -mr-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <svg
              className="w-5 h-5 text-white/60"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Passage text */}
          <div className="space-y-3">
            <div
              className="text-white/90 text-lg leading-relaxed passage-content"
              dangerouslySetInnerHTML={{ __html: passage }}
            />
          </div>

          {/* What does this mean? */}
          {explanation && (
            <div className="space-y-3 pt-4 border-t border-white/10">
              <h3 className="text-[var(--ark-gold)] font-semibold text-sm uppercase tracking-wide flex items-center gap-2">
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" />
                </svg>
                What does this mean?
              </h3>
              <p className="text-white/70 text-sm leading-relaxed">
                {explanation}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-white/10 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="
              w-full py-3 rounded-lg font-semibold
              bg-white/10 text-white
              hover:bg-white/20
              transition-colors
            "
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
