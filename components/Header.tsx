'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

const CHEVRON_RIGHT = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
    <path d="M9 18l6-6-6-6" />
  </svg>
);

const NAV_LINKS = [
  {
    id: 'courses',
    label: 'Courses',
    href: '/courses',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    id: 'about',
    label: 'About',
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
    id: 'team',
    label: 'Team',
    href: '/team',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
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
    id: 'giving',
    label: 'Giving',
    href: '/giving',
    gold: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
  },
  {
    id: 'get-involved',
    label: 'Get Involved',
    href: '/get-involved',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="8.5" cy="7" r="4" />
        <line x1="20" y1="8" x2="20" y2="14" />
        <line x1="23" y1="11" x2="17" y2="11" />
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
];

const EXTRA_LINKS = [
  {
    id: 'dna',
    label: 'DNA Discipleship',
    href: 'https://dnadiscipleship.com',
    external: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
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

function BrochureDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
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
          <h2>Menu</h2>
          <button className="settings-close-btn" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18" />
              <path d="M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="settings-menu-items">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.id}
              href={link.href}
              className={link.gold ? 'settings-menu-item gold-pill' : 'links-drawer-item'}
              onClick={onClose}
            >
              <span className="links-drawer-item-icon">{link.icon}</span>
              <span className="links-drawer-item-label">{link.label}</span>
              <span className="links-drawer-item-chevron">{CHEVRON_RIGHT}</span>
            </Link>
          ))}

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', margin: '0.75rem 1rem' }} />

          {EXTRA_LINKS.map((link) => {
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

export default function Header() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <header className="shadow-sm sticky top-0 z-50" style={{ backgroundColor: 'var(--navy)' }}>
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link href="/" className="flex items-center">
                <Image
                  src="/images/ark-logo-web.png"
                  alt="ARK Identity"
                  width={80}
                  height={21}
                  className="h-5 w-auto"
                  priority
                />
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/courses" className="text-white hover:text-gold transition">
                Courses
              </Link>
              <Link href="/about" className="text-white hover:text-gold transition">
                About
              </Link>
              <Link href="/team" className="text-white hover:text-gold transition">
                Team
              </Link>
              <Link href="/beliefs" className="text-white hover:text-gold transition">
                What We Believe
              </Link>
              <Link
                href="/giving"
                className="px-4 py-2 rounded-lg font-semibold transition hover:opacity-90"
                style={{ backgroundColor: 'var(--gold)', color: 'var(--navy)' }}
              >
                Giving
              </Link>
              <Link href="/get-involved" className="text-white hover:text-gold transition">
                Get Involved
              </Link>
              <Link href="/vision-2026" className="text-white hover:text-gold transition">
                Vision 2026
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setDrawerOpen(true)}
                className="text-white hover:text-gold focus:outline-none"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </nav>
      </header>

      <BrochureDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
