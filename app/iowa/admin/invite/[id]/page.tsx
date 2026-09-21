import type { Metadata } from 'next';
import { respondToInvite, whenText } from '@/lib/eventInvites';
import { currentStaff } from '@/lib/iowaStaff';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { PageShell } from '@/components/iowa/campus/ui';
import DeclineForm from '@/components/iowa/DeclineForm';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'ARK Iowa — invite' };

// Landing page for the invite email's buttons. Behind the admin login.
// ?r=accept answers straight away; ?r=decline asks for a quick note first
// ("missing is fine, disappearing is not").
export default async function InvitePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ r?: string }>;
}) {
  const [{ id }, { r }] = await Promise.all([params, searchParams]);
  const me = await currentStaff();
  const { data: e } = await getSupabaseAdmin()
    .from('iowa_events')
    .select('id, title, event_date, start_time, repeat_weekly')
    .eq('id', id)
    .maybeSingle();

  let body: React.ReactNode;
  if (!e || !me) {
    body = <p className="text-[#4a4540]">That invite doesn’t exist anymore.</p>;
  } else if (r === 'accept') {
    let error = '';
    try {
      await respondToInvite(id, me, 'accepted');
    } catch (err) {
      error = (err as Error).message;
    }
    body = error ? (
      <p className="text-red-700">{error}</p>
    ) : (
      <>
        <p className="text-xl font-bold" style={{ color: 'var(--navy)' }}>You’re in: {e.title}</p>
        <p className="text-[#8a8378] mt-1">{whenText(e)}. It’s on your dashboard.</p>
      </>
    );
  } else {
    body = (
      <>
        <p className="text-xl font-bold mb-1" style={{ color: 'var(--navy)' }}>Can’t do {e.title}?</p>
        <p className="text-[#8a8378] mb-4">{whenText(e)}. A quick note helps whoever set it up.</p>
        <DeclineForm eventId={id} />
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
