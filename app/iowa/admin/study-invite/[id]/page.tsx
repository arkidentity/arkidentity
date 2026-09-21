import type { Metadata } from 'next';
import { respondStudyInvite } from '@/lib/studyTeam';
import { currentStaff } from '@/lib/iowaStaff';
import { PageShell } from '@/components/iowa/campus/ui';
import DeclineForm from '@/components/iowa/DeclineForm';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'ARK Iowa — study invite' };

// Landing page for a study-team invite email (shadowing / assisting / leading).
export default async function StudyInvitePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ r?: string }>;
}) {
  const [{ id }, { r }] = await Promise.all([params, searchParams]);
  const me = await currentStaff();
  // Answer first, render after (no JSX inside try/catch).
  let accepted: { title: string; when: string } | null = null;
  let error = '';
  if (me && r === 'accept') {
    try {
      accepted = await respondStudyInvite(id, me, 'accepted');
    } catch (e) {
      error = (e as Error).message;
    }
  }

  let body: React.ReactNode;
  if (!me) {
    body = <p className="text-[#4a4540]">Sign in again.</p>;
  } else if (error) {
    body = <p className="text-red-700">{error}</p>;
  } else if (accepted) {
    body = (
      <>
        <p className="text-xl font-bold" style={{ color: 'var(--navy)' }}>You’re in: {accepted.title}</p>
        <p className="text-[#8a8378] mt-1">{accepted.when}. It’s on your dashboard.</p>
      </>
    );
  } else {
    body = (
      <>
        <p className="text-xl font-bold mb-1" style={{ color: 'var(--navy)' }}>Can’t do it?</p>
        <p className="text-[#8a8378] mb-4">A quick note helps whoever asked.</p>
        <DeclineForm endpoint={`/api/iowa/admin/study-team/${id}/respond`} />
      </>
    );
  }
  return (
    <PageShell>
      <div className="max-w-md mx-auto mt-10 rounded-xl border border-gray-200 bg-white p-6">
        {body}
        <p className="mt-5 text-sm">
          <a href="/iowa/admin" className="font-semibold underline" style={{ color: 'var(--navy)' }}>Go to the dashboard</a>
        </p>
      </div>
    </PageShell>
  );
}
