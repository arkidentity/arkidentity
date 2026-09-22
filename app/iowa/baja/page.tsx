import type { Metadata } from 'next';
import BajaPageContent from './page-content';

export const metadata: Metadata = {
  title: 'Baja Mission Trip 2027 | ARK Iowa',
  description:
    'A week of serving and sharing Jesus in Baja California, Mexico, with uReach. For University of Iowa students, summer 2027.',
  openGraph: {
    title: 'Baja Mission Trip 2027 | ARK Iowa',
    description: 'A week of serving and sharing Jesus in Baja California, Mexico. Summer 2027.',
    url: 'https://arkidentity.com/iowa/baja',
    siteName: 'ARK Identity',
    type: 'website',
  },
};

export default function BajaPage() {
  return <BajaPageContent />;
}
