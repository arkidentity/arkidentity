import type { Metadata } from 'next';
import BajaPageContent from './page-content';

export const metadata: Metadata = {
  title: 'Baja Mission Trip 2027 | ARK Iowa',
  description:
    'This summer, a family in Mexico moves into a home you built. One week in Baja with ARK Iowa, summer 2027.',
  openGraph: {
    title: 'Baja Mission Trip 2027 | ARK Iowa',
    description: 'This summer, a family in Mexico moves into a home you built. One week in Baja with ARK Iowa.',
    url: 'https://arkidentity.com/iowa/baja',
    siteName: 'ARK Identity',
    type: 'website',
  },
};

export default function BajaPage() {
  return <BajaPageContent />;
}
