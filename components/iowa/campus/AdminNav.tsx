'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import type { Permission } from '@/lib/iowaPerms';

// `needs` is the permission a tab requires; no `needs` means everyone signed in.
const TABS: { href: string; label: string; needs?: Permission }[] = [
  { href: '/iowa/admin', label: 'Dashboard' },
  { href: '/iowa/admin/studies', label: 'Studies', needs: 'viewAllStudies' },
  { href: '/iowa/admin/students', label: 'Students', needs: 'viewStudents' },
  { href: '/iowa/admin/staff', label: 'Staff', needs: 'manageStaff' },
  // Settings holds per-person things (notifications, install), so everyone
  // gets in; the staff-only lists inside are hidden by the page.
  { href: '/iowa/admin/settings', label: 'Settings' },
];

// Top nav for every /iowa/admin screen except the login page.
export default function AdminNav({ name, allowed = [] }: { name: string | null; allowed?: Permission[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  if (pathname === '/iowa/admin/login') return null;

  const active = (href: string) => (href === '/iowa/admin' ? pathname === href : pathname.startsWith(href));

  return (
    <nav style={{ background: 'var(--navy)' }} className="text-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-1 overflow-x-auto py-2 -mx-1">
          <span className="font-bold mr-3 shrink-0">ARK Iowa</span>
          {TABS.filter((t) => !t.needs || allowed.includes(t.needs)).map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className="px-3 py-1.5 rounded-md text-sm font-semibold shrink-0 transition"
              style={active(t.href) ? { background: 'rgba(255,255,255,0.18)' } : { opacity: 0.75 }}
            >
              {t.label}
            </Link>
          ))}
        </div>
        <div className="text-sm shrink-0 flex items-center gap-3">
          {name && <span className="hidden sm:inline opacity-75">{name}</span>}
          {/* The installed app never reloads on its own, so the only way to see
              new data was to close and reopen it. */}
          <button
            aria-label="Refresh"
            title="Refresh"
            disabled={refreshing}
            className="text-2xl leading-none px-2 py-1 -my-1 font-semibold disabled:opacity-50"
            onClick={() => {
              setRefreshing(true);
              router.refresh();
              // The server render is a moment behind the click; this is just
              // so the button doesn't look dead in the meantime.
              setTimeout(() => setRefreshing(false), 1200);
            }}
          >
            <span className={`inline-block ${refreshing ? 'animate-spin' : ''}`}>↻</span>
          </button>
          <button
            className="font-semibold hover:underline"
            onClick={async () => {
              await fetch('/api/iowa/admin/logout', { method: 'POST' });
              router.push('/iowa/admin/login');
            }}
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}
