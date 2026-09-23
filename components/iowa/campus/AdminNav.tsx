'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import type { Permission } from '@/lib/iowaPerms';

// `needs` is the permission a tab requires; no `needs` means everyone signed in.
const TABS: { href: string; label: string; needs?: Permission }[] = [
  { href: '/iowa/admin', label: 'Dashboard' },
  { href: '/iowa/admin/studies', label: 'Studies', needs: 'viewAllStudies' },
  { href: '/iowa/admin/students', label: 'Students', needs: 'viewStudents' },
  { href: '/iowa/admin/staff', label: 'Staff', needs: 'manageStaff' },
  { href: '/iowa/admin/settings', label: 'Settings', needs: 'manageSettings' },
];

// Top nav for every /iowa/admin screen except the login page.
export default function AdminNav({ name, allowed = [] }: { name: string | null; allowed?: Permission[] }) {
  const pathname = usePathname();
  const router = useRouter();
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
