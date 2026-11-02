import { AdminNav } from '@/components/admin/AdminNav';
import { listPrayerRequests } from '@/lib/prayer';

// One menu for every /admin page (feed updates, contacts, prayer). Login and
// Quick Add render bare: AdminNav hides itself there.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const openPrayer = await listPrayerRequests()
    .then((rows) => rows.filter((r) => r.status === 'open').length)
    .catch(() => 0);
  return (
    <>
      <AdminNav openPrayer={openPrayer} />
      {children}
    </>
  );
}
