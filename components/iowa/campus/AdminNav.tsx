'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const TABS = [
  { href: '/iowa/admin', label: 'Dashboard' },
  { href: '/iowa/admin/tasks', label: 'Tasks' },
  { href: '/iowa/admin/calendar', label: 'Calendar' },
  { href: '/iowa/admin/studies', label: 'Studies' },
  { href: '/iowa/admin/students', label: 'Students' },
  { href: '/iowa/admin/staff', label: 'Staff' },
  { href: '/iowa/admin/settings', label: 'Settings' },
];

// Top nav for every /iowa/admin screen except the login page.
export default function AdminNav({ name }: { name: string | null }) {
  const pathname = usePathname();
  const router = useRouter();
  if (pathname === '/iowa/admin/login') return null;

  const active = (href: string) => (href === '/iowa/admin' ? pathname === href : pathname.startsWith(href));

  return (
    <nav style={{ background: 'var(--navy)' }} className="text-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-1 overflow-x-auto py-2 -mx-1">
          <span className="font-bold mr-3 shrink-0">ARK Iowa</span>
          {TABS.map((t) => (
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
