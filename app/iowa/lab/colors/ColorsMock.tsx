'use client';

import { useState } from 'react';

// Lab 11/13: where navy goes on Today. The rule in all three: navy marks the ONE
// thing to look at (or frames the page), cream holds the lists, gold is only for
// "act on this" (the + and urgent dots). Never navy everywhere.
//  A. Navy top: the date, greeting and your numbers sit in a navy band; lists on cream.
//  B. Navy Do now: the to-do card itself is navy; everything else stays light.
//  C. Navy today strip: what's happening on campus is a navy timeline between the lists.

const NAVY = '#143348';
const NAVY2 = '#1d4561';
const CREAM = '#f8f6f2';
const LINE = '#e7e2d9';
const MUTED = '#7d766b';
const GOLD = '#E8B562';
const LATE = '#b42318';

const TASKS = [
  { t: 'Welcome texts to 3 new students', s: 'Sam, Ellie, Rosa', due: 'Today', urgent: true },
  { t: 'Confirm Fri 10:30 AM study', s: 'for Fri 10:30 AM study', due: 'Today', urgent: true },
  { t: 'Follow up with Zane', s: 'with Keilor', due: '3 days late', late: true },
  { t: 'Collect $200 deposits', s: 'for Baja trip meeting', due: 'Sun' },
  { t: 'Text the Connect list', s: 'Jordan’s', due: 'Today' },
];
const TODAY = [
  { time: '8:00 AM', title: 'Friday Fill Up', where: 'Online', kind: 'event' },
  { time: '10:30 AM', title: 'Bible study · Co-ed', where: 'Tippie · 1 of 5', kind: 'study' },
  { time: '4:15 PM', title: 'Bible study · Guys', where: 'Old Capitol Mall · full', kind: 'study' },
];
const SOON = [
  { t: 'Baja trip meeting', s: 'Sun 6:00 PM' },
  { t: 'Taco Night', s: 'Mon 7:00 PM' },
];

type Dir = 'A' | 'B' | 'C';

export default function ColorsMock() {
  const [dir, setDir] = useState<Dir>('A');
  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto" style={{ background: CREAM, color: NAVY }}>
      {/* Picker (lab only) */}
      <div className="sticky top-0 z-10 flex gap-2 justify-center py-2" style={{ background: '#fff', borderBottom: `1px solid ${LINE}` }}>
        {(['A', 'B', 'C'] as Dir[]).map((d) => (
          <button key={d} onClick={() => setDir(d)} className="px-4 min-h-10 rounded-full text-sm font-bold"
            style={dir === d ? { background: NAVY, color: '#fff' } : { border: `1px solid ${LINE}` }}>
            {d === 'A' ? 'A · Navy top' : d === 'B' ? 'B · Navy to-do' : 'C · Navy today'}
          </button>
        ))}
      </div>

      <div className="max-w-xl mx-auto pb-32">
        {dir === 'A' ? <DirA /> : dir === 'B' ? <DirB /> : <DirC />}
      </div>

      <TabBar />
    </div>
  );
}

/* ---------- A: navy header band ---------- */
function DirA() {
  return (
    <>
      <header className="px-5 pt-6 pb-16" style={{ background: NAVY, color: '#fff' }}>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.65)' }}>Friday, November 13</p>
        <h1 className="text-[30px] font-bold leading-tight mt-1">Hey Travis</h1>
        <div className="flex gap-2 mt-4">
          <Stat n="5" label="to do now" />
          <Stat n="1" label="late" warn />
          <Stat n="3" label="on campus today" />
        </div>
      </header>
      {/* The first card overlaps the band, so the page reads as one piece. */}
      <div className="px-4 -mt-10">
        <h2 className="sr-only">Do now</h2>
        <TaskCard />
      </div>
      <Light title="On campus today"><TodayList /></Light>
      <Light title="Coming up"><Soon /></Light>
    </>
  );
}
function Stat({ n, label, warn }: { n: string; label: string; warn?: boolean }) {
  return (
    <div className="flex-1 rounded-xl px-3 py-2" style={{ background: NAVY2 }}>
      <p className="text-2xl font-bold" style={{ color: warn ? '#ffb4a8' : '#fff' }}>{n}</p>
      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>{label}</p>
    </div>
  );
}

/* ---------- B: navy Do now card ---------- */
function DirB() {
  return (
    <>
      <header className="px-5 pt-6 pb-4">
        <p className="text-sm" style={{ color: MUTED }}>Friday, November 13</p>
        <h1 className="text-[30px] font-bold leading-tight mt-1">Hey Travis</h1>
      </header>
      <section className="mx-4 rounded-2xl overflow-hidden" style={{ background: NAVY, color: '#fff' }}>
        <div className="flex items-baseline justify-between px-4 pt-4 pb-2">
          <h2 className="text-lg font-bold">Do now</h2>
          <span className="text-sm" style={{ color: 'rgba(255,255,255,0.65)' }}>5 things</span>
        </div>
        <ul>
          {TASKS.map((t, i) => (
            <li key={i} className="px-4 py-3 flex items-start justify-between gap-3" style={{ borderTop: '1px solid rgba(255,255,255,0.12)' }}>
              <span className="min-w-0">
                <span className="block font-semibold">
                  {t.urgent && <span className="inline-block w-2 h-2 rounded-full mr-2 align-middle" style={{ background: GOLD }} />}
                  {t.t}
                </span>
                <span className="block text-sm" style={{ color: 'rgba(255,255,255,0.65)' }}>{t.s}</span>
              </span>
              <span className="text-sm font-semibold shrink-0" style={{ color: t.late ? '#ffb4a8' : 'rgba(255,255,255,0.75)' }}>{t.due}</span>
            </li>
          ))}
        </ul>
      </section>
      <Light title="On campus today"><TodayList /></Light>
      <Light title="Coming up"><Soon /></Light>
    </>
  );
}

