import type { Metadata } from 'next';
import { publicRsvpView } from '@/lib/eventInvites';
import RsvpForm from '@/components/iowa/RsvpForm';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'ARK Iowa — RSVP', robots: { index: false, follow: false } };

// Public RSVP page for an event (the link texted out for Taco Night).
export default async function RsvpPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const view = await publicRsvpView(token);
  return (
    <div style={{ background: '#FAF8F5', minHeight: '100vh' }}>
      <div className="max-w-md mx-auto px-4 py-14">
        {!view || view.dates.length === 0 ? (
          <p className="text-lg" style={{ color: 'var(--navy)' }}>RSVPs for this are closed.</p>
        ) : (
          <>
            <p className="text-sm font-semibold uppercase tracking-wide text-[#9d855a] mb-1">ARK Iowa</p>
            <h1 className="text-3xl font-bold mb-1" style={{ color: 'var(--navy)' }}>{view.title}</h1>
            <p className="text-[#4a4540] mb-8">
              {view.dates.length === 1 ? view.dates[0].label : 'Pick a date below'}
              {view.location ? ` · ${view.location}` : view.online ? ' · Online' : ''}
            </p>
            <RsvpForm token={token} dates={view.dates} going={view.going} />
          </>
        )}
      </div>
    </div>
  );
}
