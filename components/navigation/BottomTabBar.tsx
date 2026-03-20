'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { MoreDrawer } from './MoreDrawer';

const TABS = [
  {
    id: 'courses',
    label: 'Courses',
    href: '/',
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
    id: 'resources',
    label: 'Resources',
    href: '/resources',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <path d="M3.27 6.96L12 12.01l8.73-5.05" />
        <path d="M12 22.08V12" />
      </svg>
    ),
  },
  {
    id: 'training',
    label: 'Training',
    href: '/training',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c0 1.66 2.69 3 6 3s6-1.34 6-3v-5" />
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
  const [moreOpen, setMoreOpen] = useState(false);

  const allTabs = [...TABS, { id: 'more' }];

  const getActiveTab = () => {
    if (pathname === '/' || pathname.startsWith('/courses')) return 'courses';
    if (pathname.startsWith('/resources')) return 'resources';
    if (pathname.startsWith('/training')) return 'training';
    if (pathname.startsWith('/creed-cards')) return 'resources';
    return null;
  };

  const activeTab = moreOpen ? 'more' : getActiveTab();
  const activeIndex = allTabs.findIndex((tab) => tab.id === activeTab);

  // Hide on brochure pages (they have their own header/footer nav)
  const isPublicPage =
    pathname.startsWith('/about') ||
    pathname.startsWith('/beliefs') ||
    pathname.startsWith('/giving') ||
    pathname.startsWith('/vision') ||
    pathname.startsWith('/team') ||
    pathname.startsWith('/get-involved') ||
    pathname.startsWith('/iowa');

  if (isPublicPage) return null;

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
