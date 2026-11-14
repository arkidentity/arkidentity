import type { Metadata } from 'next';
import { currentStaff } from '@/lib/iowaStaff';
import { can } from '@/lib/iowaPerms';
import MoreMenu from '@/components/iowa/campus/MoreMenu';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'ARK Iowa — more' };

// The rest of the admin, one tap from the tab bar.
export default async function IowaMorePage() {
  const me = await currentStaff().catch(() => null);
  const links = [
    { href: '/iowa/admin/tasks', label: 'All tasks', sub: 'Filters, search, done, who’s carrying what' },
    ...(can(me, 'manageEvents') ? [{ href: '/iowa/admin/events', label: 'Events with sign-ups', sub: 'Trick or Truth, Baja 2027' }] : []),
    { href: '/iowa/admin/staff', label: can(me, 'manageStaff') ? 'Staff' : 'My account', sub: can(me, 'manageStaff') ? 'The team, logins, schedules' : 'Your details, password, schedule' },
    { href: '/iowa/admin/settings', label: 'Settings', sub: 'Notifications, install the app, semesters, lists' },
  ];
  return <MoreMenu name={me?.name ?? null} links={links} />;
}
