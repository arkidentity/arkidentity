import { notFound } from 'next/navigation';
import { getEventBoard, listTags, listStates, listRegions, listChurches } from '@/lib/contacts';
import { EventDetail } from '@/components/contacts/EventDetail';

export const metadata = { title: 'Event - ARK Identity' };
export const dynamic = 'force-dynamic';

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [event, tags, states, regions, churches] = await Promise.all([
    getEventBoard(id), listTags(), listStates(), listRegions(), listChurches(),
  ]);
  if (!event) notFound();

  return (
    <div style={{ background: '#FAF8F5', minHeight: '100vh' }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <a href="/admin/contacts/events" className="text-sm font-semibold hover:underline" style={{ color: 'var(--navy)' }}>
          ← All events
        </a>
        <h1 className="text-3xl font-bold mt-3 mb-1" style={{ color: 'var(--navy)' }}>{event.name}</h1>
        <p className="mb-8" style={{ color: '#8a8378' }}>
          {[event.event_date, event.location].filter(Boolean).join(' · ') || 'No date set'}
        </p>
        <EventDetail event={event} tags={tags} states={states} regions={regions} churches={churches} />
      </div>
    </div>
  );
}
