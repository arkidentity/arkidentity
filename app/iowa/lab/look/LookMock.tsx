'use client';

import { useState } from 'react';

// Lab 11/13: one look for every admin screen, not a one-off for Today.
//
// Concept: a clipboard. Navy is the board you hold (top + bottom); cream is the
// paper; white cards are the items clipped to it. Gold is only ever "do this".
//
// Color jobs (each color has exactly one):
//   navy   = frame. Every list screen has a navy header: title, your numbers, and its
//            filters (filters move up into the header, so the cream area is only content).
//   cream  = background. White cards hold rows. No borders on everything; hairlines between rows.
//   gold   = the one main action on a screen (+ New …, Done, Put in). Nothing decorative.
//   green / purple = what a thing IS (study / event): a 4px bar on the row's left edge,
//            the same on Today, Calendar and Studies, so you learn it once.
//   red    = late / needs someone. Words in red, never red boxes.
// Detail screens flip it: a navy title block (what it is, the key facts) so you
// always know you're "inside" something, then cream content, then a white action bar
// with the gold button bottom-right.
// Type: 28 bold screen title · 17 bold section · 16 semibold row · 14 muted detail. Nothing smaller
// except tab labels. No all caps.

const C = {
  navy: '#143348', navy2: '#1e4560', cream: '#f6f3ee', card: '#fff', line: '#ece6dc', muted: '#7a7369',
  gold: '#E8B562', study: '#2f8a6e', event: '#6a5bc4', late: '#c0392b', onNavyMuted: 'rgba(255,255,255,0.68)',
};

type Screen = 'today' | 'studies' | 'study';

const TASKS = [
  { t: 'Welcome texts to 3 new students', s: 'Sam, Ellie, Rosa', due: 'Today', urgent: true },
  { t: 'Confirm Fri 10:30 AM study', s: 'Fri 10:30 AM study', due: 'Today', urgent: true },
  { t: 'Follow up with Zane', s: 'with Keilor', due: '3 days late', late: true },
  { t: 'Text the Connect list', s: 'Jordan’s', due: 'Today' },
];
const TODAY = [
  { time: '8:00 AM', title: 'Friday Fill Up', where: 'Online', kind: 'event' as const },
  { time: '10:30 AM', title: 'Bible study · Co-ed', where: 'Tippie · 1 of 5', kind: 'study' as const },
  { time: '4:15 PM', title: 'Bible study · Guys', where: 'Old Capitol Mall · full', kind: 'study' as const },
];
const STUDIES = [
  { day: 'Monday', time: '7:00 PM', group: 'Girls', where: 'Burge Hall lobby', leader: 'Hannah P.', staff: 'Morgan', n: 4 },
  { day: 'Tuesday', time: '12:30 PM', group: 'Co-ed', where: 'IMU food court', leader: null, staff: null, n: 2 },
  { day: 'Tuesday', time: '8:00 PM', group: 'Guys', where: 'Online', leader: 'Jon A.', staff: 'Keilor', n: 5 },
  { day: 'Thursday', time: '2:00 PM', group: 'Girls', where: 'The Space at Old Brick', leader: null, staff: null, n: 3 },
  { day: 'Friday', time: '10:30 AM', group: 'Co-ed', where: 'Tippie', leader: null, staff: 'You', n: 1 },
];
const ROSTER = [['Nate Ruiz', 'Sophomore · met Travis'], ['Lily Tran', 'Freshman · friend invited']];

export default function LookMock() {
  const [screen, setScreen] = useState<Screen>('today');
  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto" style={{ background: C.cream, color: C.navy }}>
      <div className="max-w-xl mx-auto pb-36">
        {screen === 'today' && <Today />}
        {screen === 'studies' && <Studies open={() => setScreen('study')} />}
        {screen === 'study' && <Study back={() => setScreen('studies')} />}
      </div>
      {screen !== 'study' && <Tabs screen={screen} go={setScreen} />}
    </div>
  );
}

/* ---------- shared pieces (these become real components) ---------- */

