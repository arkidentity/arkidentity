import type { Metadata } from 'next';
import { currentBreak, listListableStudies, publicSemesterTabs } from '@/lib/bibleStudies';
import StudiesBrowser from '@/components/iowa/StudiesBrowser';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'ARK Iowa — Bible studies',
  description: 'Bible studies at the University of Iowa. Tell us when you’re free and we’ll text you a spot.',
  robots: { index: false, follow: false },
};

export default async function IowaStudiesPage() {
  const [studies, pause, tabs] = await Promise.all([listListableStudies(), currentBreak(), publicSemesterTabs()]);

  return (
    <div style={{ background: '#FAF8F5', minHeight: '100vh' }}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <h1 className="text-3xl md:text-4xl font-bold mb-3" style={{ color: 'var(--navy)' }}>
          Join a Bible study
        </h1>
        <p className="text-lg text-[#4a4540] mb-10">
          One hour a week, four students, all semester. Tell us when you’re free and we’ll text you a
          spot in a group that fits.
        </p>
        <StudiesBrowser initial={studies} pause={pause} tabs={tabs} />
      </div>
    </div>
  );
}
