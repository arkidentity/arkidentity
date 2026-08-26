import type { Metadata } from 'next';
import { listListableStudies } from '@/lib/bibleStudies';
import StudiesBrowser from '@/components/iowa/StudiesBrowser';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'ARK Iowa — Bible studies',
  description: 'Open Bible studies at the University of Iowa. Pick a time, or start one.',
  robots: { index: false, follow: false },
};

export default async function IowaStudiesPage() {
  const studies = await listListableStudies();

  return (
    <div style={{ background: '#FAF8F5', minHeight: '100vh' }}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <h1 className="text-3xl md:text-4xl font-bold mb-3" style={{ color: 'var(--navy)' }}>
          Find a Bible study
        </h1>
        <p className="text-lg text-[#4a4540] mb-10">
          One hour a week, four students, all semester. Join one that’s open, or start a new one at a
          time that works for you.
        </p>
        <StudiesBrowser initial={studies} />
      </div>
    </div>
  );
}
