'use client';

import { usePathname } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const PUBLIC_ROUTES = [
  '/about',
  '/team',
  '/beliefs',
  '/giving',
  '/get-involved',
  '/vision',
  '/vision-2026',
  '/campus',
  '/iowa',
];

export function BrochureShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isPublicPage = PUBLIC_ROUTES.some(
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
