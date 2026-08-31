import { listTags, listStates, listEvents } from '@/lib/contacts';
import { SegmentBuilder } from '@/components/contacts/SegmentBuilder';

export const metadata = { title: 'Segments - ARK Identity' };
export const dynamic = 'force-dynamic';

export default async function SegmentsPage() {
  const [tags, states, events] = await Promise.all([listTags(), listStates(), listEvents()]);
  return (
    <div style={{ background: '#FAF8F5', minHeight: '100vh' }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold" style={{ color: 'var(--navy)' }}>Segments</h1>
          <a href="/admin/contacts" className="text-sm font-semibold hover:underline" style={{ color: 'var(--navy)' }}>
            ← Contacts
          </a>
        </div>
        <p className="mb-8" style={{ color: '#8a8378' }}>
          Who to invite, and who you&rsquo;ve already asked. Copy the list into a Google Calendar invite or a text.
        </p>
        <SegmentBuilder tags={tags} states={states} events={events} />
      </div>
    </div>
  );
}
