import type { Metadata } from 'next';
import { scheduleByToken } from '@/lib/availability';
import ScheduleForm from '@/components/iowa/ScheduleForm';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'ARK Iowa — your schedule' };

// The private link a leader gets at the start of a semester. No login: the
// token is the key, same as the plan links and personal RSVPs.
export default async function SchedulePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const found = await scheduleByToken(token);

  if (!found) {
    return (
      <div style={{ background: '#FAF8F5', minHeight: '100vh' }}>
        <div className="max-w-xl mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--navy)' }}>
            This link has expired
          </h1>
          <p className="text-[#4a4540]">Text Travis and he&apos;ll send you a new one.</p>
        </div>
      </div>
    );
  }

  return (
    <ScheduleForm
      token={token}
      name={found.name}
      semester={found.link.semester}
      initial={found.blocks}
      submittedAt={found.link.submitted_at}
    />
  );
}
