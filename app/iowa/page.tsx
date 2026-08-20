import type { Metadata } from 'next';
import IowaPageContent from './page-content';

export const metadata: Metadata = {
  title: 'ARK Iowa | A college ministry built on tables of four',
  description:
    'Tables of four at the University of Iowa, at a time you pick. One hour a week, all semester. Pick your day and time.',
  keywords:
    'University of Iowa, campus ministry, Iowa City, Bible study, Christian student groups, small groups, college students',
  openGraph: {
    title: 'ARK Iowa | A college ministry built on tables of four',
    description:
      'Tables of four at the University of Iowa, at a time you pick. One hour a week, all semester.',
    url: 'https://arkidentity.com/iowa',
    siteName: 'ARK Identity',
    type: 'website',
  },
};

export default function IowaPage() {
  return <IowaPageContent />;
}