function Header({ kicker, title, children }: { kicker?: string; title: string; children?: React.ReactNode }) {
  return (
    <header className="px-5 pt-6 pb-5" style={{ background: C.navy, color: '#fff' }}>
      {kicker && <p className="text-sm" style={{ color: C.onNavyMuted }}>{kicker}</p>}
      <h1 className="text-[28px] font-bold leading-tight">{title}</h1>
      {children}
    </header>
  );
}
function Numbers({ items }: { items: [string, string, boolean?][] }) {
  return (
    <div className="flex gap-6 mt-3">
      {items.map(([n, l, warn]) => (
        <div key={l}>
          <p className="text-[22px] font-bold leading-none" style={{ color: warn ? '#ffb3a7' : '#fff' }}>{n}</p>
          <p className="text-sm mt-1" style={{ color: C.onNavyMuted }}>{l}</p>
        </div>
      ))}
    </div>
  );
}
function NavyChips({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-2 mt-4 overflow-x-auto -mx-5 px-5">
      {options.map((o) => (
        <button key={o} onClick={() => onChange(o)} className="shrink-0 px-3.5 min-h-9 rounded-full text-sm font-semibold"
          style={value === o ? { background: '#fff', color: C.navy } : { background: C.navy2, color: '#fff' }}>
          {o}
        </button>
      ))}
    </div>
  );
}
function Section({ title, count, children }: { title: string; count?: string; children: React.ReactNode }) {
  return (
    <section className="px-4 mt-6">
      <h2 className="text-[17px] font-bold mb-2 px-1">
        {title} {count && <span className="font-normal" style={{ color: C.muted }}>{count}</span>}
      </h2>
      <ul className="rounded-2xl overflow-hidden" style={{ background: C.card, boxShadow: '0 1px 2px rgba(20,51,72,0.06)' }}>{children}</ul>
    </section>
  );
}
function Row({ first, bar, title, sub, right, rightColor, onClick, dot }: {
  first?: boolean; bar?: string; title: string; sub?: string; right?: React.ReactNode; rightColor?: string; onClick?: () => void; dot?: boolean;
}) {
  return (
    <li style={{ borderTop: first ? 'none' : `1px solid ${C.line}` }}>
      <button onClick={onClick} className="w-full text-left flex items-stretch gap-3 pr-4 min-h-14">
        <span className="w-1 shrink-0" style={{ background: bar ?? 'transparent' }} />
        <span className="min-w-0 flex-1 py-3">
          <span className="block text-base font-semibold leading-snug">
            {dot && <span className="inline-block w-2 h-2 rounded-full mr-2 align-middle" style={{ background: C.gold }} />}
            {title}
          </span>
          {sub && <span className="block text-sm mt-0.5" style={{ color: C.muted }}>{sub}</span>}
        </span>
        {right && <span className="self-center text-sm font-semibold shrink-0 text-right" style={{ color: rightColor ?? C.muted }}>{right}</span>}
      </button>
    </li>
  );
}
function Seats({ n, cap = 5 }: { n: number; cap?: number }) {
  return (
    <span className="inline-flex gap-1 align-middle">
      {Array.from({ length: cap }, (_, i) => (
        <span key={i} className="w-2.5 h-2.5 rounded-full" style={i < n ? { background: C.study } : { border: `1.5px solid ${C.study}` }} />
      ))}
    </span>
  );
}

/* ---------- Today ---------- */
function Today() {
  return (
    <>
      <Header kicker="Friday, November 13" title="Hey Travis">
        <Numbers items={[['4', 'to do now'], ['1', 'late', true], ['3', 'on campus']]} />
      </Header>
      <Section title="Do now">
        {TASKS.map((t, i) => (
          <Row key={i} first={!i} title={t.t} sub={t.s} dot={t.urgent} right={t.due} rightColor={t.late ? C.late : undefined} />
        ))}
      </Section>
      <Section title="On campus today">
        {TODAY.map((e, i) => (
          <Row key={i} first={!i} bar={e.kind === 'study' ? C.study : C.event} title={e.title} sub={`${e.time} · ${e.where}`} />
        ))}
      </Section>
      <Section title="Coming up" count="2">
        <Row first bar={C.event} title="Baja trip meeting" sub="Sun 6:00 PM" />
        <Row bar={C.event} title="Taco Night" sub="Mon 7:00 PM" />
      </Section>
    </>
  );
}

