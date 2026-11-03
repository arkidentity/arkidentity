import { listContacts, listTags } from '@/lib/contacts';
import { CleanupAssistant } from '@/components/contacts/CleanupAssistant';

export const metadata = { title: 'Cleanup - ARK Identity' };
export const dynamic = 'force-dynamic';

export default async function CleanupPage() {
  const [contacts, tags] = await Promise.all([listContacts(), listTags()]);
  return (
    <div style={{ background: '#FAF8F5', minHeight: '100vh' }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--navy)' }}>Cleanup</h1>
        <p className="mb-8" style={{ color: '#8a8378' }}>
          Suggestions only. Nothing changes until you tap Accept. When you&apos;re done, tap Sync with Google on Contacts.
        </p>
        <CleanupAssistant contacts={contacts} tags={tags} />
      </div>
    </div>
  );
}
