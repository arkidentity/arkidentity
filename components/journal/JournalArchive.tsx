'use client';

/**
 * JournalArchive - List of saved journal entries
 * Shows entries grouped by date with view/edit/delete actions
 */

import { useState, useEffect } from 'react';
import { getJournalEntries, deleteJournalEntry } from '@/lib/journalStorage';
import { JournalViewModal } from './JournalViewModal';
import type { JournalEntry } from '@/types/journal';

export interface JournalArchiveProps {
  /** Called when user wants to edit an entry */
  onEdit?: (entry: JournalEntry) => void;
  /** Called to show info modal */
  onShowInfo?: () => void;
  /** Refresh trigger (increment to refresh list) */
  refreshTrigger?: number;
}

export function JournalArchive({
  onEdit,
  onShowInfo,
  refreshTrigger = 0,
}: JournalArchiveProps) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [viewingEntry, setViewingEntry] = useState<JournalEntry | null>(null);
  const [deleteConfirmEntry, setDeleteConfirmEntry] = useState<JournalEntry | null>(null);

  // Load entries
  useEffect(() => {
    loadEntries();
  }, [refreshTrigger]);

  const loadEntries = () => {
    const allEntries = getJournalEntries();
    // Sort by created date, newest first
    const sorted = allEntries.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    setEntries(sorted);
  };

  // Handle view
  const handleView = (entry: JournalEntry) => {
    setViewingEntry(entry);
  };

  // Handle edit (close modal and call parent)
  const handleEdit = (entry: JournalEntry) => {
    setViewingEntry(null);
    onEdit?.(entry);
  };

  // Handle delete confirmation
  const handleDeleteClick = (entry: JournalEntry) => {
    setViewingEntry(null);
    setDeleteConfirmEntry(entry);
  };

  // Confirm delete
  const confirmDelete = () => {
    if (deleteConfirmEntry) {
      deleteJournalEntry(deleteConfirmEntry.id);
      setDeleteConfirmEntry(null);
      loadEntries();
    }
  };

  // Cancel delete
  const cancelDelete = () => {
    setDeleteConfirmEntry(null);
  };

  // Group entries by date
  const groupedEntries = groupEntriesByDate(entries);

  // Empty state
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-16 h-16 mb-4 rounded-full bg-white/10 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-white/40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
        </div>
        <h3 className="text-white font-semibold text-lg mb-2">No Journal Entries Yet</h3>
        <p className="text-white/60 text-sm mb-6 max-w-xs">
          Start your 3D Bible study journey by creating your first journal entry.
        </p>
        {onShowInfo && (
          <button
            type="button"
            onClick={onShowInfo}
            className="text-[var(--ark-gold)] text-sm font-medium hover:underline flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" />
            </svg>
            What is the 3D Journal?
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {groupedEntries.map(group => (
          <div key={group.label}>
            {/* Date header */}
            <h3 className="text-white/60 text-xs font-medium uppercase tracking-wide px-4 mb-2">
              {group.label}
            </h3>

            {/* Entries for this date */}
            <div className="space-y-2">
              {group.entries.map(entry => (
                <ArchiveEntryCard
                  key={entry.id}
                  entry={entry}
                  onView={() => handleView(entry)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* View Modal */}
      <JournalViewModal
        entry={viewingEntry}
        isOpen={viewingEntry !== null}
        onClose={() => setViewingEntry(null)}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirmEntry && (
        <DeleteConfirmModal
          entry={deleteConfirmEntry}
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />
      )}
    </>
  );
}

interface ArchiveEntryCardProps {
  entry: JournalEntry;
  onView: () => void;
}

function ArchiveEntryCard({ entry, onView }: ArchiveEntryCardProps) {
  // Get a preview of the entry content
  const getPreview = (): string => {
    if (entry.head) return truncate(entry.head, 80);
    if (entry.heart) return truncate(entry.heart, 80);
    if (entry.hands) return truncate(entry.hands, 80);
    return 'No content';
  };

  // Count dimensions filled
  const dimensionCount = [entry.head, entry.heart, entry.hands].filter(Boolean).length;

  return (
    <button
      type="button"
      onClick={onView}
      className="
        w-full text-left p-4 rounded-xl
        bg-white/5 border border-white/10
        hover:bg-white/10 transition-colors
      "
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="text-white font-medium truncate">{entry.scripture}</h4>
          <p className="text-white/60 text-sm mt-1 line-clamp-2">{getPreview()}</p>
        </div>
        <div className="shrink-0 flex flex-col items-end gap-1">
          <span className="text-white/40 text-xs">
            {formatTime(entry.createdAt)}
          </span>
          <div className="flex gap-1">
            {[1, 2, 3].map(d => (
              <span
                key={d}
                className={`
                  w-2 h-2 rounded-full
                  ${d <= dimensionCount ? 'bg-[var(--ark-gold)]' : 'bg-white/20'}
                `}
              />
            ))}
          </div>
        </div>
      </div>
    </button>
  );
}

interface DeleteConfirmModalProps {
  entry: JournalEntry;
  onConfirm: () => void;
  onCancel: () => void;
}

function DeleteConfirmModal({ entry, onConfirm, onCancel }: DeleteConfirmModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div className="absolute inset-0 bg-black/70" />
      <div
        className="
          relative bg-[var(--ark-navy)] rounded-2xl
          max-w-sm w-full p-6
          border border-white/10
          shadow-2xl
        "
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-white font-semibold text-lg mb-2">Delete Entry?</h3>
        <p className="text-white/60 text-sm mb-6">
          Are you sure you want to delete your journal entry for &ldquo;{entry.scripture}&rdquo;? This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="
              flex-1 py-2.5 rounded-lg font-medium
              bg-white/10 text-white
              hover:bg-white/20
              transition-colors
            "
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="
              flex-1 py-2.5 rounded-lg font-medium
              bg-red-500 text-white
              hover:bg-red-600
              transition-colors
            "
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper functions

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

interface DateGroup {
  label: string;
  entries: JournalEntry[];
}

function groupEntriesByDate(entries: JournalEntry[]): DateGroup[] {
  const groups: Map<string, JournalEntry[]> = new Map();

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  entries.forEach(entry => {
    const date = new Date(entry.createdAt);
    let label: string;

    if (isSameDay(date, today)) {
      label = 'Today';
    } else if (isSameDay(date, yesterday)) {
      label = 'Yesterday';
    } else if (isThisWeek(date)) {
      label = 'This Week';
    } else if (isThisMonth(date)) {
      label = 'This Month';
    } else {
      label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }

    if (!groups.has(label)) {
      groups.set(label, []);
    }
    groups.get(label)!.push(entry);
  });

  // Convert to array, maintaining order
  const order = ['Today', 'Yesterday', 'This Week', 'This Month'];
  const result: DateGroup[] = [];

  for (const label of order) {
    if (groups.has(label)) {
      result.push({ label, entries: groups.get(label)! });
      groups.delete(label);
    }
  }

  // Add remaining groups (older months)
  for (const [label, groupEntries] of groups) {
    result.push({ label, entries: groupEntries });
  }

  return result;
}

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function isThisWeek(date: Date): boolean {
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  return date >= weekAgo && date <= today;
}

function isThisMonth(date: Date): boolean {
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth()
  );
}
