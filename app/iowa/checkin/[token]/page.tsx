import type { Metadata } from 'next';
import { checkinByToken } from '@/lib/semesterCheckins';
import CheckinForm from '@/components/iowa/CheckinForm';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'ARK Iowa — next semester',
  robots: { index: false, follow: false },
};

// A returning student's "in for next semester?" page, from their emailed or
// texted link (migration 038).
export default async function CheckinPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const c = await checkinByToken(token);
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
              {c.name.split(' ')[0] ? `${c.name.split(' ')[0]}, are` : 'Are'} you in for {c.semester}?
            </h1>
            <p className="text-[#4a4540] mb-8">
              Tell us if you’re in and when you’re free. We’ll set the groups at times that actually work.
            </p>
            <CheckinForm token={token} semester={c.semester} initial={{ response: c.response, slots: c.free_slots }} />
          </>
        )}
      </div>
    </div>
  );
}
