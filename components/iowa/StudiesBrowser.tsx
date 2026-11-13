'use client';

import { useState } from 'react';
import type { GroupType, StudentGender } from '@/lib/bibleStudyFormat';
import SlotGrid from '@/components/iowa/SlotGrid';
import MetByPicker from '@/components/iowa/MetByPicker';

interface PublicStudy {
  id: string;
  day_of_week: number;
  start_time: string;
  location: string | null;
  capacity: number;
  spotsLeft: number;
  leader_name: string | null;
  group_type?: GroupType;
}

// The signup: gather when they're free, then staff text them a spot that fits
// (Travis, 11/13 — picking a study time yourself didn't hold up). Every signup
// lands as Needs a study with a follow-up task; "Who's waiting" on the Studies
// admin groups them by these times next to the open studies.
// `pause`: a school break (Settings → School calendar). `tabs`: once next
// semester's signup opens, the current semester and the next.
export default function StudiesBrowser({
  pause = null,
  tabs = [],
}: {
  initial?: PublicStudy[];
  pause?: { name: string; resumes: string } | null;
  tabs?: { name: string; studies: PublicStudy[] }[];
}) {
  const [tab, setTab] = useState(tabs[0]?.name ?? '');
  const [cells, setCells] = useState<Set<string>>(new Set());
  const [gender, setGender] = useState<StudentGender | null>(null);
  const [notSure, setNotSure] = useState(false);

  function toggleCell(day: number, block: string) {
    const key = `${day}-${block}`;
    setNotSure(false);
    setCells((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const pick = (on: boolean) => ({
    backgroundColor: on ? 'var(--gold)' : '#f1ede7',
    color: on ? 'var(--navy)' : '#8a8378',
    border: on ? '1px solid var(--gold)' : '1px solid #e2ddd5',
  });

  const blocked = cells.size === 0 && !notSure ? 'Tap the times you’re free, or “Not sure yet”.' : '';

  return (
    <div className="space-y-8">
      {tabs.length > 1 && (
        <div>
          <span className="block text-sm font-semibold mb-2" style={{ color: 'var(--navy)' }}>
            Which semester?
          </span>
          <div className="flex flex-wrap gap-2">
            {tabs.map((t, i) => (
              <button
                key={t.name}
                type="button"
                onClick={() => setTab(t.name)}
                className="px-4 py-2 rounded-lg font-semibold text-sm transition"
                style={
                  tab === t.name
                    ? { backgroundColor: 'var(--navy)', color: 'white' }
                    : { backgroundColor: '#f1ede7', color: 'var(--navy)' }
                }
              >
                {i === 0 ? 'This semester' : t.name}
              </button>
            ))}
          </div>
        </div>
      )}
      {pause && (tabs.length < 2 || tab === tabs[0].name) && (
        <div className="rounded-xl px-5 py-4" style={{ backgroundColor: '#f1ede7', border: '1px solid #e2ddd5' }}>
          <p className="font-semibold" style={{ color: 'var(--navy)' }}>
            Bible studies are off for {pause.name.toLowerCase()}.
          </p>
          <p className="text-[#4a4540] mt-1">
            They meet again the week of{' '}
            {new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' }).format(new Date(`${pause.resumes}T00:00:00Z`))}.
            Sign up now and you’ll be in from the first week back.
          </p>
        </div>
      )}

      {/* Guys + Co-ed or Girls + Co-ed: saved as guy/girl so we only offer studies that fit */}
      <div>
        <span className="block text-sm font-semibold mb-1" style={{ color: 'var(--navy)' }}>
          Which studies can you join?
        </span>
        <p className="text-sm text-[#8a8378] mb-3">We have guys’, girls’ and co-ed studies.</p>
        <div className="flex flex-wrap gap-2">
          {(['guy', 'girl'] as StudentGender[]).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGender(gender === g ? null : g)}
              className="px-5 py-2.5 rounded-lg text-sm font-semibold transition"
              style={pick(gender === g)}
            >
              {g === 'guy' ? 'Guys + Co-ed' : 'Girls + Co-ed'}
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className="block text-sm font-semibold mb-1" style={{ color: 'var(--navy)' }}>
          When are you free?
        </span>
        <p className="text-sm text-[#8a8378] mb-3">
          Tap every time you could meet for an hour. The more you pick, the faster we can find you a group.
        </p>
        <SlotGrid cells={cells} onToggle={toggleCell} />
        <button
          type="button"
          onClick={() => { setNotSure((v) => !v); setCells(new Set()); }}
          className="mt-3 px-4 py-2 rounded-lg text-sm font-semibold transition"
          style={pick(notSure)}
        >
          Not sure yet
        </button>
      </div>

      <InterestForm
        freeSlots={[...cells]}
        semester={tabs.length > 1 ? tab : undefined}
        gender={gender}
        submitLabel="Find me a study"
        blocked={blocked}
        extraNote={notSure ? 'Not sure of their schedule yet.' : ''}
        success={
          <>
            <p className="font-bold" style={{ color: 'var(--navy)' }}>Got it.</p>
            <p className="text-[#4a4540] mt-1">
              Someone from ARK Iowa will text you this week with a spot in a group that fits your schedule.
            </p>
          </>
        }
      />
    </div>
  );
}

// Name, number, and anything they want us to know — no day, no time, no study.
// `source` and `invites` let an outreach page (e.g. /iowa/truth) tag the
// follow-up task and ask which events they'd like an invite to.
export function InterestForm({
  freeSlots,
  semester,
  source,
  invites = [],
  submitLabel = 'Have someone reach out',
  typedMetBy = false,
  gender = null,
  blocked = '',
  extraNote = '',
  success,
}: {
  freeSlots: string[];
  semester?: string;
  source?: string;
  invites?: string[];
  submitLabel?: string;
  // Outreach volunteers aren't staff, so ask for a typed name instead of the picker.
  typedMetBy?: boolean;
  gender?: StudentGender | null;
  blocked?: string; // a reason the form can't be sent yet (shown, button disabled)
  extraNote?: string; // added to the follow-up note
  success?: React.ReactNode; // replaces the default thank-you
}) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', year: '', metBy: '', note: '', hpField: '' });
  const [metName, setMetName] = useState('');
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setMessage('');
    try {
      const res = await fetch('/api/iowa/studies/interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          note: [
            source ? `From ${source}.` : '',
            metName.trim() ? `Talked with ${metName.trim()}.` : '',
            extraNote,
            picked.size ? `Invite me to: ${invites.filter((i) => picked.has(i)).join(', ')}.` : '',
            form.note.trim(),
          ]
            .filter(Boolean)
            .join(' '),
          freeSlots,
          semester,
          gender,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) setStatus('success');
      else {
        setStatus('error');
        setMessage(data.error || 'Something went wrong. Text (319) 359-7117.');
      }
    } catch {
      setStatus('error');
      setMessage('Something went wrong. Text (319) 359-7117.');
    }
  }

  if (status === 'success') {
    if (success) return <div className="bg-white rounded-xl border border-gray-200 p-6">{success}</div>;
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <p className="font-bold" style={{ color: 'var(--navy)' }}>
          We’ve got you.
        </p>
        <p className="text-[#4a4540] mt-1">
          Someone from ARK Iowa will text you this week to find a time that fits your schedule.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      <input
        type="text"
        required
        placeholder="Your name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        className={inputClass}
      />
      <input
        type="tel"
        required
        placeholder="A number we can text"
        value={form.phone}
        onChange={(e) => setForm({ ...form, phone: e.target.value })}
        className={inputClass}
      />
      <input
        type="email"
        required
        placeholder="you@uiowa.edu"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        className={inputClass}
      />

      <div className="flex flex-wrap gap-2">
        {YEARS.map((y) => (
          <button
            key={y}
            type="button"
            onClick={() => setForm({ ...form, year: form.year === y ? '' : y })}
            className="px-3 py-1.5 rounded-md text-sm font-semibold transition"
            style={{
              backgroundColor: form.year === y ? 'var(--gold)' : '#f1ede7',
              color: form.year === y ? 'var(--navy)' : '#8a8378',
              border: form.year === y ? '1px solid var(--gold)' : '1px solid #e2ddd5',
            }}
          >
            {y}
          </button>
        ))}
      </div>

      <input
        type="text"
        placeholder="Anything we should know? (optional)"
        value={form.note}
        onChange={(e) => setForm({ ...form, note: e.target.value })}
        className={inputClass}
      />

      {invites.length > 0 && (
        <div>
          <span className="block text-sm font-semibold mb-2" style={{ color: 'var(--navy)' }}>
            Invite me to
          </span>
          <div className="flex flex-wrap gap-2">
            {invites.map((label) => {
              const on = picked.has(label);
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() =>
                    setPicked((prev) => {
                      const next = new Set(prev);
                      if (on) next.delete(label);
                      else next.add(label);
                      return next;
                    })
                  }
                  className="px-3 py-1.5 rounded-md text-sm font-semibold transition"
                  style={{
                    backgroundColor: on ? 'var(--gold)' : '#f1ede7',
                    color: on ? 'var(--navy)' : '#8a8378',
                    border: on ? '1px solid var(--gold)' : '1px solid #e2ddd5',
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {typedMetBy ? (
        <input
          type="text"
          placeholder="Who did you talk to? (optional)"
          value={metName}
          onChange={(e) => setMetName(e.target.value)}
          className={inputClass}
        />
      ) : (
        <MetByPicker value={form.metBy} onChange={(metBy) => setForm({ ...form, metBy })} />
      )}

      {/* honeypot — see JoinForm for why it's named this way */}
      <div aria-hidden="true" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' }}>
        <label htmlFor="hp-interest">Leave this field empty</label>
        <input
          id="hp-interest"
          type="text"
          name="hp_field"
          tabIndex={-1}
          autoComplete="off"
          value={form.hpField}
          onChange={(e) => setForm({ ...form, hpField: e.target.value })}
        />
      </div>

      <button
        type="submit"
        disabled={status === 'loading' || !!blocked}
        className="w-full px-6 py-3 rounded-lg font-semibold transition hover:opacity-90 disabled:opacity-50"
        style={{ backgroundColor: 'var(--gold)', color: 'var(--navy)' }}
      >
        {status === 'loading' ? 'Sending…' : submitLabel}
      </button>
      {blocked && <p className="text-sm text-[#8a8378] text-center">{blocked}</p>}

      {status === 'error' && <p className="text-red-800 text-sm text-center">{message}</p>}
    </form>
  );
}

const inputClass =
  'w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-offset-0 focus:border-transparent';
const YEARS = ['First-year', 'Sophomore', 'Junior', 'Senior', 'Grad', 'Other'];
