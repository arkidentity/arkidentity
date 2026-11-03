import { listContacts, listTags } from '@/lib/contacts';
import { ContactManager } from '@/components/contacts/ContactManager';

export const metadata = { title: 'Contacts - ARK Identity' };
export const dynamic = 'force-dynamic';

export default async function ContactsPage() {
  const [contacts, tags] = await Promise.all([listContacts({ includeArchived: true }), listTags()]);
  return (
    <div style={{ background: '#FAF8F5', minHeight: '100vh' }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-bold mb-8" style={{ color: 'var(--navy)' }}>Contacts</h1>
        <ContactManager initialContacts={contacts} tags={tags} />
      </div>
    </div>
  );
}
