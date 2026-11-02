import type { Metadata } from 'next';
import { contactForToken } from '@/lib/prayer';
import { PrayerForm } from '@/components/prayer/PrayerForm';

export const metadata: Metadata = { title: 'How can we pray for you? - ARK Identity', robots: { index: false } };
export const dynamic = 'force-dynamic';

// Linked from every partner email (?t = their unsubscribe token, so we know who it is)
// and from the feed (no token: they type a name and email).
export default async function PrayPage({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const { t } = await searchParams;
  const contact = t ? await contactForToken(t).catch(() => null) : null;

  return (
    <div style={{ background: '#FAF8F5', minHeight: '80vh' }} className="px-4 py-16">
      <div className="max-w-lg mx-auto">
        <h1 className="text-3xl font-bold mb-3" style={{ color: 'var(--navy)' }}>
          How can we pray for you?
        </h1>
        <p className="mb-8 text-lg" style={{ color: '#5a5247' }}>
          {contact ? `${contact.name.split(' ')[0]}, you` : 'You'} pray for us. We&apos;d love to pray for you by name. Kimberly and I read every one.
        </p>
        <PrayerForm token={contact ? t! : null} knownName={contact?.name ?? null} />
      </div>
    </div>
  );
}
