'use client';

import { useState } from 'react';

// Lab mock of the Studies tab (11/13).
// - Concept: a seating chart. Who's waiting for a seat on top, then every study by day.
// - One bold thing: each row shows its open seats as dots, so "where can Sam go?" is a glance.
// - Tap a waiting student → the studies that fit them (their free times, open seats) → Put in.
// - Tap a study → the same full study screen as Today (roster, attendance, add/move/drop).
// Sample data only (made-up names). Nothing saves.

const C = { ink: '#1a2b3c', paper: '#f8f6f2', card: '#ffffff', line: '#e7e2d9', muted: '#7d766b', gold: '#E8B562', late: '#b42318', study: '#2f6f5e' };
const STAFF: Record<string, string> = { me: 'You', keilor: 'Keilor', morgan: 'Morgan', jordan: 'Jordan' };
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

type Member = { name: string; year: string; leader?: boolean };
type Study = { id: string; day: number; time: string; where: string; cap: number; group: 'Guys' | 'Girls' | 'Co-ed'; onPoint: string | null; roster: Member[] };
type Waiting = { name: string; year: string; gender: 'Guy' | 'Girl'; free: number[]; since: string; met: string };

const S = (id: string, day: number, time: string, where: string, group: Study['group'], onPoint: string | null, names: string[]): Study => ({
  id, day, time, where, cap: 5, group, onPoint,
  roster: names.map((n, i) => ({ name: n.replace('*', ''), year: ['Freshman', 'Sophomore', 'Junior', 'Senior'][i % 4], leader: n.startsWith('*') })),
});
const STUDIES0: Study[] = [
  S('a', 0, '7:00 PM', 'Burge Hall lobby', 'Girls', 'morgan', ['*Hannah P.', 'Grace L.', 'Ruth A.', 'Mae O.']),
  S('b', 1, '12:30 PM', 'IMU food court', 'Co-ed', null, ['Nate R.', 'Lily T.']),
  S('c', 1, '8:00 PM', 'Online', 'Guys', 'keilor', ['*Jon A.', 'Sam V.', 'Eli G.', 'Ray C.', 'Tom H.']),
  S('d', 3, '2:00 PM', 'The Space at Old Brick', 'Girls', null, ['Mia L.', 'Ivy D.', 'Zoe R.']),
  S('e', 3, '4:30 PM', 'The Space at Old Brick', 'Guys', 'jordan', ['*Ben S.', 'Max W.', 'Abe K.']),
  S('f', 4, '10:30 AM', 'Tippie', 'Co-ed', 'me', ['Cole J.']),
];
const WAITING0: Waiting[] = [
  { name: 'Sam Ortiz', year: 'Freshman', gender: 'Guy', free: [1, 3], since: '9 days', met: 'Keilor at Taco Night' },
  { name: 'Ellie Park', year: 'Sophomore', gender: 'Girl', free: [0, 3], since: '3 days', met: 'Sign-up form' },
  { name: 'Rosa M.', year: 'Freshman', gender: 'Girl', free: [2], since: '2 days', met: 'Trick or Truth' },
];

const fits = (w: Waiting, s: Study) => s.roster.length < s.cap && (s.group === 'Co-ed' || (s.group === 'Guys') === (w.gender === 'Guy'));

