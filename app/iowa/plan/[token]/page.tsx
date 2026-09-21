import type { Metadata } from 'next';
import { planViewForToken } from '@/lib/semesterPlan';
import PlanForm from '@/components/iowa/PlanForm';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'ARK Iowa — plan next semester',
  robots: { index: false, follow: false },
};

// A student leader's private "plan next semester" page, from the emailed link.
export default async function LeaderPlanPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const view = await planViewForToken(token);

  return (
    <div style={{ background: '#FAF8F5', minHeight: '100vh' }}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        {!view ? (
          <p className="text-lg" style={{ color: 'var(--navy)' }}>That link doesn’t work anymore. Text us and we’ll sort it out.</p>
        ) : view.study.planned_at ? (
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <p className="text-xl font-bold" style={{ color: 'var(--navy)' }}>Your plan is in.</p>
            <p className="text-[#4a4540] mt-1">{view.study.plan_note}. Need a change? Text us.</p>
          </div>
        ) : (
          <>
            <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--navy)' }}>
              What’s next for your {view.study.slot} group?
            </h1>
            <p className="text-[#4a4540] mb-8">
              Set your group’s day and time for next semester. Keep it together, or multiply: split into two
              groups at two times, each with room for new people.
            </p>
            <PlanForm view={view} submitUrl={`/api/iowa/plan/${token}`} />
          </>
        )}
      </div>
    </div>
  );
}
