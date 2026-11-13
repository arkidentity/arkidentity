import { currentAdminUser, listAdminUsers } from '@/lib/adminUsers';
import { AdminUsers } from '@/components/admin/AdminUsers';

export const metadata = { title: 'Users - ARK Admin' };
export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  const [users, me] = await Promise.all([listAdminUsers(), currentAdminUser()]);
  return (
    <div style={{ background: '#FAF8F5', minHeight: '100vh' }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--navy)' }}>
          Users
        </h1>
        <p className="mb-8 text-sm" style={{ color: '#8a8378' }}>
          Everyone here can sign in to ARK Admin. Turning someone off keeps their history.
        </p>
        <AdminUsers initialUsers={users} meId={me?.id ?? null} />
      </div>
    </div>
  );
}
