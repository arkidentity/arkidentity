import { getConnection, googleConfigured } from '@/lib/googleContacts';
import { GoogleSync } from '@/components/contacts/GoogleSync';

export const metadata = { title: 'Google Contacts - ARK Identity' };
export const dynamic = 'force-dynamic';

export default async function GoogleContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; error?: string }>;
}) {
  const { connected, error } = await searchParams;
  const connection = googleConfigured() ? await getConnection() : null;
  return (
    <div style={{ background: '#FAF8F5', minHeight: '100vh' }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--navy)' }}>Google Contacts</h1>
        <p className="mb-8" style={{ color: '#8a8378' }}>
          Google holds name, email, phone and birthday. ARK holds the care. Labels and tags stay the same on both sides.
        </p>
        <GoogleSync
          configured={googleConfigured()}
          connection={connection}
          justConnected={connected === '1'}
          error={error ?? null}
        />
      </div>
    </div>
  );
}
