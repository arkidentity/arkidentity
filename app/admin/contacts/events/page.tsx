import { listEvents } from '@/lib/contacts';
import { EventList } from '@/components/contacts/EventList';

export const metadata = { title: 'Events - ARK Identity' };
export const dynamic = 'force-dynamic';

export default async function EventsPage() {
  const events = await listEvents();
  return (
    <div style={{ background: '#FAF8F5', minHeight: '100vh' }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold" style={{ color: 'var(--navy)' }}>Events</h1>
          <a href="/admin/contacts" className="text-sm font-semibold hover:underline" style={{ color: 'var(--navy)' }}>
            ← Contacts
          </a>
        </div>
        <p className="mb-8" style={{ color: '#8a8378' }}>
          Invites and RSVPs still live in Google Calendar. This is only the record of who you already asked.
        </p>
        <EventList initialEvents={events} />
      </div>
    </div>
  );
}
