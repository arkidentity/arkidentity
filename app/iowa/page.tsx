import type { Metadata } from 'next';
import { listListableStudies, studyCounts } from '@/lib/bibleStudies';
import IowaPageContent from './page-content';

export const dynamic = 'force-dynamic';

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

export default async function IowaPage() {
  // Live data drives the schedule module and the headline counts. If Supabase
  // is briefly unreachable, degrade to an empty schedule rather than 500 the
  // whole marketing page.
  let studies: Awaited<ReturnType<typeof listListableStudies>> = [];
  let counts = { running: 0, open: 0 };
  try {
    [studies, counts] = await Promise.all([listListableStudies(), studyCounts()]);
  } catch (e) {
    console.error('[iowa page] study data unavailable', e);
  }
  return <IowaPageContent studies={studies} counts={counts} />;
}
