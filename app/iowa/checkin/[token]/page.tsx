import type { Metadata } from 'next';
import { checkinByToken } from '@/lib/semesterCheckins';
import CheckinForm from '@/components/iowa/CheckinForm';
import { currentSemesterName } from '@/lib/semesters';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'ARK Iowa — next semester',
  robots: { index: false, follow: false },
};

// A returning student's "in for next semester?" page, from their emailed or
// texted link (migration 038).
export default async function CheckinPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const [c, current] = await Promise.all([checkinByToken(token), currentSemesterName().catch(() => '')]);
  // A link for THIS semester goes to someone waiting for a study: ask when they're free.
  const now = !!c && c.semester === current;
  const first = c?.name.split(' ')[0] ?? '';
  return (
    <div style={{ background: '#FAF8F5', minHeight: '100vh' }}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        {!c ? (
          <p className="text-lg" style={{ color: 'var(--navy)' }}>
            That link doesn’t work anymore. Text us and we’ll sort it out.
          </p>
        ) : (
          <>
            <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--navy)' }}>
              {now
                ? `${first ? `${first}, w` : 'W'}hen are you free for a Bible study?`
                : `${first ? `${first}, are` : 'Are'} you in for ${c.semester}?`}
            </h1>
            <p className="text-[#4a4540] mb-8">
              {now
                ? 'Tap every time that works this week and after. We’ll find you a group that meets then.'
                : 'Tell us if you’re in and when you’re free. We’ll set the groups at times that actually work.'}
            </p>
            <CheckinForm now={now} token={token} semester={c.semester} initial={{ response: c.response, slots: c.free_slots }} />
          </>
        )}
      </div>
    </div>
  );
}
