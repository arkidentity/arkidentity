'use client';

/**
 * Journal Archive Page
 * Shows list of saved journal entries with view/edit/delete
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { JournalArchive } from '@/components/journal/JournalArchive';
import { JournalInfoModal } from '@/components/journal/JournalInfoModal';
import type { JournalEntry } from '@/types/journal';

export default function JournalArchivePage() {
  const router = useRouter();
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Handle edit - navigate to journal page with entry to edit
  const handleEdit = (entry: JournalEntry) => {
    // Store entry ID in sessionStorage for the journal page to pick up
    sessionStorage.setItem('editing_entry_id', entry.id.toString());
    router.push('/journal');
  };

  // Handle going back
  const handleBack = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-[var(--ark-navy)]">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[var(--ark-navy)] border-b border-white/10">
        <div className="flex items-center gap-4 px-4 py-3">
          <button
            type="button"
            onClick={handleBack}
            className="p-2 -ml-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <svg
              className="w-6 h-6 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-white font-semibold text-lg flex-1">Journal Archive</h1>
          <button
            type="button"
            onClick={() => router.push('/journal')}
            className="
              px-4 py-2 rounded-lg font-medium
              bg-[var(--ark-gold)] text-[var(--ark-navy)]
              hover:bg-[var(--ark-gold)]/90
              transition-colors
              flex items-center gap-2
              text-sm
            "
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            New Entry
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="px-4 py-6">
        <JournalArchive
          onEdit={handleEdit}
          onShowInfo={() => setShowInfoModal(true)}
          refreshTrigger={refreshTrigger}
        />
      </main>

      {/* Info Modal */}
      <JournalInfoModal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
      />
    </div>
  );
}
