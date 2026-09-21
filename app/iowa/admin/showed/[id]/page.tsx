import type { Metadata } from 'next';
import { recordFirstShow } from '@/lib/campusAutomation';
import { currentStaff } from '@/lib/iowaStaff';
import { PageShell } from '@/components/iowa/campus/ui';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'ARK Iowa — first study' };

// Landing page for the one-tap "Did they make it?" links in the morning email.
// Behind the admin login (the proxy), so link scanners that prefetch email
// links hit the login redirect and change nothing.
export default async function ShowedPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ v?: string }>;
}) {
  const [{ id }, { v }] = await Promise.all([params, searchParams]);
  const showed = v === 'yes' ? true : v === 'no' ? false : null;
  const result = showed === null ? null : await recordFirstShow(id, showed, await currentStaff());

  return (
    <PageShell>
      <div className="max-w-md mx-auto mt-10 rounded-xl border border-gray-200 bg-white p-6">
        {!result ? (
          <p className="text-[#4a4540]">That link didn’t work. The student may have been removed.</p>
        ) : showed ? (
          <>
            <p className="text-xl font-bold" style={{ color: 'var(--navy)' }}>
              🙌 Great, {result.name} made it.
            </p>
            <p className="text-[#8a8378] mt-1">Recorded for the {result.slot} study.</p>
          </>
        ) : (
          <>
            <p className="text-xl font-bold" style={{ color: 'var(--navy)' }}>
              Got it, {result.name} didn’t make it.
            </p>
            <p className="text-[#8a8378] mt-1">
              There’s a follow-up task on your list for today, with a few ways to reconnect.
            </p>
          </>
        )}
        <p className="mt-4 text-sm">
          <a href="/iowa/admin" className="font-semibold underline" style={{ color: 'var(--navy)' }}>
            Go to the dashboard
          </a>
        </p>
      </div>
    </PageShell>
  );
}
