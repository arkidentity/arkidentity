import type { Metadata } from 'next';
import IowaPageContent from './page-content';

export const metadata: Metadata = {
  title: 'Campus Ministry at University of Iowa | ARK Identity',
  description: 'Join weekly discipleship gatherings at U of Iowa. Learn to hear God\'s voice, follow Jesus daily, and make disciples through ARK Identity\'s campus ministry.',
  keywords: 'University of Iowa, campus ministry, discipleship, college students, Iowa City, Christian student groups',
  openGraph: {
    title: 'ARK Identity Campus Ministry - University of Iowa',
    description: 'Weekly discipleship gatherings and daily tools to help you follow Jesus through college.',
    url: 'https://arkidentity.com/iowa',
    siteName: 'ARK Identity',
    type: 'website',
  },
};

export default function IowaPage() {
  return <IowaPageContent />;
}
