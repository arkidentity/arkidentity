import { currentStaff } from '@/lib/iowaStaff';
import AdminNav from '@/components/iowa/campus/AdminNav';

// Shared chrome for every /iowa/admin screen. The nav hides itself on /login.
export default async function IowaAdminLayout({ children }: { children: React.ReactNode }) {
  const me = await currentStaff().catch(() => null);
  return (
    <>
      <AdminNav name={me?.name ?? null} />
      {children}
    </>
  );
}
