'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';

import type { Permission } from '@/lib/iowaPerms';

// Bottom tab bar + the one + button for every /iowa/admin screen (11/13, from
// the /iowa/lab/today mock). Replaces the top tabs, which clipped on a phone.
// `needs` is the permission a tab or + option requires; none = everyone signed in.
const TABS: { href: string; label: string; needs?: Permission; also?: string[] }[] = [
  { href: '/iowa/admin', label: 'Today' },
  { href: '/iowa/admin/calendar', label: 'Calendar' },
  { href: '/iowa/admin/studies', label: 'Studies', needs: 'viewAllStudies' },
  { href: '/iowa/admin/students', label: 'Students', needs: 'viewStudents' },
  { href: '/iowa/admin/more', label: 'More', also: ['/iowa/admin/events', '/iowa/admin/staff', '/iowa/admin/settings', '/iowa/admin/tasks', '/iowa/admin/outreach'] },
];
const ADD: { href: string; label: string; needs?: Permission }[] = [
  { href: '/iowa/admin/tasks?new=1', label: 'A task' },
  { href: '/iowa/admin/students?add=1', label: 'A student', needs: 'viewStudents' },
  { href: '/iowa/admin/calendar?new=event', label: 'An event', needs: 'manageEvents' },
  { href: '/iowa/admin/studies?new=1', label: 'A study', needs: 'viewAllStudies' },
];

export default function AdminNav({ allowed = [] }: { name?: string | null; allowed?: Permission[] }) {
  const pathname = usePathname();
  const [adding, setAdding] = useState(false);
  if (pathname === '/iowa/admin/login') return null;
  const ok = (needs?: Permission) => !needs || allowed.includes(needs);
  const tabs = TABS.filter((t) => ok(t.needs));
  const active = (t: (typeof TABS)[number]) =>
    t.href === '/iowa/admin' ? pathname === t.href : pathname.startsWith(t.href) || !!t.also?.some((a) => pathname.startsWith(a));

  // Studies, Students and Tasks have their own "+ New …" button in this corner.
  const ownAdd = ['/iowa/admin/studies', '/iowa/admin/students', '/iowa/admin/tasks'].some((p) => pathname.startsWith(p));

  return (
    <>
      {!ownAdd && <button
        aria-label="Add something"
        onClick={() => setAdding(true)}
        className="fixed right-4 w-14 h-14 rounded-full text-3xl font-light shadow-lg z-40 print:hidden"
        style={{ bottom: 'calc(84px + env(safe-area-inset-bottom))', background: '#E8B562', color: '#1a2b3c' }}
      >
        +
      </button>}

      {adding && (
        <div className="fixed inset-0 z-[65] flex items-end" style={{ background: 'rgba(15,26,37,0.45)' }} onClick={() => setAdding(false)}>
          <div className="w-full max-w-xl mx-auto rounded-t-2xl p-5 pb-8 bg-white" onClick={(e) => e.stopPropagation()}>
            <p className="font-bold text-lg mb-2" style={{ color: '#1a2b3c' }}>Add</p>
            {ADD.filter((a) => ok(a.needs)).map((a) => (
              <Link
                key={a.href}
                href={a.href}
                onClick={() => setAdding(false)}
                className="block py-4 text-base font-semibold"
                style={{ borderTop: '1px solid #e7e2d9', color: '#1a2b3c' }}
              >
                {a.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 inset-x-0 z-40 print:hidden" style={{ background: 'var(--navy)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="max-w-xl mx-auto grid" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
          {tabs.map((t) => {
            const on = active(t);
            return (
              <Link
                key={t.href}
                href={t.href}
                className="py-3 text-[13px] font-semibold flex flex-col items-center gap-1"
                style={{ color: on ? '#fff' : 'rgba(255,255,255,0.6)' }}
                aria-current={on ? 'page' : undefined}
              >
                <span className="block w-6 h-1 rounded-full" style={{ background: on ? '#E8B562' : 'transparent' }} />
                {t.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
