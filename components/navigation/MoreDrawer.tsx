'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';

const CHEVRON_RIGHT = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
    <path d="M9 18l6-6-6-6" />
  </svg>
);

const MORE_LINKS = [
  {
    id: 'about',
    label: 'About ARK',
    href: '/about',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4" />
        <path d="M12 8h.01" />
      </svg>
    ),
  },
  {
    id: 'beliefs',
    label: 'What We Believe',
    href: '/beliefs',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
  },
  {
    id: 'give',
    label: 'Give',
    href: '/giving',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
  },
  {
    id: 'vision',
    label: 'Vision 2026',
    href: '/vision-2026',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
  {
    id: 'dna',
    label: 'DNA Discipleship',
    href: 'https://dnadiscipleship.com',
    external: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    id: 'iowa',
    label: 'ARK Iowa',
    href: '/iowa',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

interface MoreDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MoreDrawer({ isOpen, onClose }: MoreDrawerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return createPortal(
    <>
      <div
        className={`settings-overlay ${isOpen ? 'show' : ''}`}
        onClick={onClose}
      />
      <div className={`settings-drawer ${isOpen ? 'show' : ''}`}>
        <div className="settings-drawer-header">
          <h2>More</h2>
          <button className="settings-close-btn" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18" />
              <path d="M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="settings-menu-items">
          {MORE_LINKS.map((link) => {
            const isExternal = 'external' in link && link.external;
            if (isExternal) {
              return (
                <a
                  key={link.id}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="links-drawer-item"
                  onClick={onClose}
                >
                  <span className="links-drawer-item-icon">{link.icon}</span>
                  <span className="links-drawer-item-label">{link.label}</span>
                  <span className="links-drawer-item-chevron">{CHEVRON_RIGHT}</span>
                </a>
              );
            }
            return (
              <Link
                key={link.id}
                href={link.href}
                className="links-drawer-item"
                onClick={onClose}
              >
                <span className="links-drawer-item-icon">{link.icon}</span>
                <span className="links-drawer-item-label">{link.label}</span>
                <span className="links-drawer-item-chevron">{CHEVRON_RIGHT}</span>
              </Link>
            );
          })}
        </div>

        <div className="more-drawer-footer">
          <p className="more-drawer-brand">ARK Identity</p>
          <p className="more-drawer-tagline">Knowing God and who God says you are</p>
        </div>
      </div>
    </>,
    document.body
  );
}
