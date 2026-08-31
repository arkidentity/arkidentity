import { listContacts, listTags } from '@/lib/contacts';
import { ContactManager } from '@/components/contacts/ContactManager';

export const metadata = { title: 'Contacts - ARK Identity' };
export const dynamic = 'force-dynamic';

export default async function ContactsPage() {
  const [contacts, tags] = await Promise.all([listContacts(), listTags()]);
  return (
    <div style={{ background: '#FAF8F5', minHeight: '100vh' }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
          <h1 className="text-3xl font-bold" style={{ color: 'var(--navy)' }}>Contacts</h1>
          <div className="flex items-center gap-4 text-sm font-semibold" style={{ color: 'var(--navy)' }}>
            <a href="/admin/quick-add" className="hover:underline">Quick Add</a>
            <a href="/admin/contacts/segments" className="hover:underline">Segments</a>
            <a href="/admin/contacts/events" className="hover:underline">Events</a>
            <a href="/admin/contacts/tags" className="hover:underline">Tags</a>
            <a href="/admin" className="hover:underline">← Feed admin</a>
          </div>
        </div>
        <ContactManager initialContacts={contacts} tags={tags} />
      </div>
    </div>
  );
}
