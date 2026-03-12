'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { MoreDrawer } from './MoreDrawer';

const TABS = [
  {
    id: 'prayer',
    label: 'Prayer',
    href: '/prayer',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
        <path d="M11 21H8.5C7.7 21 7 20.6 6.6 19.9L4.1 15.4C3.7 14.7 3.7 13.8 4 13.1L7.5 6C7.9 5.1 9 4.7 9.9 5.1 10.6 5.4 11 6.1 11 6.9V21Z" />
        <path d="M13 21H15.5C16.3 21 17 20.6 17.4 19.9L19.9 15.4C20.3 14.7 20.3 13.8 20 13.1L16.5 6C16.1 5.1 15 4.7 14.1 5.1 13.4 5.4 13 6.1 13 6.9V21Z" />
      </svg>
    ),
  },
  {
    id: 'journal',
    label: 'Journal',
    href: '/journal',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    ),
  },
  {
    id: 'courses',
    label: 'Courses',
    href: '/courses',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        <path d="M8 7h8" />
        <path d="M8 11h6" />
      </svg>
    ),
  },
  {
    id: 'community',
    label: 'Community',
    href: '/community',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
];

const MORE_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

export function BottomTabBar() {
  const pathname = usePathname();
  const [hiddenByOverlay, setHiddenByOverlay] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setHiddenByOverlay(document.body.dataset.bibleSelectorOpen === 'true');
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['data-bible-selector-open'] });
    return () => observer.disconnect();
  }, []);

  const allTabs = [...TABS, { id: 'more' }];

  const getActiveTab = () => {
    if (pathname.startsWith('/prayer')) return 'prayer';
    if (pathname.startsWith('/journal') || pathname.startsWith('/archive')) return 'journal';
    if (pathname === '/' || pathname.startsWith('/courses')) return 'courses';
    if (pathname.startsWith('/community')) return 'community';
    return null;
  };

  const activeTab = moreOpen ? 'more' : getActiveTab();
  const activeIndex = allTabs.findIndex((tab) => tab.id === activeTab);

  // Hide on auth pages, profile, and full-screen overlays
  const shouldHide =
    hiddenByOverlay ||
    pathname === '/login' ||
    pathname === '/reset-password' ||
    pathname.startsWith('/profile');

  // Show public brochure nav instead on public pages
  const isPublicPage =
    pathname.startsWith('/about') ||
    pathname.startsWith('/beliefs') ||
    pathname.startsWith('/give') ||
    pathname.startsWith('/giving') ||
    pathname.startsWith('/vision') ||
    pathname.startsWith('/campus') ||
    pathname.startsWith('/team') ||
    pathname.startsWith('/get-involved');

  if (shouldHide || isPublicPage) return null;

  const pillWidth = `calc(${(100 / allTabs.length).toFixed(4)}% - ${(12 / allTabs.length).toFixed(4)}px)`;

  return (
    <>
      <nav className="bottom-tab-bar glass-nav">
        <div className="tab-bar-inner">
          <div
            className="tab-pill"
            style={{
              width: pillWidth,
              transform: activeIndex >= 0 ? `translateX(${activeIndex * 100}%)` : 'translateX(0)',
              opacity: activeIndex >= 0 ? 1 : 0,
            }}
          />

          {TABS.map((tab) => (
            <Link
              key={tab.id}
              href={tab.href}
              prefetch={true}
              className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}
            >
              <div className="tab-content">
                <div className="tab-icon">{tab.icon}</div>
                <span className="tab-label">{tab.label}</span>
              </div>
            </Link>
          ))}

          <button
            className={`tab-item ${activeTab === 'more' ? 'active' : ''}`}
            onClick={() => setMoreOpen(true)}
          >
            <div className="tab-content">
              <div className="tab-icon">{MORE_ICON}</div>
              <span className="tab-label">More</span>
            </div>
          </button>
        </div>
      </nav>

      <MoreDrawer isOpen={moreOpen} onClose={() => setMoreOpen(false)} />
    </>
  );
}
