import { listTags, listContacts } from '@/lib/contacts';
import { TagAdmin } from '@/components/contacts/TagAdmin';

export const metadata = { title: 'Tags - ARK Identity' };
export const dynamic = 'force-dynamic';

export default async function TagsPage() {
  const [tags, contacts] = await Promise.all([listTags(), listContacts()]);

  // How many people carry each tag — the number that tells you which tags are
  // real and which are typos someone made once.
  const counts: Record<string, number> = {};
  for (const c of contacts) {
    for (const t of c.tags) counts[t.id] = (counts[t.id] ?? 0) + 1;
  }

  return (
    <div style={{ background: '#FAF8F5', minHeight: '100vh' }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold" style={{ color: 'var(--navy)' }}>Tags</h1>
          <a href="/admin/contacts" className="text-sm font-semibold hover:underline" style={{ color: 'var(--navy)' }}>
            ← Contacts
          </a>
        </div>
        <p className="mb-8" style={{ color: '#8a8378' }}>
          What kind of person someone is. Keep the list short — a tag nobody uses is a filter that never fires.
        </p>
        <TagAdmin initialTags={tags} counts={counts} />
      </div>
    </div>
  );
}
