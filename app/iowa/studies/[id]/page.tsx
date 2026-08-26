import type { Metadata } from 'next';
import Link from 'next/link';
import { getPublicStudy, formatTime, DAY_NAMES } from '@/lib/bibleStudies';
import JoinForm from '@/components/iowa/JoinForm';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'ARK Iowa — Bible study',
  robots: { index: false, follow: false },
};

export default async function IowaStudyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const study = await getPublicStudy(id);

  return (
    <div style={{ background: '#FAF8F5', minHeight: '100vh' }}>
      <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <Link
          href="/iowa/studies"
          className="text-sm font-semibold hover:underline"
          style={{ color: 'var(--navy)' }}
        >
          ← All Bible studies
        </Link>

        {!study ? (
          <div className="mt-8 rounded-xl border border-gray-200 bg-white px-6 py-10 text-center">
            <p className="text-lg font-semibold" style={{ color: 'var(--navy)' }}>
              That study isn’t open right now.
            </p>
            <p className="text-[#4a4540] mt-2">
              <Link href="/iowa/studies" className="underline" style={{ color: 'var(--navy)' }}>
                See what else is running
              </Link>
              , or start a new one.
            </p>
          </div>
        ) : (
          <div className="mt-8">
            <h1 className="text-3xl font-bold mb-1" style={{ color: 'var(--navy)' }}>
              {DAY_NAMES[study.day_of_week]} · {formatTime(study.start_time)}
            </h1>
            <p className="text-lg text-[#4a4540] mb-8">
              {study.location}
              {study.leader_name ? ` · led by ${study.leader_name}` : ''}
            </p>

            {study.spotsLeft > 0 ? (
              <JoinForm
                studyId={study.id}
                slotLabel={`${DAY_NAMES[study.day_of_week]} · ${formatTime(study.start_time)}`}
                location={study.location}
                spotsLeft={study.spotsLeft}
                capacity={study.capacity}
              />
            ) : (
              <div className="rounded-2xl border border-gray-200 bg-white px-6 py-8 text-center">
                <p className="font-semibold" style={{ color: 'var(--navy)' }}>
                  This study is full.
                </p>
                <p className="text-[#4a4540] mt-2">
                  <Link href="/iowa/studies" className="underline" style={{ color: 'var(--navy)' }}>
                    Find another open time
                  </Link>{' '}
                  or start a new one — every study starts with somebody being first.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
