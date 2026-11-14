import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { currentStaff } from '@/lib/iowaStaff';
import { can } from '@/lib/iowaPerms';
import { listOutreachSignups } from '@/lib/outreach';
import { TRICK_OR_TRUTH } from '@/lib/outreachFormat';
import { listInterested, listRegistrations } from '@/lib/trips';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'ARK Iowa — events' };

// Admin → Events (Travis 10/24): special events with sign-ups, one home for each. The calendar still schedules;
// this is where you see who signed up, share the links and manage people.
export default async function EventsPage() {
  const me = await currentStaff();
  if (!me) redirect('/iowa/admin/login');
  // Sign-up lists are event work (students' names and numbers): staff, interns and
  // leaders with the Calendar & events job. The nav hides the tab; this stops a bookmark.
  if (!can(me, 'manageEvents')) redirect('/iowa/admin');
  const [tot, interested, going] = await Promise.all([
    listOutreachSignups(TRICK_OR_TRUTH).catch(() => []),
    listInterested('baja-2027').catch(() => []),
    listRegistrations('baja-2027').catch(() => []),
  ]);
  const goingNow = going.filter(g => g.status === 'going');
  const events = [
    { href: '/iowa/admin/events/baja-2027', title: 'Baja 2027', when: 'Summer 2027', line: `${goingNow.length} going · ${interested.length} interested`, page: '/iowa/baja' },
    { href: '/iowa/admin/events/trick-or-truth', title: 'Trick or Truth', when: 'Oct 29–31', line: `${tot.length} signed up`, page: '/iowa/trick-or-truth' },
  ];
  const navy = { color: 'var(--navy)' };
  return (
    <div style={{ background: '#FAF8F5', color: '#4a4540', minHeight: '100vh' }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-4 pb-10">
        <Link href="/iowa/admin/more" className="inline-flex min-h-11 items-center font-semibold" style={navy}>‹ More</Link>
        <h1 className="text-2xl font-bold" style={navy}>Events with sign-ups</h1>
        <p className="text-sm text-[#8a8378] mb-4">Who signed up, and their links. Times live on the Calendar.</p>
        <ul className="rounded-xl bg-white border border-gray-200 overflow-hidden">
          {events.map((e, i) => (
            <li key={e.href} className={i ? 'border-t border-gray-100' : ''}>
              <Link href={e.href} className="flex items-center justify-between gap-3 px-4 py-3.5">
                <span className="min-w-0">
                  <span className="block font-semibold" style={navy}>{e.title}</span>
                  <span className="block text-sm text-[#8a8378]">{e.when} · {e.line}</span>
                </span>
                <span className="text-xl text-[#8a8378]" aria-hidden>›</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
