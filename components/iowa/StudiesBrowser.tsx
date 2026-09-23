'use client';

import { useMemo, useState } from 'react';
import {
  PICKER_DAYS,
  BLOCKS,
  DAY_NAMES,
  blockOf,
  formatTime,
  spotsLabel,
} from '@/lib/bibleStudyFormat';
import JoinForm from '@/components/iowa/JoinForm';
import MetByPicker from '@/components/iowa/MetByPicker';

interface PublicStudy {
  id: string;
  day_of_week: number;
  start_time: string;
  location: string | null;
  capacity: number;
  spotsLeft: number;
  leader_name: string | null;
}

// During a school break (Settings → School calendar) signups stay open; `pause`
// just tells students which break it is and when studies meet again.
// `tabs` appears once next semester's signup opens (~Nov 30 for spring): the
// current semester and the next, each with its own studies.
export default function StudiesBrowser({
  initial,
  pause = null,
  tabs = [],
}: {
  initial: PublicStudy[];
  pause?: { name: string; resumes: string } | null;
  tabs?: { name: string; studies: PublicStudy[] }[];
}) {
  const [tab, setTab] = useState(tabs[0]?.name ?? '');
  const [studies, setStudies] = useState<PublicStudy[]>(tabs[0]?.studies ?? initial);
  const [cells, setCells] = useState<Set<string>>(new Set());
  const [openJoin, setOpenJoin] = useState<string | null>(null);
  const [showStart, setShowStart] = useState(false);
  const [showInterest, setShowInterest] = useState(false);

  async function refresh() {
    try {
      const res = await fetch(`/api/iowa/studies${tab ? `?semester=${encodeURIComponent(tab)}` : ''}`, { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (Array.isArray(data.studies)) setStudies(data.studies);
    } catch {
      /* keep what we have */
    }
  }

  function toggleCell(day: number, block: string) {
    const key = `${day}-${block}`;
    setCells((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const filtered = useMemo(() => {
    const list =
      cells.size === 0
        ? studies
        : studies.filter((s) => cells.has(`${s.day_of_week}-${blockOf(s.start_time)}`));
    return [...list].sort(
      (a, b) => a.day_of_week - b.day_of_week || a.start_time.localeCompare(b.start_time)
    );
  }, [studies, cells]);

  const byDay = useMemo(() => {
    const map = new Map<number, PublicStudy[]>();
    for (const s of filtered) {
      const arr = map.get(s.day_of_week) ?? [];
      arr.push(s);
      map.set(s.day_of_week, arr);
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  }, [filtered]);

  return (
    <div className="space-y-10">
      {tabs.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {tabs.map((t, i) => (
            <button
              key={t.name}
              type="button"
              onClick={() => {
                setTab(t.name);
                setStudies(t.studies);
                setOpenJoin(null);
              }}
              className="px-4 py-2 rounded-lg font-semibold text-sm transition"
              style={
                tab === t.name
                  ? { backgroundColor: 'var(--navy)', color: 'white' }
                  : { backgroundColor: '#f1ede7', color: 'var(--navy)' }
              }
            >
              {i === 0 ? `This semester` : t.name}
            </button>
          ))}
        </div>
      )}
      {tabs.length > 1 && tab !== tabs[0].name && (
        <p className="text-[#4a4540] -mt-4">
          Know your {tab} schedule? Grab a spot now, or start a {tab} study at a time that works.
        </p>
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
      {/* Filter grid */}
      <div>
        <span className="block text-sm font-semibold mb-1" style={{ color: 'var(--navy)' }}>
          When are you free?
        </span>
        <p className="text-sm text-[#8a8378] mb-3">
          Tap the times you could meet. We’ll show the studies open then. Leave it blank to see everything.
        </p>
        <div className="overflow-x-auto -mx-1 px-1">
          <table className="w-full border-separate" style={{ borderSpacing: '4px' }}>
            <thead>
              <tr>
                <th className="w-20"></th>
                {BLOCKS.map((b) => (
                  <th key={b.key} className="pb-1 text-center">
                    <span className="block text-xs font-bold" style={{ color: 'var(--navy)' }}>
                      {b.label}
                    </span>
                    <span className="block text-[10px] text-[#8a8378]">{b.hint}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PICKER_DAYS.map((day) => (
                <tr key={day.value}>
                  <th
                    className="text-left text-xs font-bold pr-1"
                    style={{ color: 'var(--navy)' }}
                  >
                    {day.label.slice(0, 3)}
                  </th>
                  {BLOCKS.map((b) => {
                    const on = cells.has(`${day.value}-${b.key}`);
                    return (
                      <td key={b.key}>
                        <button
                          type="button"
                          onClick={() => toggleCell(day.value, b.key)}
                          aria-pressed={on}
                          aria-label={`${day.label} ${b.label}`}
                          className="w-full h-10 rounded-md text-xs font-semibold transition"
                          style={{
                            backgroundColor: on ? 'var(--gold)' : '#f1ede7',
                            color: on ? 'var(--navy)' : '#8a8378',
                            border: on ? '1px solid var(--gold)' : '1px solid #e2ddd5',
                          }}
                        >
                          {on ? '✓' : ''}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Results */}
      <div>
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white px-6 py-8 text-center">
            <p className="text-lg font-semibold" style={{ color: 'var(--navy)' }}>
              No open Bible study at those times yet.
            </p>
            <p className="text-[#4a4540] mt-2">
              Start one — you’ll be first, and we’ll help fill it.
            </p>
            <button
              onClick={() => setShowStart(true)}
              className="mt-4 px-6 py-3 rounded-lg font-semibold transition hover:opacity-90"
              style={{ backgroundColor: 'var(--gold)', color: 'var(--navy)' }}
            >
              Start a new one
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {byDay.map(([day, list]) => (
              <div key={day}>
                <h3
                  className="text-sm font-bold uppercase tracking-wider mb-3"
                  style={{ color: 'var(--maroon)' }}
                >
                  {DAY_NAMES[day]}
                </h3>
                <div className="space-y-3">
                  {list.map((s) => (
                    <div key={s.id} className="rounded-xl border border-gray-200 bg-white">
                      <div className="flex items-center justify-between gap-4 px-5 py-4">
                        <div>
                          <p className="font-bold" style={{ color: 'var(--navy)' }}>
                            {formatTime(s.start_time)}
                            <span className="font-normal text-[#8a8378]">
                              {s.location ? ` · ${s.location}` : ''}
                            </span>
                          </p>
                          <p className="text-sm text-[#8a8378]">
                            {spotsLabel(s.spotsLeft, s.capacity)}
                            {s.leader_name ? ` · ${s.leader_name}` : ''}
                          </p>
                        </div>
                        <button
                          onClick={() => setOpenJoin(openJoin === s.id ? null : s.id)}
                          className="px-5 py-2.5 rounded-lg font-semibold text-sm transition hover:opacity-90 shrink-0"
                          style={{ backgroundColor: 'var(--gold)', color: 'var(--navy)' }}
                        >
                          {openJoin === s.id ? 'Close' : 'Join'}
                        </button>
                      </div>
                      {openJoin === s.id && (
                        <div className="px-5 pb-5">
                          <JoinForm
                            studyId={s.id}
                            slotLabel={`${DAY_NAMES[s.day_of_week]} · ${formatTime(s.start_time)}`}
                            location={s.location}
                            spotsLeft={s.spotsLeft}
                            capacity={s.capacity}
                            onJoined={refresh}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Start a new one */}
      <div className="rounded-xl border border-gray-200 bg-[#FAF8F5] px-6 py-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-bold" style={{ color: 'var(--navy)' }}>
              Don’t see a time that works?
            </p>
            <p className="text-sm text-[#4a4540]">
              Start a new study. You’ll be the first, and we’ll help you fill it.
            </p>
          </div>
          <button
            onClick={() => setShowStart((v) => !v)}
            className="px-5 py-2.5 rounded-lg font-semibold text-sm transition hover:opacity-80 shrink-0"
            style={{ border: '1px solid var(--navy)', color: 'var(--navy)' }}
          >
            {showStart ? 'Close' : 'Start one'}
          </button>
        </div>
        {showStart && (
          <div className="mt-5">
            <StartForm semester={tabs.length > 1 ? tab : undefined} />
          </div>
        )}
      </div>

      {/* The third door: plenty of students want in before they know their
          schedule, and the other two options both make them pick a time. */}
      <div className="rounded-xl border border-gray-200 bg-[#FAF8F5] px-6 py-6 mt-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-bold" style={{ color: 'var(--navy)' }}>
              Not sure about your schedule yet?
            </p>
            <p className="text-sm text-[#4a4540]">
              Leave your info and we’ll reach out this week to find a time that works.
            </p>
          </div>
          <button
            onClick={() => setShowInterest((v) => !v)}
            className="px-5 py-2.5 rounded-lg font-semibold text-sm transition hover:opacity-80 shrink-0"
            style={{ border: '1px solid var(--navy)', color: 'var(--navy)' }}
          >
            {showInterest ? 'Close' : 'Have us reach out'}
          </button>
        </div>
        {showInterest && (
          <div className="mt-5">
            <InterestForm />
          </div>
        )}
      </div>
    </div>
  );
}

// Name, number, and anything they want us to know — no day, no time, no study.
function InterestForm() {
  const [form, setForm] = useState({ name: '', phone: '', email: '', year: '', metBy: '', note: '', hpField: '' });
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
        body: JSON.stringify(form),
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

      <MetByPicker value={form.metBy} onChange={(metBy) => setForm({ ...form, metBy })} />

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
        disabled={status === 'loading'}
        className="w-full px-6 py-3 rounded-lg font-semibold transition hover:opacity-90 disabled:opacity-50"
        style={{ backgroundColor: 'var(--gold)', color: 'var(--navy)' }}
      >
        {status === 'loading' ? 'Sending…' : 'Have someone reach out'}
      </button>

      {status === 'error' && <p className="text-red-800 text-sm text-center">{message}</p>}
    </form>
  );
}

const inputClass =
  'w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-offset-0 focus:border-transparent';
const YEARS = ['First-year', 'Sophomore', 'Junior', 'Senior', 'Grad', 'Other'];

function StartForm({ semester }: { semester?: string }) {
  const [form, setForm] = useState({
    dayOfWeek: '',
    startTime: '',
    name: '',
    phone: '',
    email: '',
    year: '',
    metBy: '',
    hpField: '',
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setMessage('');
    try {
      const res = await fetch('/api/iowa/studies/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          dayOfWeek: Number(form.dayOfWeek),
          semester,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setStatus('success');
      } else {
        setStatus('error');
        setMessage(data.error || 'Something went wrong. Text (319) 359-7117.');
      }
    } catch {
      setStatus('error');
      setMessage('Something went wrong. Text (319) 359-7117.');
    }
  }

  if (status === 'success') {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <p className="font-bold" style={{ color: 'var(--navy)' }}>
          You’re first in a new study.
        </p>
        <p className="text-[#4a4540] mt-1">
          Travis will text you the location and help get two or three others in with you.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--navy)' }}>
            Day
          </label>
          <select
            required
            value={form.dayOfWeek}
            onChange={(e) => setForm({ ...form, dayOfWeek: e.target.value })}
            className={inputClass}
          >
            <option value="">Pick a day</option>
            {PICKER_DAYS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--navy)' }}>
            Time
          </label>
          <input
            type="time"
            required
            value={form.startTime}
            onChange={(e) => setForm({ ...form, startTime: e.target.value })}
            className={inputClass}
          />
        </div>
      </div>

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

      <MetByPicker value={form.metBy} onChange={(metBy) => setForm({ ...form, metBy })} />

      {/* honeypot — see JoinForm for why it's named this way */}
      <div aria-hidden="true" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' }}>
        <label htmlFor="hp-start">Leave this field empty</label>
        <input
          id="hp-start"
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
        disabled={status === 'loading'}
        className="w-full px-6 py-3 rounded-lg font-semibold transition hover:opacity-90 disabled:opacity-50"
        style={{ backgroundColor: 'var(--gold)', color: 'var(--navy)' }}
      >
        {status === 'loading' ? 'Starting…' : 'Start this study'}
      </button>

      {status === 'error' && (
        <p className="text-red-800 text-sm text-center">{message}</p>
      )}
    </form>
  );
}
