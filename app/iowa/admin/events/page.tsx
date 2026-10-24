import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { currentStaff } from '@/lib/iowaStaff';
import { listOutreachSignups } from '@/lib/outreach';
import { TRICK_OR_TRUTH } from '@/lib/outreachFormat';
import { listInterested, listRegistrations } from '@/lib/trips';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'ARK Iowa — events' };

// Admin → Events (Travis 10/24): special events with sign-ups, one home for each. The calendar still schedules;
// this is where you see who signed up, share the links and manage people.
export default async function EventsPage() {
  if (!(await currentStaff())) redirect('/iowa/admin/login');
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
    <div style={{ background: '#FAF8F5', minHeight: '100vh' }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-4">
        <h1 className="text-2xl font-bold" style={navy}>Events</h1>
        <p className="text-[#8a8378]">Special events with sign-ups. Scheduling stays on the calendar.</p>
        {events.map(e => (
          <Link key={e.href} href={e.href} className="block bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="font-bold text-lg" style={navy}>{e.title}</h2>
              <span className="text-sm text-[#8a8378]">{e.when}</span>
            </div>
            <p className="text-sm text-[#4a4540] mt-1">{e.line}</p>
            <p className="text-xs text-[#8a8378] mt-2">Public page: arkidentity.com{e.page} · Manage →</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
