'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/admin', label: 'Updates', match: (p: string) => p === '/admin' },
  { href: '/admin/contacts', label: 'Contacts', match: (p: string) => p.startsWith('/admin/contacts') },
  { href: '/admin/prayer', label: 'Prayer', match: (p: string) => p.startsWith('/admin/prayer') },
  { href: '/admin/orders', label: 'Orders', match: (p: string) => p.startsWith('/admin/orders') },
  { href: '/admin/users', label: 'Users', match: (p: string) => p.startsWith('/admin/users') },
];

const CONTACT_TABS = [
  { href: '/admin/contacts', label: 'All', match: (p: string) => p === '/admin/contacts' },
  { href: '/admin/contacts/segments', label: 'Segments', match: (p: string) => p.startsWith('/admin/contacts/segments') },
  { href: '/admin/contacts/events', label: 'Events', match: (p: string) => p.startsWith('/admin/contacts/events') },
  { href: '/admin/contacts/tags', label: 'Tags', match: (p: string) => p.startsWith('/admin/contacts/tags') },
  { href: '/admin/contacts/cleanup', label: 'Cleanup', match: (p: string) => p.startsWith('/admin/contacts/cleanup') },
  { href: '/admin/contacts/google', label: 'Google', match: (p: string) => p.startsWith('/admin/contacts/google') },
];

const BARE = ['/admin/login', '/admin/quick-add'];

export function AdminNav({ openPrayer }: { openPrayer: number }) {
  const pathname = usePathname() || '';
  if (BARE.some((b) => pathname.startsWith(b))) return null;
  const inContacts = pathname.startsWith('/admin/contacts');

  return (
    <header className="sticky top-0 z-30 border-b bg-white" style={{ borderColor: '#e5e1da' }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 h-14">
          <Link href="/admin" className="font-bold shrink-0" style={{ color: 'var(--navy)' }}>
            ARK Admin
          </Link>
          <nav className="flex items-center gap-1 overflow-x-auto">
            {TABS.map((t) => {
              const on = t.match(pathname);
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  className="px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap"
                  style={on ? { backgroundColor: 'var(--navy)', color: 'white' } : { color: 'var(--navy)' }}
                >
                  {t.label}
                  {t.label === 'Prayer' && openPrayer > 0 && (
                    <span
                      className="ml-1.5 inline-flex min-w-5 h-5 px-1 items-center justify-center rounded-full text-[11px]"
                      style={{ backgroundColor: on ? 'white' : '#e8b562', color: 'var(--navy)' }}
                    >
                      {openPrayer}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
          <div className="ml-auto flex items-center gap-3 shrink-0">
            <a href="/feed" target="_blank" rel="noreferrer" className="hidden sm:inline text-sm hover:underline" style={{ color: '#8a8378' }}>
              View feed ↗
            </a>
            <Link
              href="/admin/quick-add"
              className="px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap"
              style={{ backgroundColor: '#e8b562', color: 'var(--navy)' }}
            >
              + Quick add
            </Link>
            <button
              type="button"
              onClick={async () => {
                await fetch('/api/admin/logout', { method: 'POST' });
                window.location.href = '/admin/login';
              }}
              className="text-sm hover:underline"
              style={{ color: '#8a8378' }}
            >
              Sign out
            </button>
          </div>
        </div>
        {inContacts && (
          <nav className="flex items-center gap-4 h-10 -mt-1 overflow-x-auto text-sm">
            {CONTACT_TABS.map((t) => {
              const on = t.match(pathname);
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  className="py-2 whitespace-nowrap border-b-2"
                  style={{ borderColor: on ? 'var(--navy)' : 'transparent', color: on ? 'var(--navy)' : '#8a8378', fontWeight: on ? 600 : 400 }}
                >
                  {t.label}
                </Link>
              );
            })}
          </nav>
        )}
      </div>
    </header>
  );
}
