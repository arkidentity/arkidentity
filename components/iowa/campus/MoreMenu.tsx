'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ScreenHeader } from '@/components/iowa/campus/ui';

export default function MoreMenu({ name, links }: { name: string | null; links: { href: string; label: string; sub: string }[] }) {
  const router = useRouter();
  return (
    <div style={{ background: '#f8f6f2', color: '#1a2b3c', minHeight: '100dvh' }}>
      <main className="max-w-xl mx-auto px-4 pt-4 sm:pt-8 pb-32">
        <ScreenHeader kicker={name ? `Signed in as ${name}` : undefined} title="More" />
        <ul className="rounded-xl overflow-hidden bg-white" style={{ border: '1px solid #e7e2d9' }}>
          {links.map((l, i) => (
            <li key={l.href} style={{ borderTop: i ? '1px solid #e7e2d9' : 'none' }}>
              <Link href={l.href} className="flex items-center justify-between gap-3 px-4 py-3.5">
                <span>
                  <span className="block font-semibold">{l.label}</span>
                  <span className="text-sm" style={{ color: '#7d766b' }}>{l.sub}</span>
                </span>
                <span aria-hidden style={{ color: '#7d766b' }}>›</span>
              </Link>
            </li>
          ))}
        </ul>
        <div className="flex justify-end gap-2 mt-6">
          {/* The installed app never reloads on its own. */}
          <button className="px-4 min-h-11 rounded-lg text-sm font-semibold" style={{ border: '1px solid rgba(20,51,72,0.4)', color: '#143348' }} onClick={() => router.refresh()}>
            Refresh
          </button>
          <button
            className="px-4 min-h-11 rounded-lg text-sm font-semibold"
            style={{ color: '#b42318' }}
            onClick={async () => {
              await fetch('/api/iowa/admin/logout', { method: 'POST' });
              router.push('/iowa/admin/login');
            }}
          >
            Sign out
          </button>
        </div>
      </main>
    </div>
  );
}
