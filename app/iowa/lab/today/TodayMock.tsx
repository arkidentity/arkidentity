'use client';

import { useMemo, useState } from 'react';

// Lab mock of the ARK Iowa admin home. Plan (11/13):
// - Concept: a pocket to-do list for campus staff, not a control panel.
// - One bold thing: "Do now" leads the screen; every task clears with one tap.
// - Bottom tab bar (Today, Calendar, Studies, People, More) replaces the clipped top tabs.
// - Interns see the same screen with only their own work; no team counts.
// - Red only for late dates. No priority pills; "High" shows as a small gold dot.

const C = {
  ink: '#1a2b3c', // navy: text, tab bar
  paper: '#f8f6f2', // page
  card: '#ffffff',
  line: '#e7e2d9',
  muted: '#7d766b',
  gold: '#E8B562', // the + button, high-priority dot
  late: '#b42318',
  study: '#2f6f5e',
  event: '#5b4bb3',
};

type Task = { id: string; title: string; who: string; due: number; high?: boolean; forWhat?: string; owner: 'me' | 'keilor' | 'none' };
// due = days from today (negative = late)
const TASKS: Task[] = [
  { id: 't1', title: 'Welcome texts to 3 new students', who: 'Sam, Ellie, Rosa', due: -1, high: true, owner: 'me' },
  { id: 't2', title: 'Confirm Fri 10:30 AM study', who: 'Tippie · 1 of 5 signed up', due: -1, high: true, owner: 'me' },
  { id: 't3', title: 'Follow up with Zane', who: 'with Keilor', due: -17, high: true, owner: 'me' },
  { id: 't4', title: 'Help 24 students find a Bible study', who: 'Dean, Kara, Eli +21', due: -33, owner: 'me' },
  { id: 't5', title: 'Reconnect with 4 students', who: 'Ava, Kai, Drew, Gus', due: -47, owner: 'me' },
  { id: 't6', title: 'Text the Connect list', who: 'for Mason + Travis Connect', due: 0, owner: 'me' },
  { id: 't7', title: 'Collect $200 deposits; support letter workshop', who: 'for Baja 2027 · with Keilor', due: 2, high: true, owner: 'me' },
  { id: 't8', title: 'Passport push: text everyone without one', who: 'for Baja 2027', due: 6, owner: 'me' },
  { id: 't9', title: 'Follow up with Brody', who: 'Keilor', due: -3, high: true, owner: 'keilor' },
  { id: 't10', title: 'Order pizza for Taco Night', who: 'for Taco Night', due: 4, owner: 'none' },
  { id: 't11', title: 'Print signup cards', who: 'for the org fair', due: 3, owner: 'none' },
];

type Item = { time: string; title: string; where: string; kind: 'study' | 'event'; note?: string };
const TODAY_ITEMS: Item[] = [
  { time: '8:00', title: 'Friday Fill Up', where: 'Online', kind: 'event' },
  { time: '10:30', title: 'Bible study', where: 'Tippie', kind: 'study', note: '1 of 5 · you lead' },
  { time: '4:15', title: 'Bible study', where: 'Old Capitol Mall', kind: 'study', note: '5 of 5 · no leader yet' },
];
const WEEK: { day: string; items: Item[] }[] = [
  { day: 'Today · Fri 13', items: TODAY_ITEMS },
  { day: 'Sat 14', items: [] },
  { day: 'Sun 15', items: [{ time: '6:00', title: 'Baja trip meeting', where: 'The Space', kind: 'event' }] },
  { day: 'Mon 16', items: [{ time: '7:00', title: 'Taco Night', where: 'The Space', kind: 'event' }] },
  {
    day: 'Tue 17',
    items: [
      { time: '8:00', title: 'Morning prayer', where: 'Online', kind: 'event' },
      { time: '1:00', title: 'Evangelism', where: 'Old Brick', kind: 'event' },
      { time: '2:00', title: 'Bible study', where: 'Old Brick', kind: 'study', note: '3 of 5 · no leader yet' },
      { time: '3:00', title: 'Bible study', where: 'Old Brick', kind: 'study', note: '3 of 5 · you lead' },
      { time: '4:30', title: 'Bible study', where: 'Old Brick', kind: 'study', note: '5 of 5 · Keilor' },
    ],
  },
];