/* ---------- Studies ---------- */
function Studies({ open }: { open: () => void }) {
  const [f, setF] = useState('All');
  const list = STUDIES.filter((s) => f === 'All' || (f === 'Has room' ? s.n < 5 : f === 'No staff' ? !s.staff : s.staff === 'You'));
  const days = [...new Set(list.map((s) => s.day))];
  return (
    <>
      <Header kicker="Fall 2026" title="Studies">
        <Numbers items={[['5', 'studies'], ['10', 'open seats'], ['2', 'no staff', true]]} />
        <NavyChips options={['All', 'Mine', 'Has room', 'No staff']} value={f} onChange={setF} />
      </Header>
      <section className="mx-4 mt-5 rounded-2xl p-4" style={{ background: '#fff7e6', boxShadow: `inset 0 0 0 1px ${C.gold}` }}>
        <h2 className="text-[17px] font-bold">Waiting for a study <span className="font-normal" style={{ color: C.muted }}>3</span></h2>
        <p className="text-sm mt-1" style={{ color: C.muted }}>Sam Ortiz, Ellie Park, Rosa M.</p>
        <div className="flex justify-end mt-3">
          <button className="px-4 min-h-11 rounded-lg text-sm font-bold" style={{ background: C.gold, color: C.navy }}>Place them</button>
        </div>
      </section>
      {days.map((d) => (
        <Section key={d} title={d}>
          {list.filter((s) => s.day === d).map((s, i) => (
            <Row key={i} first={!i} bar={C.study} onClick={open}
              title={`${s.time} · ${s.group}`}
              sub={`${s.where}${s.leader ? ` · led by ${s.leader}` : ''}`}
              right={<><Seats n={s.n} /><span className="block mt-1" style={{ color: s.staff ? C.muted : C.late }}>{s.staff ?? 'No staff'}</span></>} />
          ))}
        </Section>
      ))}
      <button className="fixed z-[61] right-4 px-5 min-h-12 rounded-full font-bold shadow-lg" style={{ background: C.gold, color: C.navy, bottom: 'calc(84px + env(safe-area-inset-bottom))' }}>+ New study</button>
    </>
  );
}

/* ---------- Study (a detail screen) ---------- */
function Study({ back }: { back: () => void }) {
  return (
    <>
      <header className="px-5 pt-3 pb-5" style={{ background: C.navy, color: '#fff' }}>
        <button onClick={back} className="min-h-11 -ml-1 font-semibold" style={{ color: C.onNavyMuted }}>‹ Studies</button>
        <p className="text-sm flex items-center gap-2" style={{ color: C.onNavyMuted }}><span className="w-2 h-2 rounded-full" style={{ background: '#7fd1b4' }} />Bible study · Co-ed</p>
        <h1 className="text-[28px] font-bold leading-tight">Tuesday 12:30 PM</h1>
        <p style={{ color: C.onNavyMuted }}>IMU food court</p>
        <div className="grid grid-cols-3 gap-2 mt-4 text-sm">
          {[['Students', '2 of 5'], ['Leader', 'None yet'], ['Staff', 'Nobody']].map(([k, v], i) => (
            <div key={k} className="rounded-xl px-3 py-2" style={{ background: C.navy2 }}>
              <p style={{ color: C.onNavyMuted }}>{k}</p>
              <p className="font-bold" style={{ color: i === 2 ? '#ffb3a7' : '#fff' }}>{v}</p>
            </div>
          ))}
        </div>
      </header>
      <Section title="Students" count="2">
        {ROSTER.map(([n, s], i) => <Row key={n} first={!i} title={n} sub={s} right="Text" rightColor={C.navy} />)}
      </Section>
      <Section title="To do" count="1">
        <Row first title="Find a staff person for this study" sub="Nobody's · due Mon" right="Take it" rightColor={C.navy} />
      </Section>
      <section className="px-4 mt-6">
        <button className="w-full rounded-2xl px-4 min-h-14 flex items-center justify-between font-semibold" style={{ background: C.card }}>
          Edit study <span style={{ color: C.muted }}>Day, time, place, staff ›</span>
        </button>
      </section>
      <div className="fixed bottom-0 inset-x-0 z-[61]" style={{ background: C.card, borderTop: `1px solid ${C.line}`, paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="max-w-xl mx-auto px-4 py-3 flex justify-end gap-2">
          <button className="px-4 min-h-11 rounded-lg font-semibold" style={{ boxShadow: `inset 0 0 0 1px ${C.line}` }}>Text group</button>
          <button className="px-4 min-h-11 rounded-lg font-semibold" style={{ boxShadow: `inset 0 0 0 1px ${C.line}` }}>Attendance</button>
          <button className="px-5 min-h-11 rounded-lg font-bold" style={{ background: C.gold, color: C.navy }}>+ Add student</button>
        </div>
      </div>
    </>
  );
}

function Tabs({ screen, go }: { screen: Screen; go: (s: Screen) => void }) {
  const tabs: [string, Screen | null][] = [['Today', 'today'], ['Calendar', null], ['Studies', 'studies'], ['Students', null], ['More', null]];
  return (
    <nav className="fixed bottom-0 inset-x-0 z-[61] grid grid-cols-5" style={{ background: C.navy, paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {tabs.map(([t, s]) => {
        const on = s === screen;
        return (
          <button key={t} onClick={() => s && go(s)} className="py-3 text-[13px] font-semibold flex flex-col items-center gap-1" style={{ color: on ? '#fff' : C.onNavyMuted, opacity: s ? 1 : 0.5 }}>
            <span className="block w-6 h-1 rounded-full" style={{ background: on ? C.gold : 'transparent' }} />{t}
          </button>
        );
      })}
    </nav>
  );
}
