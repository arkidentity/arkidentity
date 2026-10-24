import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { currentStaff } from '@/lib/iowaStaff';
import { listOutreachDebriefs, listOutreachSignups } from '@/lib/outreach';
import { RemoveSignup } from './RemoveSignup';
import { OUTREACH_SLOTS, TRICK_OR_TRUTH, experienceLabel, slotLabel } from '@/lib/outreachFormat';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'ARK Iowa — Trick or Truth' };

// Who's coming to each Trick or Truth slot, for setting locations and box sets.
export default async function OutreachAdminPage() {
  const me = await currentStaff();
  if (!me) redirect('/iowa/admin/login');
  const [signups, debriefs] = await Promise.all([
    listOutreachSignups(TRICK_OR_TRUTH).catch(() => []),
    listOutreachDebriefs(TRICK_OR_TRUTH).catch(() => []),
  ]);
  const sum = (k: 'conversations' | 'read_verse' | 'signed_up' | 'prayed') => debriefs.reduce((n, d) => n + (d[k] ?? 0), 0);
  const navy = { color: 'var(--navy)' };

  return (
    <div style={{ background: '#FAF8F5', minHeight: '100vh' }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <div>
          <h1 className="text-2xl font-bold" style={navy}>
            Trick or Truth
          </h1>
          <p className="text-[#8a8378]">
            {signups.length} signed up · <a className="underline" href="/iowa/trick-or-truth">sign-up page</a> ·{' '}
            <a className="underline" href="/iowa/trick-or-truth/debrief">debrief link</a>
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
                    <li key={p.id} className="py-2 text-sm flex items-start justify-between gap-3">
                      <div>
                      <p>
                        <strong style={navy}>{p.name}</strong>
                        {p.bringing ? ` +${p.bringing}` : ''}
                        {p.under_18 ? ' · under 18' : ''} · <a href={`sms:${p.phone}`} className="underline">{p.phone}</a>
                      </p>
                      <p className="text-[#8a8378]">
                        {experienceLabel(p.experience)}
                        {p.note ? ` · “${p.note}”` : ''}
                      </p>
                      </div>
                      <RemoveSignup id={p.id} name={p.name} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}

        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-bold mb-3" style={navy}>
            Debriefs ({debriefs.length})
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 text-center">
            {(
              [
                ['Conversations', sum('conversations')],
                ['Read a verse', sum('read_verse')],
                ['Scanned / gave info', sum('signed_up')],
                ['Prayed with', sum('prayed')],
              ] as const
            ).map(([label, n]) => (
              <div key={label} className="rounded-lg bg-[#f1ede7] py-3">
                <p className="text-2xl font-bold" style={navy}>
                  {n}
                </p>
                <p className="text-xs text-[#8a8378]">{label}</p>
              </div>
            ))}
          </div>
          {debriefs.length === 0 ? (
            <p className="text-sm text-[#8a8378]">None yet. Text volunteers the debrief link each evening.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {debriefs.map((d) => (
                <li key={d.id} className="py-3 text-sm">
                  <p>
                    <strong style={navy}>{d.name}</strong>
                    {d.slot ? ` · ${slotLabel(d.slot)}` : ''}
                    {d.location ? ` · ${d.location}` : ''}
                    {d.again ? ` · again: ${d.again}` : ''}
                    {!d.ok_to_share ? ' · private' : ''}
                  </p>
                  {d.story && <p className="mt-1 whitespace-pre-line text-[#4a4540]">{d.story}</p>}
                  {d.learned && <p className="mt-1 text-[#8a8378]">Tip: {d.learned}</p>}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