/* ---------- C: navy today strip ---------- */
function DirC() {
  return (
    <>
      <header className="px-5 pt-6 pb-4">
        <p className="text-sm" style={{ color: MUTED }}>Friday, November 13</p>
        <h1 className="text-[30px] font-bold leading-tight mt-1">Hey Travis</h1>
        <p style={{ color: MUTED }}>5 things to do now.</p>
      </header>
      <div className="px-4"><h2 className="text-lg font-bold mb-2">Do now</h2><TaskCard /></div>
      <section className="mt-7 px-5 py-5" style={{ background: NAVY, color: '#fff' }}>
        <h2 className="text-lg font-bold mb-3">On campus today</h2>
        <ol className="relative pl-5" style={{ borderLeft: '2px solid rgba(255,255,255,0.18)' }}>
          {TODAY.map((e, i) => (
            <li key={i} className="relative pb-4 last:pb-0">
              <span className="absolute -left-[27px] top-1.5 w-3 h-3 rounded-full" style={{ background: e.kind === 'study' ? '#7fc4ad' : GOLD, border: `2px solid ${NAVY}` }} />
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.65)' }}>{e.time}</p>
              <p className="font-semibold">{e.title}</p>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.65)' }}>{e.where}</p>
            </li>
          ))}
        </ol>
      </section>
      <Light title="Coming up"><Soon /></Light>
    </>
  );
}

/* ---------- shared light pieces ---------- */
function Light({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="px-4 mt-7">
      <h2 className="text-lg font-bold mb-2">{title}</h2>
      {children}
    </section>
  );
}
function TaskCard() {
  return (
    <ul className="rounded-2xl bg-white overflow-hidden shadow-sm" style={{ border: `1px solid ${LINE}` }}>
      {TASKS.map((t, i) => (
        <li key={i} className="px-4 py-3 flex items-start justify-between gap-3" style={{ borderTop: i ? `1px solid ${LINE}` : 'none' }}>
          <span className="min-w-0">
            <span className="block font-semibold">
              {t.urgent && <span className="inline-block w-2 h-2 rounded-full mr-2 align-middle" style={{ background: LATE }} />}
              {t.t}
            </span>
            <span className="block text-sm" style={{ color: MUTED }}>{t.s}</span>
          </span>
          <span className="text-sm font-semibold shrink-0" style={{ color: t.late ? LATE : MUTED }}>{t.due}</span>
        </li>
      ))}
    </ul>
  );
}
function TodayList() {
  return (
    <ul className="rounded-2xl bg-white overflow-hidden" style={{ border: `1px solid ${LINE}` }}>
      {TODAY.map((e, i) => (
        <li key={i} className="px-4 py-3 flex gap-3" style={{ borderTop: i ? `1px solid ${LINE}` : 'none' }}>
          <span className="w-1 rounded-full shrink-0" style={{ background: e.kind === 'study' ? '#2f6f5e' : '#5b4bb3' }} />
          <span>
            <span className="block text-sm" style={{ color: MUTED }}>{e.time}</span>
            <span className="block font-semibold">{e.title}</span>
            <span className="block text-sm" style={{ color: MUTED }}>{e.where}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
function Soon() {
  return (
    <ul className="rounded-2xl bg-white overflow-hidden" style={{ border: `1px solid ${LINE}` }}>
      {SOON.map((e, i) => (
        <li key={i} className="px-4 py-3 flex justify-between" style={{ borderTop: i ? `1px solid ${LINE}` : 'none' }}>
          <span className="font-semibold">{e.t}</span><span className="text-sm" style={{ color: MUTED }}>{e.s}</span>
        </li>
      ))}
    </ul>
  );
}
function TabBar() {
  return (
    <>
      <span className="fixed right-4 w-14 h-14 rounded-full text-3xl flex items-center justify-center shadow-lg z-[61]" style={{ bottom: 'calc(84px + env(safe-area-inset-bottom))', background: GOLD }}>+</span>
      <nav className="fixed bottom-0 inset-x-0 z-[61] grid grid-cols-5" style={{ background: NAVY, paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {['Today', 'Calendar', 'Studies', 'Students', 'More'].map((t, i) => (
          <span key={t} className="py-3 text-[13px] font-semibold flex flex-col items-center gap-1" style={{ color: i ? 'rgba(255,255,255,0.6)' : '#fff' }}>
            <span className="block w-6 h-1 rounded-full" style={{ background: i ? 'transparent' : GOLD }} />{t}
          </span>
        ))}
      </nav>
    </>
  );
}