const dueText = (d: number) =>
  d < -1 ? `${-d} days late` : d === -1 ? 'Yesterday' : d === 0 ? 'Today' : d === 1 ? 'Tomorrow' : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][(5 + d) % 7];

type Tab = 'today' | 'calendar' | 'studies' | 'people' | 'more';

export default function TodayMock() {
  const [intern, setIntern] = useState(false);
  const [tab, setTab] = useState<Tab>('today');
  const [gone, setGone] = useState<Record<string, string>>({}); // id -> what happened
  const [pushed, setPushed] = useState<Record<string, number>>({});
  const [taken, setTaken] = useState<string[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [showLater, setShowLater] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const due = (t: Task) => t.due + (pushed[t.id] ?? 0);
  const mine = useMemo(
    () =>
      TASKS.filter((t) => (t.owner === 'me' || taken.includes(t.id)) && !gone[t.id])
        .filter((t) => !intern || ['t1', 't6', 't8'].includes(t.id))
        // High first, then the freshest: a 47-day-old task shouldn't bury yesterday's urgent one.
        .sort((a, b) => Number(!!b.high) - Number(!!a.high) || Math.abs(due(a)) - Math.abs(due(b))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [gone, pushed, taken, intern]
  );
  const now = mine.filter((t) => due(t) <= 0);
  const later = mine.filter((t) => due(t) > 0);
  const unowned = TASKS.filter((t) => t.owner === 'none' && !taken.includes(t.id) && !gone[t.id]);
  const todayItems = intern ? TODAY_ITEMS.filter((i) => i.note?.includes('you lead')) : TODAY_ITEMS;

  const flash = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 1800);
  };
  const act = (t: Task, what: 'done' | 'push' | 'drop') => {
    setOpenId(null);
    if (what === 'push') {
      setPushed((p) => ({ ...p, [t.id]: (p[t.id] ?? 0) + 7 - Math.min(due(t), 0) }));
      flash('Moved to next week');
    } else {
      setGone((g) => ({ ...g, [t.id]: what }));
      flash(what === 'done' ? 'Done. Nice.' : 'Dropped');
    }
  };

  return (
    <div style={{ background: C.paper, color: C.ink, minHeight: '100dvh' }} className="pb-28">
      {/* Lab bar: not part of the design */}
      <div className="text-xs flex items-center justify-between gap-2 px-4 py-2" style={{ background: '#fff4d6', color: '#6b5310' }}>
        <span>Lab mock · sample data · nothing saves</span>
        <button className="font-semibold underline" onClick={() => setIntern((v) => !v)}>
          View as {intern ? 'Travis' : 'an intern'}
        </button>
      </div>

      <main className="max-w-xl mx-auto px-4">
        {tab === 'today' && (
          <>
            <header className="pt-7 pb-5">
              <p className="text-sm" style={{ color: C.muted }}>Friday, November 13</p>
              <h1 className="text-[32px] leading-tight font-bold mt-1">Hey {intern ? 'Jordan' : 'Travis'}</h1>
              <p className="text-base mt-1" style={{ color: C.muted }}>
                {now.length === 0 ? 'Nothing waiting on you. ' : `${now.length} thing${now.length === 1 ? '' : 's'} to do now. `}
                {todayItems.length} on campus today.
              </p>
            </header>

            <h2 className="text-lg font-bold mb-2">Do now</h2>
            {now.length === 0 ? (
              <p className="rounded-xl px-4 py-5 text-center mb-6" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.muted }}>
                All clear. Go love on some students.
              </p>
            ) : (
              <ul className="rounded-xl overflow-hidden mb-6" style={{ background: C.card, border: `1px solid ${C.line}` }}>
                {now.map((t, i) => (
                  <TaskRow key={t.id} t={t} due={due(t)} first={i === 0} open={openId === t.id} onOpen={() => setOpenId(openId === t.id ? null : t.id)} onAct={(w) => act(t, w)} />
                ))}
              </ul>
            )}

            <h2 className="text-lg font-bold mb-2">On campus today</h2>
            <ul className="mb-6">
              {todayItems.map((it) => (
                <DayItem key={it.time + it.where} it={it} />
              ))}
            </ul>

            {later.length > 0 && (
              <>
                <button className="w-full flex items-center justify-between py-3 text-left" onClick={() => setShowLater((v) => !v)}>
                  <span className="text-lg font-bold">Coming up</span>
                  <span className="text-sm font-semibold" style={{ color: C.muted }}>
                    {showLater ? 'Hide' : `${later.length} this week`}
                  </span>
                </button>
                {showLater && (
                  <ul className="rounded-xl overflow-hidden mb-6" style={{ background: C.card, border: `1px solid ${C.line}` }}>
                    {later.map((t, i) => (
                      <TaskRow key={t.id} t={t} due={due(t)} first={i === 0} open={openId === t.id} onOpen={() => setOpenId(openId === t.id ? null : t.id)} onAct={(w) => act(t, w)} />
                    ))}
                  </ul>
                )}
              </>
            )}

            {!intern && unowned.length > 0 && (
              <section className="mt-4 rounded-xl p-4" style={{ background: '#fff', border: `1px dashed ${C.line}` }}>
                <h2 className="font-bold">Nobody has these yet</h2>
                <ul className="mt-2">
                  {unowned.map((t) => (
                    <li key={t.id} className="flex items-center justify-between gap-3 py-2">
                      <span>
                        <span className="block font-semibold">{t.title}</span>
                        <span className="text-sm" style={{ color: C.muted }}>{dueText(t.due)}</span>
                      </span>
                      <button
                        className="shrink-0 px-4 py-2 rounded-lg text-sm font-semibold"
                        style={{ border: `1px solid ${C.ink}` }}
                        onClick={() => {
                          setTaken((x) => [...x, t.id]);
                          flash('It’s yours');
                        }}
                      >
                        Take it
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}

        {tab === 'calendar' && (
          <>
            <header className="pt-7 pb-4 flex items-end justify-between gap-3">
              <div>
                <p className="text-sm" style={{ color: C.muted }}>Next 5 days</p>
                <h1 className="text-[28px] font-bold">Calendar</h1>
              </div>
              <div className="flex gap-2">
                <button className="w-11 h-11 rounded-lg text-lg" style={{ border: `1px solid ${C.line}`, background: C.card }} aria-label="Earlier">‹</button>
                <button className="w-11 h-11 rounded-lg text-lg" style={{ border: `1px solid ${C.line}`, background: C.card }} aria-label="Later">›</button>
              </div>
            </header>
            {WEEK.map((d) => (
              <section key={d.day} className="mb-5">
                <h2 className="text-sm font-bold mb-1" style={{ color: d.day.startsWith('Today') ? C.ink : C.muted }}>{d.day}</h2>
                {d.items.length === 0 ? (
                  <p className="text-sm py-2" style={{ color: C.muted }}>Nothing planned</p>
                ) : (
                  <ul>{d.items.map((it) => <DayItem key={it.time + it.title + it.where} it={it} />)}</ul>
                )}
              </section>
            ))}
            <p className="text-xs pb-4" style={{ color: C.muted }}>Month view, Google sync and filters live under More → Calendar settings.</p>
          </>
        )}

        {(tab === 'studies' || tab === 'people' || tab === 'more') && (
          <div className="pt-10">
            <h1 className="text-[28px] font-bold capitalize">{tab}</h1>
            <p className="mt-3" style={{ color: C.muted }}>
              {tab === 'studies' && 'Next mock: every study as one row (time, place, how full, who leads), with “Who’s waiting” on top.'}
              {tab === 'people' && 'Next mock: students and staff in one place. “Who’s carrying what” moves here.'}
              {tab === 'more' && 'Events, Settings, your account, and Sign out.'}
            </p>
          </div>
        )}
      </main>

      {/* One + for everything */}
      <button
        aria-label="New"
        onClick={() => setSheet(true)}
        className="fixed right-4 w-14 h-14 rounded-full text-3xl font-light shadow-lg"
        style={{ bottom: 'calc(84px + env(safe-area-inset-bottom))', background: C.gold, color: C.ink }}
      >
        +
      </button>

      {sheet && (
        <div className="fixed inset-0 z-20 flex items-end" style={{ background: 'rgba(15,26,37,0.45)' }} onClick={() => setSheet(false)}>
          <div className="w-full rounded-t-2xl p-5 pb-8" style={{ background: C.card }} onClick={(e) => e.stopPropagation()}>
            <p className="font-bold text-lg mb-3">Add something</p>
            {['A task', 'An event', 'A student'].map((x) => (
              <button
                key={x}
                className="w-full text-left py-4 text-base font-semibold"
                style={{ borderTop: `1px solid ${C.line}` }}
                onClick={() => {
                  setSheet(false);
                  flash(`(Mock) ${x} form opens here`);
                }}
              >
                {x}
              </button>
            ))}
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg text-sm font-semibold text-white z-30" style={{ bottom: 'calc(150px + env(safe-area-inset-bottom))', background: C.ink }}>
          {toast}
        </div>
      )}

      <nav className="fixed bottom-0 inset-x-0 z-10" style={{ background: C.ink, paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="max-w-xl mx-auto grid grid-cols-5">
          {(['today', 'calendar', 'studies', 'people', 'more'] as Tab[])
            .filter((t) => !intern || t !== 'people')
            .map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="py-3 text-[13px] font-semibold capitalize flex flex-col items-center gap-1"
                style={{ color: tab === t ? '#fff' : 'rgba(255,255,255,0.55)' }}
              >
                <span className="block w-6 h-1 rounded-full" style={{ background: tab === t ? C.gold : 'transparent' }} />
                {t}
              </button>
            ))}
        </div>
      </nav>
    </div>
  );
}

function TaskRow({ t, due, first, open, onOpen, onAct }: { t: Task; due: number; first: boolean; open: boolean; onOpen: () => void; onAct: (w: 'done' | 'push' | 'drop') => void }) {
  const late = due < 0;
  return (
    <li style={{ borderTop: first ? 'none' : `1px solid ${C.line}` }}>
      <button className="w-full text-left px-4 py-3 flex items-start justify-between gap-3" onClick={onOpen} aria-expanded={open}>
        <span className="min-w-0">
          <span className="block font-semibold leading-snug">
            {t.high && <span className="inline-block w-2 h-2 rounded-full mr-2 align-middle" style={{ background: C.gold }} aria-label="High priority" />}
            {t.title}
          </span>
          <span className="block text-sm mt-0.5" style={{ color: C.muted }}>{t.who}</span>
        </span>
        <span className="text-sm font-semibold shrink-0 text-right" style={{ color: late ? C.late : C.muted }}>{dueText(due)}</span>
      </button>
      {open && (
        <div className="px-4 pb-3 flex justify-end gap-2">
          <button className="px-4 py-2.5 rounded-lg text-sm font-semibold" style={{ color: C.muted }} onClick={() => onAct('drop')}>Drop</button>
          <button className="px-4 py-2.5 rounded-lg text-sm font-semibold" style={{ border: `1px solid ${C.line}` }} onClick={() => onAct('push')}>Next week</button>
          <button className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ background: C.ink }} onClick={() => onAct('done')}>Done</button>
        </div>
      )}
    </li>
  );
}

function DayItem({ it }: { it: Item }) {
  const color = it.kind === 'study' ? C.study : C.event;
  const needs = it.note?.includes('no leader');
  return (
    <li className="flex gap-3 py-2.5" style={{ borderBottom: `1px solid ${C.line}` }}>
      <span className="w-12 shrink-0 text-sm font-semibold tabular-nums pt-0.5">{it.time}</span>
      <span className="w-1 rounded-full shrink-0" style={{ background: color }} />
      <span className="min-w-0">
        <span className="block font-semibold">{it.title}</span>
        <span className="block text-sm" style={{ color: C.muted }}>
          {it.where}
          {it.note && (
            <>
              {', '}
              <span style={needs ? { color: C.late, fontWeight: 600 } : undefined}>{it.note}</span>
            </>
          )}
        </span>
      </span>
    </li>
  );
}
