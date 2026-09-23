import type { Metadata } from 'next';
import { currentStaff } from '@/lib/iowaStaff';
import { can, type Permission } from '@/lib/iowaPerms';
import AdminNav from '@/components/iowa/campus/AdminNav';

// The admin is its own installable app: add it to your home screen from any
// screen here and it opens at the dashboard, with its own icon and name, while
// the public site keeps its own (/manifest.json → /courses).
export const metadata: Metadata = {
  title: 'ARK Iowa',
  manifest: '/iowa/admin.webmanifest',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'ARK Iowa' },
  icons: { apple: '/iowa/icons/admin-180.png' },
};

// Shared chrome for every /iowa/admin screen. The nav hides itself on /login.
export default async function IowaAdminLayout({ children }: { children: React.ReactNode }) {
  const me = await currentStaff().catch(() => null);
  const allowed = (['viewAllStudies', 'viewStudents', 'manageStaff', 'manageSettings'] as Permission[]).filter((p) =>
    can(me, p)
  );
  return (
    <>
      <AdminNav name={me?.name ?? null} allowed={allowed} />
      {children}
    </>
  );
}
