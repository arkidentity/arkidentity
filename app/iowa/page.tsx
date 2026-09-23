import type { Metadata } from 'next';
import { currentBreak, iowaLandingData } from '@/lib/bibleStudies';
import IowaPageContent from './page-content';

// A marketing page doesn't need a database round trip per visitor: rebuild at
// most once a minute and serve the cached HTML. Seat counts can be up to a
// minute stale, which is safe — joinStudy re-checks capacity on submit.
export const revalidate = 60;

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
  let data: Awaited<ReturnType<typeof iowaLandingData>> = { studies: [], counts: { running: 0, open: 0 }, tabs: [] };
  let pause: Awaited<ReturnType<typeof currentBreak>> = null;
  try {
    [data, pause] = await Promise.all([iowaLandingData(), currentBreak()]);
  } catch (e) {
    console.error('[iowa page] study data unavailable', e);
  }
  const { studies, counts, tabs } = data;
  return <IowaPageContent studies={studies} counts={counts} pause={pause} tabs={tabs} />;
}
