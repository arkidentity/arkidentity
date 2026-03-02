'use client';

/**
 * JournalViewModal - Displays a saved journal entry
 * Shows scripture + HEAD/HEART/HANDS in a readable format
 */

import { useEffect } from 'react';
import { getVersionName } from '@/lib/bibleData';
import type { JournalEntry } from '@/types/journal';

export interface JournalViewModalProps {
  /** The entry to display */
  entry: JournalEntry | null;
  /** Whether the modal is open */
  isOpen: boolean;
  /** Called when modal should close */
  onClose: () => void;
  /** Called when user wants to edit */
  onEdit?: (entry: JournalEntry) => void;
  /** Called when user wants to delete */
  onDelete?: (entry: JournalEntry) => void;
}

export function JournalViewModal({
  entry,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}: JournalViewModalProps) {
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

  if (!isOpen || !entry) {
    return null;
  }

  const createdDate = new Date(entry.createdAt).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const versionName = getVersionName(entry.bibleVersion);

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
          max-w-lg w-full max-h-[90vh]
          flex flex-col
          border border-white/10
          shadow-2xl
        "
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
          <div>
            <h2 className="text-white font-semibold text-lg">{entry.scripture}</h2>
            <p className="text-white/50 text-xs mt-0.5">{createdDate}</p>
          </div>
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
          {/* Scripture passage */}
          {entry.scripturePassage && (
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div
                className="text-white/80 text-sm leading-relaxed passage-content"
                dangerouslySetInnerHTML={{ __html: entry.scripturePassage }}
              />
              <p className="text-white/40 text-xs mt-2">{versionName}</p>
            </div>
          )}

          {/* HEAD */}
          {entry.head && (
            <DimensionSection
              badge="1D"
              title="HEAD"
              subtitle="Information"
              content={entry.head}
              colorClass="bg-[var(--head)]"
            />
          )}

          {/* HEART */}
          {entry.heart && (
            <DimensionSection
              badge="2D"
              title="HEART"
              subtitle="Transformation"
              content={entry.heart}
              colorClass="bg-[var(--heart)]"
            />
          )}

          {/* HANDS */}
          {entry.hands && (
            <DimensionSection
              badge="3D"
              title="HANDS"
              subtitle="Activation"
              content={entry.hands}
              colorClass="bg-[var(--hands)]"
            />
          )}
        </div>

        {/* Footer with actions */}
        <div className="px-5 py-4 border-t border-white/10 shrink-0 flex gap-3">
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(entry)}
              className="
                px-4 py-2.5 rounded-lg font-medium
                bg-red-500/20 text-red-300
                hover:bg-red-500/30
                transition-colors
              "
            >
              Delete
            </button>
          )}
          <div className="flex-1" />
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(entry)}
              className="
                px-4 py-2.5 rounded-lg font-medium
                bg-[var(--ark-gold)] text-[var(--ark-navy)]
                hover:bg-[var(--ark-gold)]/90
                transition-colors
              "
            >
              Edit Entry
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

interface DimensionSectionProps {
  badge: string;
  title: string;
  subtitle: string;
  content: string;
  colorClass: string;
}

function DimensionSection({ badge, title, subtitle, content, colorClass }: DimensionSectionProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <span
          className={`
            ${colorClass}
            w-8 h-8 rounded-lg flex items-center justify-center
            text-white font-bold text-xs shrink-0
          `}
        >
          {badge}
        </span>
        <div>
          <h3 className="text-white font-semibold text-sm">{title}</h3>
          <p className="text-white/50 text-xs">{subtitle}</p>
        </div>
      </div>
      <p className="text-white/80 text-sm leading-relaxed pl-11 whitespace-pre-wrap">
        {content}
      </p>
    </div>
  );
}