export default function StudiesMock() {
  const [studies, setStudies] = useState(STUDIES0);
  const [waiting, setWaiting] = useState(WAITING0);
  const [open, setOpen] = useState<{ kind: 'study'; id: string } | { kind: 'wait'; name: string } | null>(null);
  const [filter, setFilter] = useState<'all' | 'room' | 'nobody'>('all');
  const [flash, setFlash] = useState('');
  const say = (m: string) => { setFlash(m); setTimeout(() => setFlash(''), 2200); };

  const put = (w: Waiting, s: Study) => {
    setStudies((ss) => ss.map((x) => (x.id === s.id ? { ...x, roster: [...x.roster, { name: w.name, year: w.year }] } : x)));
    setWaiting((ws) => ws.filter((x) => x.name !== w.name));
    setOpen(null);
    say(`${w.name} is in ${SHORT[s.day]} ${s.time}. A welcome-text task went to ${s.onPoint ? STAFF[s.onPoint] : 'you'}.`);
  };

  const shown = studies.filter((s) => filter === 'all' || (filter === 'room' ? s.roster.length < s.cap : !s.onPoint));
  const seats = studies.reduce((n, s) => n + s.cap - s.roster.length, 0);
  const study = open?.kind === 'study' ? studies.find((s) => s.id === open.id) : null;
  const wait = open?.kind === 'wait' ? waiting.find((w) => w.name === open.name) : null;

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto" style={{ background: C.paper, color: C.ink }}>
      <div className="max-w-xl mx-auto pb-28">
        <header className="px-4 pt-5 pb-3 flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold">Studies</h1>
            <p className="text-sm" style={{ color: C.muted }}>{studies.length} studies · {seats} open seats</p>
          </div>
        </header>

        {waiting.length > 0 && (
          <section className="mx-4 mb-5 rounded-xl p-3" style={{ background: '#fdf6e8', border: `1px solid ${C.gold}` }}>
            <h2 className="font-bold mb-1">Waiting for a study ({waiting.length})</h2>
            {waiting.map((w) => (
              <button key={w.name} onClick={() => setOpen({ kind: 'wait', name: w.name })} className="w-full flex items-center justify-between gap-3 py-2.5 text-left" style={{ borderTop: `1px solid ${C.line}` }}>
                <span className="min-w-0">
                  <span className="block font-semibold">{w.name}</span>
                  <span className="text-sm" style={{ color: C.muted }}>{w.year} · free {w.free.map((d) => SHORT[d]).join(', ')} · waiting {w.since}</span>
                </span>
                <span className="shrink-0 text-sm font-semibold px-3 min-h-11 inline-flex items-center rounded-lg" style={{ background: C.ink, color: '#fff' }}>Place</span>
              </button>
            ))}
          </section>
        )}

        <div className="px-4 mb-3 flex gap-2">
          {([['all', 'All'], ['room', 'Has room'], ['nobody', 'No staff']] as const).map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)} className="px-3 min-h-9 rounded-full text-sm font-semibold" style={filter === k ? { background: C.ink, color: '#fff' } : { border: `1px solid ${C.line}`, background: C.card }}>{l}</button>
          ))}
        </div>

        {DAYS.map((d, i) => {
          const list = shown.filter((s) => s.day === i);
          if (!list.length) return null;
          return (
            <section key={d} className="px-4 mb-4">
              <h2 className="text-sm font-bold mb-1.5" style={{ color: C.muted }}>{d}</h2>
              <ul className="rounded-xl overflow-hidden" style={{ background: C.card, border: `1px solid ${C.line}` }}>
                {list.map((s, j) => (
                  <li key={s.id} style={{ borderTop: j ? `1px solid ${C.line}` : 'none' }}>
                    <StudyRow s={s} onOpen={() => setOpen({ kind: 'study', id: s.id })} />
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      <button onClick={() => say('(Mock) opens New study: day, time, place, guys/girls/co-ed, staff on point')} className="fixed z-[61] right-4 bottom-6 px-5 min-h-12 rounded-full font-bold shadow-lg" style={{ background: C.gold, color: C.ink }}>+ New study</button>

      {wait && (
        <Sheet title={`Place ${wait.name}`} sub={`${wait.year} ${wait.gender.toLowerCase()} · met through ${wait.met}`} onClose={() => setOpen(null)}>
          <p className="text-sm mb-2" style={{ color: C.muted }}>Studies with room on the days they’re free:</p>
          <List items={studies.filter((s) => fits(wait, s) && wait.free.includes(s.day))} onPick={(s) => put(wait, s)} />
          <p className="text-sm mt-4 mb-2" style={{ color: C.muted }}>Other studies with room:</p>
          <List items={studies.filter((s) => fits(wait, s) && !wait.free.includes(s.day))} onPick={(s) => put(wait, s)} />
          <div className="flex justify-end gap-2 mt-5">
            <button className="px-4 min-h-11 rounded-lg font-semibold" style={{ border: `1px solid ${C.line}` }} onClick={() => say('(Mock) opens their student panel: status, notes, history')}>Open student</button>
          </div>
        </Sheet>
      )}

      {study && <StudyScreen s={study} waiting={waiting} onClose={() => setOpen(null)} onPut={(w) => put(w, study)} say={say} />}

      {flash && <div className="fixed z-[80] left-4 right-4 bottom-24 mx-auto max-w-md rounded-xl px-4 py-3 text-sm font-semibold shadow-lg" style={{ background: C.ink, color: '#fff' }}>{flash}</div>}
    </div>
  );
}

function Dots({ s }: { s: Study }) {
  return (
    <span className="inline-flex gap-1" aria-label={`${s.roster.length} of ${s.cap}`}>
      {Array.from({ length: s.cap }, (_, i) => (
        <span key={i} className="w-2.5 h-2.5 rounded-full" style={i < s.roster.length ? { background: C.study } : { border: `1.5px solid ${C.study}` }} />
      ))}
    </span>
  );
}

function StudyRow({ s, onOpen }: { s: Study; onOpen: () => void }) {
  const leader = s.roster.find((m) => m.leader);
  return (
    <button onClick={onOpen} className="w-full text-left px-4 py-3 flex items-start justify-between gap-3">
      <span className="min-w-0">
        <span className="block font-semibold">{s.time} · {s.group}</span>
        <span className="block text-sm truncate" style={{ color: C.muted }}>{s.where}{leader ? ` · led by ${leader.name}` : ''}</span>
        <span className="block text-sm mt-0.5" style={{ color: s.onPoint ? C.muted : C.late, fontWeight: s.onPoint ? 400 : 600 }}>
          {s.onPoint ? `Staff: ${STAFF[s.onPoint]}` : 'No staff on point'}
        </span>
      </span>
      <span className="shrink-0 text-right">
        <Dots s={s} />
        <span className="block text-xs mt-1" style={{ color: C.muted }}>{s.roster.length >= s.cap ? 'Full' : `${s.cap - s.roster.length} open`}</span>
      </span>
    </button>
  );
}

function List({ items, onPick }: { items: Study[]; onPick: (s: Study) => void }) {
  if (!items.length) return <p className="text-sm italic" style={{ color: C.muted }}>None.</p>;
  return (
    <ul className="rounded-xl overflow-hidden" style={{ background: C.card, border: `1px solid ${C.line}` }}>
      {items.map((s, i) => (
        <li key={s.id} className="flex items-center justify-between gap-3 px-4 py-2.5" style={{ borderTop: i ? `1px solid ${C.line}` : 'none' }}>
          <span className="min-w-0">
            <span className="block font-semibold">{SHORT[s.day]} {s.time} · {s.group}</span>
            <span className="text-sm flex items-center gap-2" style={{ color: C.muted }}><Dots s={s} /> {s.where}</span>
          </span>
          <button onClick={() => onPick(s)} className="shrink-0 px-3 min-h-11 rounded-lg text-sm font-semibold" style={{ background: C.study, color: '#fff' }}>Put in</button>
        </li>
      ))}
    </ul>
  );
}

function Sheet({ title, sub, onClose, children }: { title: string; sub?: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto" style={{ background: C.paper }}>
      <div className="max-w-xl mx-auto min-h-full flex flex-col">
        <div className="px-2 pt-3"><button className="min-h-11 px-2 font-semibold" onClick={onClose}>‹ Back</button></div>
        <div className="px-4 pb-4">
          <h1 className="text-2xl font-bold leading-tight">{title}</h1>
          {sub && <p className="mt-1" style={{ color: C.muted }}>{sub}</p>}
        </div>
        <div className="px-4 pb-8 flex-1 flex flex-col">{children}</div>
      </div>
    </div>
  );
}

function StudyScreen({ s, waiting, onClose, onPut, say }: { s: Study; waiting: Waiting[]; onClose: () => void; onPut: (w: Waiting) => void; say: (m: string) => void }) {
  const [adding, setAdding] = useState(false);
  const leader = s.roster.find((m) => m.leader);
  const fitsHere = waiting.filter((w) => fits(w, s));
  const btn = 'px-4 min-h-11 rounded-lg font-semibold';
  return (
    <Sheet title={`${DAYS[s.day]} ${s.time}`} sub={`${s.where} · ${s.group}`} onClose={onClose}>
      <dl className="rounded-xl px-4 py-1 mb-5" style={{ background: C.card, border: `1px solid ${C.line}` }}>
        {([
          ['Students', <span key="d" className="inline-flex items-center gap-2"><Dots s={s} /> {s.roster.length} of {s.cap}</span>],
          ['Student leader', leader?.name ?? <span style={{ color: C.muted }}>None yet</span>],
          ['Staff on point', s.onPoint ? STAFF[s.onPoint] : <span style={{ color: C.late }}>Nobody</span>],
        ] as [string, React.ReactNode][]).map(([k, v], i) => (
          <div key={k} className="flex justify-between gap-4 py-2.5" style={{ borderTop: i ? `1px solid ${C.line}` : 'none' }}>
            <dt style={{ color: C.muted }}>{k}</dt><dd className="font-semibold text-right">{v}</dd>
          </div>
        ))}
      </dl>

      <h2 className="font-bold mb-1.5">Students</h2>
      <ul className="rounded-xl overflow-hidden mb-2" style={{ background: C.card, border: `1px solid ${C.line}` }}>
        {s.roster.map((m, i) => (
          <li key={m.name} style={{ borderTop: i ? `1px solid ${C.line}` : 'none' }}>
            <button onClick={() => say(`(Mock) opens ${m.name}: status, move, drop, history`)} className="w-full text-left px-4 py-2.5">
              <span className="block font-semibold">{m.name}{m.leader && <span className="text-xs ml-2" style={{ color: C.muted }}>Leader</span>}</span>
              <span className="text-sm" style={{ color: C.muted }}>{m.year}</span>
            </button>
          </li>
        ))}
      </ul>

      {s.roster.length < s.cap && (
        adding ? (
          <div className="mt-3">
            <p className="text-sm mb-2" style={{ color: C.muted }}>Waiting students who fit:</p>
            {fitsHere.length ? (
              <ul className="rounded-xl overflow-hidden" style={{ background: C.card, border: `1px solid ${C.line}` }}>
                {fitsHere.map((w, i) => (
                  <li key={w.name} className="flex items-center justify-between gap-3 px-4 py-2.5" style={{ borderTop: i ? `1px solid ${C.line}` : 'none' }}>
                    <span><span className="block font-semibold">{w.name}</span><span className="text-sm" style={{ color: C.muted }}>{w.year} · free {w.free.map((d) => SHORT[d]).join(', ')}</span></span>
                    <button onClick={() => onPut(w)} className="px-3 min-h-11 rounded-lg text-sm font-semibold" style={{ background: C.study, color: '#fff' }}>Put in</button>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm italic" style={{ color: C.muted }}>Nobody waiting fits this study.</p>}
            <button className="mt-2 text-sm font-semibold underline" onClick={() => say('(Mock) search every student, or add a new one')}>Search all students</button>
          </div>
        ) : (
          <button className="text-sm font-semibold underline self-start" onClick={() => setAdding(true)}>Add a student</button>
        )
      )}

      <div className="sticky bottom-0 mt-auto -mx-4 px-4 pt-3 flex justify-end gap-2 flex-wrap" style={{ background: C.paper, borderTop: `1px solid ${C.line}`, paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}>
        <button className={btn} style={{ border: `1px solid ${C.line}` }} onClick={() => say('(Mock) Edit: day, time, place, group, staff on point; More options for the rest')}>Edit</button>
        <button className={btn} style={{ border: `1px solid ${C.line}` }} onClick={() => say('(Mock) texts the whole group')}>Text group</button>
        <button className={btn} style={{ background: C.ink, color: '#fff' }} onClick={() => say('(Mock) attendance: Came / Missed for each')}>Attendance</button>
      </div>
    </Sheet>
  );
}
