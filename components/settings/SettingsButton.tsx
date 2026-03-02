'use client';

import { useState } from 'react';
import { SettingsDrawer } from './SettingsDrawer';

export function SettingsButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        className="settings-btn"
        onClick={() => setIsOpen(true)}
        title="Account"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </button>

      <SettingsDrawer isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
