import { listPrayerRequests } from '@/lib/prayer';
import { PrayerList } from '@/components/prayer/PrayerList';

export const metadata = { title: 'Prayer - ARK Identity' };
export const dynamic = 'force-dynamic';

export default async function PrayerAdminPage() {
  const requests = await listPrayerRequests().catch(() => []);
  return (
    <div style={{ background: '#FAF8F5', minHeight: '100vh' }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold" style={{ color: 'var(--navy)' }}>
            Prayer
          </h1>
        </div>
        <p className="mb-8" style={{ color: '#8a8378' }}>
          From the &ldquo;How can we pray for you?&rdquo; link in every update. Public link: /pray
        </p>
        <PrayerList initial={requests} />
      </div>
    </div>
  );
}
