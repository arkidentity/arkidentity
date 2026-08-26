'use client';

import { usePathname } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const PUBLIC_ROUTES = [
  '/courses',
  '/about',
  '/team',
  '/beliefs',
  '/giving',
  '/get-involved',
  '/feed',
  '/unsubscribe',
  '/vision',
  '/vision-2026',
  '/campus',
  '/iowa',
];

export function BrochureShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // The Iowa Bible-study admin is a tool, not a brochure page — render it bare
  // like the feed admin, even though it lives under /iowa.
  const isAdminTool = pathname.startsWith('/iowa/admin');

  const isPublicPage =
    !isAdminTool &&
    PUBLIC_ROUTES.some(
      (route) => pathname === route || (route !== '/' && pathname.startsWith(route + '/'))
    );

  if (isPublicPage) {
    return (
      <>
        <Header />
        <main>{children}</main>
        <Footer />
      </>
    );
  }

  return <>{children}</>;
}
