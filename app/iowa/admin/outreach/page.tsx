import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { currentStaff } from '@/lib/iowaStaff';
import { listOutreachSignups } from '@/lib/outreach';
import { OUTREACH_SLOTS, TRICK_OR_TRUTH, experienceLabel } from '@/lib/outreachFormat';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'ARK Iowa — Trick or Truth' };

// Who's coming to each Trick or Truth slot, for setting locations and box sets.
export default async function OutreachAdminPage() {
  const me = await currentStaff();
  if (!me) redirect('/iowa/admin/login');
  const signups = await listOutreachSignups(TRICK_OR_TRUTH).catch(() => []);
  const navy = { color: 'var(--navy)' };

  return (
    <div style={{ background: '#FAF8F5', minHeight: '100vh' }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <div>
          <h1 className="text-2xl font-bold" style={navy}>
            Trick or Truth
          </h1>
          <p className="text-[#8a8378]">
            {signups.length} signed up · <a className="underline" href="/iowa/trick-or-truth">sign-up page</a>
          </p>
        </div>

        {OUTREACH_SLOTS.map((slot) => {
          const people = signups.filter((s) => s.slots.includes(slot.key));
          const total = people.reduce((n, p) => n + 1 + p.bringing, 0);
          const leads = people.filter((p) => p.experience === 'lead').length;
          return (
            <section key={slot.key} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-baseline justify-between gap-3 mb-3">
                <h2 className="font-bold" style={navy}>
                  {slot.label}
                </h2>
                <p className="text-sm text-[#8a8378]">
                  <strong style={navy}>{total}</strong> people · {leads} can lead
                </p>
              </div>
              {people.length === 0 ? (
                <p className="text-sm text-[#8a8378]">Nobody yet.</p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {people.map((p) => (
                    <li key={p.id} className="py-2 text-sm">
                      <p>
                        <strong style={navy}>{p.name}</strong>
                        {p.bringing ? ` +${p.bringing}` : ''}
                        {p.under_18 ? ' · under 18' : ''} · <a href={`sms:${p.phone}`} className="underline">{p.phone}</a>
                      </p>
                      <p className="text-[#8a8378]">
                        {experienceLabel(p.experience)}
                        {p.note ? ` · “${p.note}”` : ''}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
