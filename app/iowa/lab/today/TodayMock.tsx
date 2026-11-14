'use client';

import { useState } from 'react';

// Lab mock of the ARK Iowa admin (11/13). Plan:
// - Concept: a pocket to-do list for campus staff, not a control panel.
// - One bold thing: "Do now" leads; every task clears with one tap.
// - Every task, event and study opens the same way: a full screen with what you need to
//   know on top, the one or two things you'd do next in a bar at the bottom (right side),
//   and Edit in the corner. Edit shows the everyday fields; the rare ones sit under
//   "More options" (same fields as today's admin, nothing removed).
// - Bottom tabs replace the clipped top tabs. Interns get the same screens with only their work.
// Sample data only (made-up names). Nothing saves.

const C = {
  ink: '#1a2b3c',
  paper: '#f8f6f2',
  card: '#ffffff',
  line: '#e7e2d9',
  muted: '#7d766b',
  gold: '#E8B562',
  late: '#b42318',
  study: '#2f6f5e',
  event: '#5b4bb3',
  go: '#15803d',
};

const STAFF: Record<string, string> = { me: 'Travis', keilor: 'Keilor', morgan: 'Morgan', gabe: 'Gabe', jordan: 'Jordan' };
const DAYS = ['Fri 13', 'Sat 14', 'Sun 15', 'Mon 16', 'Tue 17', 'Wed 18', 'Thu 19'];
const WEEKDAY = ['Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu'];

type Note = { by: string; text: string };
type Link = { kind: 'event' | 'study'; id: string } | null;
type Task = {
  id: string; title: string; details: string; people: string; due: number; high: boolean;
  owner: string | null; helpers: string[]; link: Link; type: string; notes: Note[]; status: 'open' | 'done' | 'dropped';
};
type Ev = {
  id: string; title: string; day: number; start: string; end: string; where: string; link: string;
  weekly: boolean; type: string; going: string[]; notes: string; songs: string[]; dailyDna: boolean;
};
type Member = { name: string; year: string; phone: string; leader?: boolean };
type Study = {
  id: string; day: number; time: string; where: string; cap: number; group: string; online: boolean;
  onPoint: string | null; roster: Member[]; notes: string; came: Record<string, boolean>;
};

const T = (o: Partial<Task> & Pick<Task, 'id' | 'title' | 'due'>): Task => ({
  details: '', people: '', high: false, owner: 'me', helpers: [], link: null, type: 'Follow-up', notes: [], status: 'open', ...o,
});
const TASKS0: Task[] = [
  T({ id: 't1', title: 'Welcome texts to 3 new students', people: 'Sam, Ellie, Rosa', due: -1, high: true, type: 'Welcome', details: 'They signed up Wednesday night. Say hi, give them the study time and where to park.' }),
  T({ id: 't2', title: 'Confirm Fri 10:30 AM study', due: -1, high: true, type: 'Bible study', link: { kind: 'study', id: 's1' } }),
  T({ id: 't3', title: 'Follow up with Zane', due: -17, high: true, helpers: ['keilor'], notes: [{ by: 'keilor', text: 'Saw him at Taco Night, he wants to try a Tuesday.' }] }),
  T({ id: 't4', title: 'Help 24 students find a Bible study', people: 'Dean, Kara, Eli +21', due: -33, type: 'Placement' }),
  T({ id: 't5', title: 'Reconnect with 4 students', people: 'Ava, Kai, Drew, Gus', due: -47, type: 'Reconnect' }),
  T({ id: 't6', title: 'Text the Connect list', due: 0, owner: 'jordan', type: 'Event prep', link: { kind: 'event', id: 'e4' } }),
  T({ id: 't7', title: 'Collect $200 deposits; support letter workshop', due: 2, high: true, helpers: ['keilor'], type: 'Event prep', link: { kind: 'event', id: 'e2' } }),
  T({ id: 't8', title: 'Passport push: text everyone without one', due: 6, type: 'Event prep', link: { kind: 'event', id: 'e2' }, owner: 'jordan' }),
  T({ id: 't9', title: 'Follow up with Brody', due: -3, high: true, owner: 'keilor' }),
  T({ id: 't10', title: 'Buy taco supplies', due: 2, owner: null, type: 'Event prep', link: { kind: 'event', id: 'e3' } }),
  T({ id: 't11', title: 'Set up chairs and music', due: 3, owner: null, type: 'Event prep', link: { kind: 'event', id: 'e3' } }),
];
const EV = (o: Partial<Ev> & Pick<Ev, 'id' | 'title' | 'day' | 'start'>): Ev => ({
  end: '', where: 'The Space at Old Brick', link: '', weekly: false, type: 'Gathering', going: [], notes: '', songs: [], dailyDna: false, ...o,
});
const EVENTS0: Ev[] = [
  EV({ id: 'e1', title: 'Friday Fill Up', day: 0, start: '8:00 AM', end: '8:30 AM', where: 'Online', link: 'https://meet.google.com/', weekly: true, type: 'Teaching', going: ['me'], dailyDna: true }),
  EV({ id: 'e2', title: 'Baja trip meeting', day: 2, start: '6:00 PM', end: '7:00 PM', type: 'Mission trip', going: ['me', 'keilor'], notes: 'Bring the deposit sheet and support letter samples.' }),
  EV({ id: 'e3', title: 'Taco Night', day: 3, start: '7:00 PM', end: '9:00 PM', weekly: true, type: 'Outreach', going: ['me', 'jordan'], songs: ['Goodness of God', 'Great Are You Lord'] }),
  EV({ id: 'e4', title: 'Mason + Travis Connect', day: 4, start: '1:00 PM', where: 'Old Brick lobby', weekly: true, type: 'Outreach', going: ['jordan'] }),
  EV({ id: 'e5', title: 'Morning prayer', day: 4, start: '8:00 AM', where: 'Online', link: 'https://meet.google.com/', weekly: true, type: 'Prayer' }),
];
const M = (name: string, year: string, leader = false): Member => ({ name, year, phone: '319-555-01' + (name.length + 10), leader });
const STUDIES0: Study[] = [
  { id: 's1', day: 0, time: '10:30 AM', where: 'Tippie', cap: 5, group: 'Co-ed', online: false, onPoint: 'me', roster: [M('Nate Ruiz', 'Sophomore')], notes: '', came: {} },
  { id: 's2', day: 0, time: '4:15 PM', where: 'Old Capitol Mall', cap: 5, group: 'Guys', online: false, onPoint: null, roster: [M('Owen P.', 'Junior', true), M('Luke B.', 'Freshman'), M('Ty M.', 'Freshman'), M('Abe K.', 'Senior'), M('Cole J.', 'Sophomore')], notes: 'Food court, by the window tables.', came: {} },
  { id: 's3', day: 4, time: '2:00 PM', where: 'The Space at Old Brick', cap: 5, group: 'Girls', online: false, onPoint: null, roster: [M('Mia L.', 'Freshman'), M('Ivy D.', 'Junior'), M('Zoe R.', 'Freshman')], notes: '', came: {} },
  { id: 's4', day: 4, time: '3:00 PM', where: 'The Space at Old Brick', cap: 5, group: 'Co-ed', online: false, onPoint: 'jordan', roster: [M('Ben S.', 'Senior', true), M('Lily T.', 'Sophomore'), M('Max W.', 'Freshman')], notes: '', came: {} },
  { id: 's5', day: 4, time: '4:30 PM', where: 'The Space at Old Brick', cap: 5, group: 'Guys', online: false, onPoint: 'keilor', roster: [M('Jon A.', 'Junior', true), M('Sam V.', 'Freshman'), M('Eli G.', 'Senior'), M('Ray C.', 'Sophomore'), M('Tom H.', 'Freshman')], notes: '', came: {} },
];

const dueText = (d: number) =>
  d < -1 ? `${-d} days late` : d === -1 ? 'Yesterday' : d === 0 ? 'Today' : d === 1 ? 'Tomorrow' : WEEKDAY[((d % 7) + 7) % 7];

type Tab = 'today' | 'calendar' | 'studies' | 'people' | 'more';
type Open =
  | { kind: 'task'; id: string; edit?: boolean }
  | { kind: 'event'; id: string; edit?: boolean }
  | { kind: 'study'; id: string; edit?: boolean }
  | { kind: 'newTask'; link?: Link }
  | { kind: 'newEvent' };

export default function TodayMock() {
  const [intern, setIntern] = useState(false);
  const me = intern ? 'jordan' : 'me';
  const [tab, setTab] = useState<Tab>('today');
  const [tasks, setTasks] = useState(TASKS0);
  const [events, setEvents] = useState(EVENTS0);
  const [studies, setStudies] = useState(STUDIES0);
  const [stack, setStack] = useState<Open[]>([]); // screens opened on top of the tab
  const [rowOpen, setRowOpen] = useState<string | null>(null);
  const [showLater, setShowLater] = useState(false);
  const [plus, setPlus] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [mineOnly, setMineOnly] = useState(true);

  const flash = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 1800);
  };
  const push = (o: Open) => setStack((s) => [...s, o]);
  const pop = () => setStack((s) => s.slice(0, -1));
  const patchTask = (id: string, p: Partial<Task>) => setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, ...p } : t)));
  const act = (t: Task, what: 'done' | 'push' | 'drop', note?: string) => {
    setRowOpen(null);
    if (what === 'push') {
      patchTask(t.id, { due: Math.max(t.due, 0) + 7 });
      flash('Moved to next week');
    } else {
      patchTask(t.id, { status: what === 'done' ? 'done' : 'dropped', notes: note ? [...t.notes, { by: me, text: note }] : t.notes });
      flash(what === 'done' ? 'Done. Nice.' : 'Dropped');
    }
  };

  const open = tasks.filter((t) => t.status === 'open');
  const mine = open
    .filter((t) => t.owner === me || t.helpers.includes(me))
    .sort((a, b) => Number(b.high) - Number(a.high) || Math.abs(a.due) - Math.abs(b.due));
  const now = mine.filter((t) => t.due <= 0);
  const later = mine.filter((t) => t.due > 0);
  const unowned = open.filter((t) => !t.owner);
  const myStudy = (s: Study) => !intern || s.onPoint === me;
  const myEvent = (e: Ev) => !intern || e.going.includes(me);
  const dayItems = (d: number, all: boolean) =>
    [
      ...events.filter((e) => e.day === d && (all || myEvent(e))).map((e) => ({ kind: 'event' as const, id: e.id, time: e.start, title: e.title, sub: e.where, warn: '' })),
      ...studies
        .filter((s) => s.day === d && (all || myStudy(s)))
        .map((s) => ({
          kind: 'study' as const, id: s.id, time: s.time, title: `Bible study · ${s.group}`,
          sub: `${s.where}, ${s.roster.length} of ${s.cap}`, warn: s.onPoint ? `${s.onPoint === me ? 'you' : STAFF[s.onPoint]}` : 'no staff yet',
        })),
    ].sort((a, b) => toMin(a.time) - toMin(b.time));

  const top = stack[stack.length - 1];
  const ctx = { tasks, events, studies, me, intern, push, pop, flash, act, patchTask, setTasks, setEvents, setStudies };

  return (
    <div style={{ background: C.paper, color: C.ink, minHeight: '100dvh' }} className="pb-28">
      <div className="text-xs flex items-center justify-between gap-2 px-4 py-2" style={{ background: '#fff4d6', color: '#6b5310' }}>
        <span>Lab mock · sample data · nothing saves</span>
        <button className="font-semibold underline" onClick={() => { setIntern((v) => !v); setStack([]); }}>
          View as {intern ? 'Travis' : 'an intern'}
        </button>
      </div>

      <main className="max-w-xl mx-auto px-4">
        {tab === 'today' && (
          <>
            <header className="pt-7 pb-5">
              <p className="text-sm" style={{ color: C.muted }}>Friday, November 13</p>
              <h1 className="text-[32px] leading-tight font-bold mt-1">Hey {STAFF[me]}</h1>
              <p className="text-base mt-1" style={{ color: C.muted }}>
                {now.length === 0 ? 'Nothing waiting on you. ' : `${now.length} thing${now.length === 1 ? '' : 's'} to do now. `}
                {dayItems(0, false).length} on campus today.
              </p>
            </header>

            <h2 className="text-lg font-bold mb-2">Do now</h2>
            {now.length === 0 ? (
              <Empty>All clear. Go love on some students.</Empty>
            ) : (
              <TaskCard tasks={now} rowOpen={rowOpen} setRowOpen={setRowOpen} ctx={ctx} />
            )}

            <h2 className="text-lg font-bold mb-1 mt-6">On campus today</h2>
            <DayList items={dayItems(0, false)} onOpen={push} empty="Nothing on your calendar today." />

            {later.length > 0 && (
              <>
                <button className="w-full flex items-center justify-between py-3 mt-4 text-left" onClick={() => setShowLater((v) => !v)}>
                  <span className="text-lg font-bold">Coming up</span>
                  <span className="text-sm font-semibold" style={{ color: C.muted }}>{showLater ? 'Hide' : `${later.length} this week`}</span>
                </button>
                {showLater && <TaskCard tasks={later} rowOpen={rowOpen} setRowOpen={setRowOpen} ctx={ctx} />}
              </>
            )}

            {!intern && unowned.length > 0 && (
              <section className="mt-6 rounded-xl p-4" style={{ background: C.card, border: `1px dashed #cfc7b8` }}>
                <h2 className="font-bold">Nobody has these yet</h2>
                <ul className="mt-1">
                  {unowned.map((t) => (
                    <li key={t.id} className="flex items-center justify-between gap-3 py-2">
                      <button className="text-left min-w-0" onClick={() => push({ kind: 'task', id: t.id })}>
                        <span className="block font-semibold">{t.title}</span>
                        <span className="text-sm" style={{ color: C.muted }}>{dueText(t.due)}{linkLabel(t.link, ctx) ? `, for ${linkLabel(t.link, ctx)}` : ''}</span>
                      </button>
                      <Btn onClick={() => { patchTask(t.id, { owner: me }); flash('It’s yours'); }}>Take it</Btn>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}

        {tab === 'calendar' && (
          <>
            <header className="pt-7 pb-3 flex items-end justify-between gap-3">
              <div>
                <p className="text-sm" style={{ color: C.muted }}>Next 7 days</p>
                <h1 className="text-[28px] font-bold">Calendar</h1>
              </div>
              {!intern && (
                <div className="flex rounded-lg overflow-hidden text-sm font-semibold" style={{ border: `1px solid ${C.line}` }}>
                  {[true, false].map((v) => (
                    <button key={String(v)} className="px-3 py-2" style={mineOnly === v ? { background: C.ink, color: '#fff' } : { background: C.card }} onClick={() => setMineOnly(v)}>
                      {v ? 'Mine' : 'Everyone'}
                    </button>
                  ))}
                </div>
              )}
            </header>
            {DAYS.map((d, i) => {
              const items = dayItems(i, true).filter((x) => myOrAll(x, intern || mineOnly, studies, events, me));
              const due = mine.filter((t) => t.due === i).length;
              return (
                <section key={d} className="mb-4">
                  <h2 className="text-sm font-bold flex justify-between" style={{ color: i === 0 ? C.ink : C.muted }}>
                    <span>{i === 0 ? `Today · ${d}` : d}</span>
                    {due > 0 && <span>{due} task{due === 1 ? '' : 's'} due</span>}
                  </h2>
                  <DayList items={items} onOpen={push} empty="Nothing planned" />
                </section>
              );
            })}
          </>
        )}

        {tab === 'studies' && (
          <>
            <header className="pt-7 pb-3">
              <p className="text-sm" style={{ color: C.muted }}>Fall 2026</p>
              <h1 className="text-[28px] font-bold">{intern ? 'Your study' : 'Studies'}</h1>
            </header>
            <ul className="rounded-xl overflow-hidden" style={{ background: C.card, border: `1px solid ${C.line}` }}>
              {studies.filter(myStudy).map((s, i) => (
                <li key={s.id} style={{ borderTop: i ? `1px solid ${C.line}` : 'none' }}>
                  <button className="w-full text-left px-4 py-3 flex justify-between gap-3" onClick={() => push({ kind: 'study', id: s.id })}>
                    <span>
                      <span className="block font-semibold">{WEEKDAY[s.day]} {s.time} · {s.group}</span>
                      <span className="text-sm" style={{ color: C.muted }}>{s.where}</span>
                    </span>
                    <span className="text-sm text-right shrink-0">
                      <span className="block font-semibold">{s.roster.length} of {s.cap}</span>
                      <span style={{ color: s.onPoint ? C.muted : C.late }}>{s.onPoint ? STAFF[s.onPoint] : 'No staff'}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}

        {(tab === 'people' || tab === 'more') && (
          <div className="pt-10">
            <h1 className="text-[28px] font-bold capitalize">{tab}</h1>
            <p className="mt-3" style={{ color: C.muted }}>
              {tab === 'people' ? 'Next mock: students and staff in one place, with “Who’s carrying what”.' : 'Events with sign-ups, Settings, your account, Sign out.'}
            </p>
          </div>
        )}
      </main>

      <button
        aria-label="Add something"
        onClick={() => setPlus(true)}
        className="fixed right-4 w-14 h-14 rounded-full text-3xl font-light shadow-lg z-10"
        style={{ bottom: 'calc(84px + env(safe-area-inset-bottom))', background: C.gold, color: C.ink }}
      >
        +
      </button>

      {plus && (
        <div className="fixed inset-0 z-[65] flex items-end" style={{ background: 'rgba(15,26,37,0.45)' }} onClick={() => setPlus(false)}>
          <div className="w-full rounded-t-2xl p-5 pb-8 max-w-xl mx-auto" style={{ background: C.card }} onClick={(e) => e.stopPropagation()}>
            <p className="font-bold text-lg mb-2">Add</p>
            {[
              ['A task', () => push({ kind: 'newTask' })],
              ...(intern ? [] : [['An event', () => push({ kind: 'newEvent' })]]),
            ].map(([label, fn]) => (
              <button key={label as string} className="w-full text-left py-4 text-base font-semibold" style={{ borderTop: `1px solid ${C.line}` }} onClick={() => { setPlus(false); (fn as () => void)(); }}>
                {label as string}
              </button>
            ))}
          </div>
        </div>
      )}

      {stack.map((o, i) => (
        <Screen key={i} hidden={o !== top}>
          {o.kind === 'task' && (o.edit ? <TaskEdit ctx={ctx} task={tasks.find((t) => t.id === o.id)!} /> : <TaskView ctx={ctx} id={o.id} />)}
          {o.kind === 'newTask' && <TaskEdit ctx={ctx} link={o.link} />}
          {o.kind === 'event' && (o.edit ? <EventEdit ctx={ctx} ev={events.find((e) => e.id === o.id)!} /> : <EventView ctx={ctx} id={o.id} />)}
          {o.kind === 'newEvent' && <EventEdit ctx={ctx} />}
          {o.kind === 'study' && (o.edit ? <StudyEdit ctx={ctx} s={studies.find((s) => s.id === o.id)!} /> : <StudyView ctx={ctx} id={o.id} />)}
        </Screen>
      ))}

      {toast && (
        <div className="fixed left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg text-sm font-semibold text-white z-[70]" style={{ bottom: 'calc(150px + env(safe-area-inset-bottom))', background: C.ink }}>
          {toast}
        </div>
      )}

      <nav className="fixed bottom-0 inset-x-0 z-10" style={{ background: C.ink, paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className={`max-w-xl mx-auto grid ${intern ? 'grid-cols-4' : 'grid-cols-5'}`}>
          {(['today', 'calendar', 'studies', 'people', 'more'] as Tab[])
            .filter((t) => !intern || t !== 'people')
            .map((t) => (
              <button key={t} onClick={() => { setTab(t); setStack([]); }} className="py-3 text-[13px] font-semibold capitalize flex flex-col items-center gap-1" style={{ color: tab === t ? '#fff' : 'rgba(255,255,255,0.55)' }}>
                <span className="block w-6 h-1 rounded-full" style={{ background: tab === t ? C.gold : 'transparent' }} />
                {t}
              </button>
            ))}
        </div>
      </nav>
    </div>
  );
}

type Ctx = {
  tasks: Task[]; events: Ev[]; studies: Study[]; me: string; intern: boolean;
  push: (o: Open) => void; pop: () => void; flash: (m: string) => void;
  act: (t: Task, w: 'done' | 'push' | 'drop', note?: string) => void;
  patchTask: (id: string, p: Partial<Task>) => void;
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  setEvents: React.Dispatch<React.SetStateAction<Ev[]>>;
  setStudies: React.Dispatch<React.SetStateAction<Study[]>>;
};

function myOrAll(x: { kind: 'event' | 'study'; id: string }, mineOnly: boolean, studies: Study[], events: Ev[], me: string) {
  if (!mineOnly) return true;
  return x.kind === 'study' ? studies.find((s) => s.id === x.id)?.onPoint === me : events.find((e) => e.id === x.id)?.going.includes(me);
}
function toMin(t: string) {
  const m = t.match(/(\d+):(\d+)\s*(AM|PM)/);
  if (!m) return 0;
  return ((+m[1] % 12) + (m[3] === 'PM' ? 12 : 0)) * 60 + +m[2];
}
function linkLabel(l: Link, ctx: Pick<Ctx, 'events' | 'studies'>) {
  if (!l) return '';
  if (l.kind === 'event') return ctx.events.find((e) => e.id === l.id)?.title ?? '';
  const s = ctx.studies.find((x) => x.id === l.id);
  return s ? `${WEEKDAY[s.day]} ${s.time} study` : '';
}

/* ---------- small pieces ---------- */

function Btn({ children, onClick, kind = 'line' }: { children: React.ReactNode; onClick: () => void; kind?: 'line' | 'solid' | 'go' | 'quiet' | 'danger' }) {
  const s =
    kind === 'solid' ? { background: C.ink, color: '#fff' }
    : kind === 'go' ? { background: C.go, color: '#fff' }
    : kind === 'quiet' ? { color: C.muted }
    : kind === 'danger' ? { color: C.late }
    : { border: `1px solid ${C.ink}` };
  return (
    <button className="shrink-0 px-4 min-h-11 rounded-lg text-sm font-semibold" style={s} onClick={onClick}>
      {children}
    </button>
  );
}
function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-xl px-4 py-5 text-center" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.muted }}>{children}</p>;
}

function TaskCard({ tasks, rowOpen, setRowOpen, ctx }: { tasks: Task[]; rowOpen: string | null; setRowOpen: (id: string | null) => void; ctx: Ctx }) {
  return (
    <ul className="rounded-xl overflow-hidden" style={{ background: C.card, border: `1px solid ${C.line}` }}>
      {tasks.map((t, i) => {
        const isOpen = rowOpen === t.id;
        const sub = [t.people, linkLabel(t.link, ctx) && `for ${linkLabel(t.link, ctx)}`, t.owner !== ctx.me && t.owner && `${STAFF[t.owner]}'s`, t.helpers.length > 0 && `with ${t.helpers.filter((h) => h !== ctx.me).map((h) => STAFF[h]).join(', ') || STAFF[t.owner ?? 'me']}`]
          .filter(Boolean)
          .join(' · ');
        return (
          <li key={t.id} style={{ borderTop: i ? `1px solid ${C.line}` : 'none' }}>
            <button className="w-full text-left px-4 py-3 flex items-start justify-between gap-3" onClick={() => setRowOpen(isOpen ? null : t.id)} aria-expanded={isOpen}>
              <span className="min-w-0">
                <span className="block font-semibold leading-snug">
                  {t.high && <span className="inline-block w-2 h-2 rounded-full mr-2 align-middle" style={{ background: C.gold }} aria-label="High priority" />}
                  {t.title}
                </span>
                {sub && <span className="block text-sm mt-0.5" style={{ color: C.muted }}>{sub}</span>}
              </span>
              <span className="text-sm font-semibold shrink-0 text-right" style={{ color: t.due < 0 ? C.late : C.muted }}>{dueText(t.due)}</span>
            </button>
            {isOpen && (
              <div className="px-4 pb-3 flex items-center justify-end gap-1 flex-wrap">
                <Btn kind="quiet" onClick={() => { setRowOpen(null); ctx.push({ kind: 'task', id: t.id }); }}>Open</Btn>
                <Btn onClick={() => ctx.act(t, 'push')}>Next week</Btn>
                <Btn kind="solid" onClick={() => ctx.act(t, 'done')}>Done</Btn>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

type DayItemT = { kind: 'event' | 'study'; id: string; time: string; title: string; sub: string; warn: string };
function DayList({ items, onOpen, empty }: { items: DayItemT[]; onOpen: (o: Open) => void; empty: string }) {
  if (!items.length) return <p className="text-sm py-2" style={{ color: C.muted }}>{empty}</p>;
  return (
    <ul>
      {items.map((it) => (
        <li key={it.id} style={{ borderBottom: `1px solid ${C.line}` }}>
          <button className="w-full text-left flex gap-3 py-2.5" onClick={() => onOpen({ kind: it.kind, id: it.id })}>
            <span className="w-16 shrink-0 text-sm font-semibold tabular-nums pt-0.5">{it.time.replace(':00', '')}</span>
            <span className="w-1 rounded-full shrink-0" style={{ background: it.kind === 'study' ? C.study : C.event }} />
            <span className="min-w-0">
              <span className="block font-semibold">{it.title}</span>
              <span className="block text-sm" style={{ color: C.muted }}>
                {it.sub}
                {it.warn && <>, <span style={it.warn === 'no staff yet' ? { color: C.late, fontWeight: 600 } : undefined}>{it.warn}</span></>}
              </span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

/* ---------- full screens ---------- */

function Screen({ children, hidden }: { children: React.ReactNode; hidden: boolean }) {
  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto" style={{ background: C.paper, display: hidden ? 'none' : 'block' }}>
      <div className="max-w-xl mx-auto min-h-full flex flex-col">{children}</div>
    </div>
  );
}
// Header: Back on the left, Edit (or nothing) on the right. Footer: the next actions, right-aligned.
function Top({ onBack, title, sub, right }: { onBack: () => void; title: string; sub?: React.ReactNode; right?: React.ReactNode }) {
  return (
    <>
      <div className="flex items-center justify-between px-2 pt-3">
        <button className="min-h-11 px-2 text-base font-semibold" onClick={onBack}>‹ Back</button>
        {right}
      </div>
      <div className="px-4 pt-2 pb-4">
        <h1 className="text-2xl font-bold leading-tight">{title}</h1>
        {sub && <p className="mt-1" style={{ color: C.muted }}>{sub}</p>}
      </div>
    </>
  );
}
function Bar({ children }: { children: React.ReactNode }) {
  return (
    <div className="sticky bottom-0 mt-auto px-4 py-3 flex items-center justify-end gap-2 flex-wrap" style={{ background: C.card, borderTop: `1px solid ${C.line}`, paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}>
      {children}
    </div>
  );
}
function Block({ title, children, right }: { title: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <section className="px-4 mb-5">
      <div className="flex items-center justify-between mb-1.5">
        <h2 className="font-bold">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  );
}
function Facts({ rows }: { rows: [string, React.ReactNode][] }) {
  return (
    <dl className="mx-4 mb-5 rounded-xl px-4 py-1" style={{ background: C.card, border: `1px solid ${C.line}` }}>
      {rows.map(([k, v], i) => (
        <div key={k} className="flex justify-between gap-4 py-2.5" style={{ borderTop: i ? `1px solid ${C.line}` : 'none' }}>
          <dt style={{ color: C.muted }}>{k}</dt>
          <dd className="font-semibold text-right">{v}</dd>
        </div>
      ))}
    </dl>
  );
}
const linkBtn = 'font-semibold underline underline-offset-2';

/* ---------- task ---------- */

function TaskView({ ctx, id }: { ctx: Ctx; id: string }) {
  const t = ctx.tasks.find((x) => x.id === id)!;
  const [finishing, setFinishing] = useState(false);
  const [note, setNote] = useState('');
  const [comment, setComment] = useState('');
  const mineToDo = t.owner === ctx.me;
  const helping = t.helpers.includes(ctx.me);
  const linked = t.link;
  return (
    <>
      <Top
        onBack={ctx.pop}
        title={t.title}
        sub={<span style={{ color: t.due < 0 && t.status === 'open' ? C.late : C.muted }}>{t.status === 'open' ? `Due ${dueText(t.due).toLowerCase()}` : t.status === 'done' ? 'Done' : 'Dropped'}{t.high ? ' · High' : ''}</span>}
        right={<button className="min-h-11 px-3 font-semibold" onClick={() => { ctx.pop(); ctx.push({ kind: 'task', id, edit: true }); }}>Edit</button>}
      />
      {t.details && <p className="px-4 mb-5 whitespace-pre-wrap">{t.details}</p>}
      <Facts
        rows={[
          ['Who has it', t.owner ? (t.owner === ctx.me ? 'You' : STAFF[t.owner]) : <span style={{ color: C.late }}>Nobody yet</span>],
          ...(t.helpers.length ? [['Also on it', t.helpers.map((h) => (h === ctx.me ? 'You' : STAFF[h])).join(', ')] as [string, React.ReactNode]] : []),
          ...(t.people ? [['Students', t.people] as [string, React.ReactNode]] : []),
          ...(linked
            ? [['For', <button key="l" className={linkBtn} onClick={() => ctx.push({ kind: linked.kind, id: linked.id })}>{linkLabel(linked, ctx)}</button>] as [string, React.ReactNode]]
            : []),
          ['Kind', t.type],
        ]}
      />
      {t.people && (
        <Block title="Reach them">
          <p className="text-sm" style={{ color: C.muted }}>Each student gets a row here with Call and Text, and a check when you’ve reached them.</p>
        </Block>
      )}
      <Block title="Notes">
        {t.notes.length === 0 && <p className="text-sm mb-2" style={{ color: C.muted }}>No notes yet.</p>}
        <ul className="mb-2">
          {t.notes.map((n, i) => (
            <li key={i} className="py-2" style={{ borderBottom: `1px solid ${C.line}` }}>
              <span className="text-sm font-semibold">{n.by === ctx.me ? 'You' : STAFF[n.by]}</span>
              <p>{n.text}</p>
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <input className="flex-1 min-h-11 px-3 rounded-lg" style={{ border: `1px solid ${C.line}`, background: C.card }} placeholder="What happened? Everyone on it gets emailed." value={comment} onChange={(e) => setComment(e.target.value)} />
          <Btn onClick={() => { if (comment.trim()) { ctx.patchTask(id, { notes: [...t.notes, { by: ctx.me, text: comment.trim() }] }); setComment(''); ctx.flash('Note added'); } }}>Add</Btn>
        </div>
      </Block>
      <Block title="Files">
        <button className={`${linkBtn} text-sm`} onClick={() => ctx.flash('(Mock) file picker opens')}>Attach a file</button>
      </Block>

      {finishing && (
        <div className="px-4 pb-4">
          <label className="block font-semibold mb-1">Anything to note? (optional)</label>
          <textarea className="w-full px-3 py-2 rounded-lg" rows={2} style={{ border: `1px solid ${C.line}`, background: C.card }} value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
      )}
      <Bar>
        {t.status !== 'open' ? (
          <Btn onClick={() => { ctx.patchTask(id, { status: 'open' }); ctx.flash('Reopened'); }}>Reopen</Btn>
        ) : finishing ? (
          <>
            <Btn kind="quiet" onClick={() => setFinishing(false)}>Cancel</Btn>
            <Btn kind="go" onClick={() => { ctx.act(t, 'done', note.trim() || undefined); ctx.pop(); }}>Mark done</Btn>
          </>
        ) : !t.owner ? (
          <>
            <Btn onClick={() => { ctx.patchTask(id, { helpers: helping ? t.helpers.filter((h) => h !== ctx.me) : [...t.helpers, ctx.me] }); }}>{helping ? 'Stop helping' : 'I can help'}</Btn>
            <Btn kind="solid" onClick={() => { ctx.patchTask(id, { owner: ctx.me }); ctx.flash('It’s yours'); }}>Take it</Btn>
          </>
        ) : (
          <>
            {!mineToDo && <Btn onClick={() => ctx.patchTask(id, { helpers: helping ? t.helpers.filter((h) => h !== ctx.me) : [...t.helpers, ctx.me] })}>{helping ? 'Stop helping' : 'I can help'}</Btn>}
            {mineToDo && <Btn onClick={() => { ctx.act(t, 'push'); }}>Next week</Btn>}
            <Btn kind="go" onClick={() => setFinishing(true)}>Done</Btn>
          </>
        )}
      </Bar>
    </>
  );
}

const DUE_CHIPS: [string, number][] = [['Today', 0], ['Tomorrow', 1], ['Mon', 3], ['Next week', 7]];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block px-4 mb-4">
      <span className="block font-semibold mb-1">{label}</span>
      {children}
    </label>
  );
}
const inputCls = 'w-full min-h-11 px-3 py-2 rounded-lg text-base';
const inputSt = { border: `1px solid #d6cfc2`, background: '#fff' };

function Chips<V extends string | number>({ options, value, onChange }: { options: [string, V][]; value: V; onChange: (v: V) => void }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {options.map(([l, v]) => (
        <button key={l} type="button" className="px-3 min-h-11 rounded-lg text-sm font-semibold" style={value === v ? { background: C.ink, color: '#fff' } : { border: `1px solid #d6cfc2`, background: '#fff' }} onClick={() => onChange(v)}>
          {l}
        </button>
      ))}
    </div>
  );
}
function MoreOptions({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-4">
      <button type="button" className="px-4 min-h-11 font-semibold" style={{ color: C.muted }} onClick={() => setOpen((v) => !v)}>
        {open ? 'Fewer options ▴' : 'More options ▾'}
      </button>
      {open && <div className="pt-2">{children}</div>}
    </div>
  );
}

function TaskEdit({ ctx, task, link }: { ctx: Ctx; task?: Task; link?: Link }) {
  const [f, setF] = useState<Task>(() => task ?? T({ id: `t${Math.random().toString(36).slice(2)}`, title: '', due: 1, owner: ctx.me, link: link ?? null, type: 'Follow-up' }));
  const set = (p: Partial<Task>) => setF((x) => ({ ...x, ...p }));
  const save = () => {
    if (!f.title.trim()) return ctx.flash('Give it a name first');
    ctx.setTasks((ts) => (task ? ts.map((t) => (t.id === f.id ? f : t)) : [...ts, f]));
    ctx.pop();
    if (task) ctx.push({ kind: 'task', id: f.id });
    ctx.flash(task ? 'Saved' : 'Task added');
  };
  const people = Object.entries(STAFF);
  return (
    <>
      <Top onBack={() => { ctx.pop(); if (task) ctx.push({ kind: 'task', id: task.id }); }} title={task ? 'Edit task' : 'New task'} />
      <Field label="What needs doing?">
        <input className={inputCls} style={inputSt} value={f.title} onChange={(e) => set({ title: e.target.value })} autoFocus={!task} />
      </Field>
      <Field label="When">
        <Chips options={DUE_CHIPS} value={DUE_CHIPS.some(([, v]) => v === f.due) ? f.due : -999} onChange={(v) => set({ due: v })} />
      </Field>
      <Field label="Who has it">
        <select className={inputCls} style={inputSt} value={f.owner ?? ''} onChange={(e) => set({ owner: e.target.value || null })}>
          <option value="">Nobody yet</option>
          {people.map(([k, n]) => <option key={k} value={k}>{k === ctx.me ? `Me (${n})` : n}</option>)}
        </select>
      </Field>
      <label className="flex items-center gap-3 px-4 mb-4 min-h-11">
        <input type="checkbox" className="w-5 h-5" checked={f.high} onChange={(e) => set({ high: e.target.checked })} />
        <span className="font-semibold">High priority</span>
      </label>
      <MoreOptions>
        <Field label="Details">
          <textarea className={inputCls} style={inputSt} rows={3} value={f.details} onChange={(e) => set({ details: e.target.value })} />
        </Field>
        <Field label="Also on it">
          <div className="flex gap-2 flex-wrap">
            {people.filter(([k]) => k !== f.owner).map(([k, n]) => {
              const on = f.helpers.includes(k);
              return (
                <button key={k} type="button" className="px-3 min-h-11 rounded-lg text-sm font-semibold" style={on ? { background: C.ink, color: '#fff' } : { border: `1px solid #d6cfc2`, background: '#fff' }} onClick={() => set({ helpers: on ? f.helpers.filter((h) => h !== k) : [...f.helpers, k] })}>
                  {n}
                </button>
              );
            })}
          </div>
        </Field>
        <Field label="Pick a date instead">
          <select className={inputCls} style={inputSt} value={f.due} onChange={(e) => set({ due: +e.target.value })}>
            {[...(f.due < 0 ? [f.due] : []), ...DAYS.map((_, i) => i)].map((i) => <option key={i} value={i}>{i < 0 ? dueText(i) : DAYS[i]}</option>)}
          </select>
        </Field>
        <Field label="Kind">
          <select className={inputCls} style={inputSt} value={f.type} onChange={(e) => set({ type: e.target.value })}>
            {['Follow-up', 'Welcome', 'Reconnect', 'Placement', 'Bible study', 'Event prep', 'Admin'].map((x) => <option key={x}>{x}</option>)}
          </select>
        </Field>
        <Field label="For (study or event)">
          <select className={inputCls} style={inputSt} value={f.link ? `${f.link.kind}:${f.link.id}` : ''} onChange={(e) => { const [k, i] = e.target.value.split(':'); set({ link: e.target.value ? { kind: k as 'event' | 'study', id: i } : null }); }}>
            <option value="">Nothing</option>
            {ctx.events.map((e) => <option key={e.id} value={`event:${e.id}`}>{e.title}</option>)}
            {ctx.studies.map((s) => <option key={s.id} value={`study:${s.id}`}>{WEEKDAY[s.day]} {s.time} study</option>)}
          </select>
        </Field>
        <Field label="Students">
          <input className={inputCls} style={inputSt} placeholder="Type a name" value={f.people} onChange={(e) => set({ people: e.target.value })} />
        </Field>
      </MoreOptions>
      <Bar>
        {task && <Btn kind="danger" onClick={() => { ctx.act(task, 'drop'); ctx.pop(); }}>Drop task</Btn>}
        <span className="flex-1" />
        <Btn kind="solid" onClick={save}>{task ? 'Save' : 'Add task'}</Btn>
      </Bar>
    </>
  );
}

/* ---------- event ---------- */

function EventView({ ctx, id }: { ctx: Ctx; id: string }) {
  const e = ctx.events.find((x) => x.id === id)!;
  const going = e.going.includes(ctx.me);
  const list = ctx.tasks.filter((t) => t.link?.kind === 'event' && t.link.id === id && t.status !== 'dropped');
  const set = (p: Partial<Ev>) => ctx.setEvents((es) => es.map((x) => (x.id === id ? { ...x, ...p } : x)));
  const [song, setSong] = useState('');
  return (
    <>
      <Top
        onBack={ctx.pop}
        title={e.title}
        sub={`${DAYS[e.day]} · ${e.start}${e.end ? `–${e.end}` : ''} · ${e.where}${e.weekly ? ' · every week' : ''}`}
        right={!ctx.intern && <button className="min-h-11 px-3 font-semibold" onClick={() => { ctx.pop(); ctx.push({ kind: 'event', id, edit: true }); }}>Edit</button>}
      />
      {e.notes && <p className="px-4 mb-5">{e.notes}</p>}
      <Block title={`Who’s going (${e.going.length})`}>
        <p>{e.going.length ? e.going.map((g) => (g === ctx.me ? 'You' : STAFF[g])).join(', ') : <span style={{ color: C.muted }}>Nobody yet</span>}</p>
        {!ctx.intern && <button className={`${linkBtn} text-sm mt-2`} onClick={() => ctx.flash('(Mock) invite picker: they accept or decline')}>Invite someone</button>}
      </Block>
      <Block
        title="Checklist"
        right={!ctx.intern && <button className={`${linkBtn} text-sm`} onClick={() => ctx.push({ kind: 'newTask', link: { kind: 'event', id } })}>Add</button>}
      >
        {list.length === 0 ? (
          <p className="text-sm" style={{ color: C.muted }}>No tasks. {ctx.intern ? '' : 'Add one, or start from a list (Taco Night, Mission trip…).'}</p>
        ) : (
          <ul className="rounded-xl overflow-hidden" style={{ background: C.card, border: `1px solid ${C.line}` }}>
            {list.map((t, i) => (
              <li key={t.id} className="flex items-center gap-3 px-4" style={{ borderTop: i ? `1px solid ${C.line}` : 'none' }}>
                <input type="checkbox" className="w-5 h-5 shrink-0" aria-label={`Done: ${t.title}`} checked={t.status === 'done'} onChange={(ev) => ctx.patchTask(t.id, { status: ev.target.checked ? 'done' : 'open' })} />
                <button className="flex-1 text-left py-3 min-w-0" onClick={() => ctx.push({ kind: 'task', id: t.id })}>
                  <span className={`block font-semibold ${t.status === 'done' ? 'line-through opacity-50' : ''}`}>{t.title}</span>
                  <span className="text-sm" style={{ color: t.owner ? C.muted : C.late }}>{t.owner ? STAFF[t.owner] : 'Nobody yet'} · {dueText(t.due)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Block>
      {(e.songs.length > 0 || e.type === 'Outreach' || e.type === 'Teaching') && (
        <Block title="Songs">
          <ol className="list-decimal pl-5 mb-2">{e.songs.map((s) => <li key={s}>{s}</li>)}</ol>
          {!ctx.intern && (
            <div className="flex gap-2">
              <input className="flex-1 min-h-11 px-3 rounded-lg" style={inputSt} placeholder="Add a song" value={song} onChange={(x) => setSong(x.target.value)} />
              <Btn onClick={() => { if (song.trim()) { set({ songs: [...e.songs, song.trim()] }); setSong(''); } }}>Add</Btn>
            </div>
          )}
        </Block>
      )}
      {e.dailyDna && <p className="px-4 mb-5 text-sm" style={{ color: C.muted }}>Shows in Daily DNA for everyone at ARK Iowa.</p>}
      <Bar>
        {e.link && <Btn kind="go" onClick={() => ctx.flash('(Mock) opens Google Meet')}>Join meeting</Btn>}
        <Btn kind={going ? 'line' : 'solid'} onClick={() => set({ going: going ? e.going.filter((g) => g !== ctx.me) : [...e.going, ctx.me] })}>{going ? 'Can’t make it' : 'I’m going'}</Btn>
      </Bar>
    </>
  );
}

function EventEdit({ ctx, ev }: { ctx: Ctx; ev?: Ev }) {
  const [f, setF] = useState<Ev>(() => ev ?? EV({ id: `e${Math.random().toString(36).slice(2)}`, title: '', day: 0, start: '7:00 PM' }));
  const [confirm, setConfirm] = useState(false);
  const set = (p: Partial<Ev>) => setF((x) => ({ ...x, ...p }));
  const back = () => { ctx.pop(); if (ev) ctx.push({ kind: 'event', id: ev.id }); };
  const save = () => {
    if (!f.title.trim()) return ctx.flash('Give it a name first');
    ctx.setEvents((es) => (ev ? es.map((x) => (x.id === f.id ? f : x)) : [...es, f]));
    ctx.pop();
    ctx.push({ kind: 'event', id: f.id });
    ctx.flash(ev ? 'Saved. Google Calendar updated.' : 'Event added');
  };
  return (
    <>
      <Top onBack={back} title={ev ? 'Edit event' : 'New event'} />
      <Field label="Name"><input className={inputCls} style={inputSt} value={f.title} onChange={(e) => set({ title: e.target.value })} autoFocus={!ev} /></Field>
      <Field label="Day">
        <select className={inputCls} style={inputSt} value={f.day} onChange={(e) => set({ day: +e.target.value })}>{DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}</select>
      </Field>
      <div className="grid grid-cols-2">
        <Field label="Starts"><input className={inputCls} style={inputSt} value={f.start} onChange={(e) => set({ start: e.target.value })} /></Field>
        <Field label="Ends"><input className={inputCls} style={inputSt} value={f.end} onChange={(e) => set({ end: e.target.value })} placeholder="optional" /></Field>
      </div>
      <Field label="Where"><input className={inputCls} style={inputSt} value={f.where} onChange={(e) => set({ where: e.target.value })} /></Field>
      <label className="flex items-center gap-3 px-4 mb-4 min-h-11">
        <input type="checkbox" className="w-5 h-5" checked={f.weekly} onChange={(e) => set({ weekly: e.target.checked })} />
        <span className="font-semibold">Every week</span>
      </label>
      <MoreOptions>
        <Field label="Kind">
          <select className={inputCls} style={inputSt} value={f.type} onChange={(e) => set({ type: e.target.value })}>{['Gathering', 'Outreach', 'Teaching', 'Prayer', 'Mission trip', 'Staff'].map((x) => <option key={x}>{x}</option>)}</select>
        </Field>
        <Field label="Meeting link"><input className={inputCls} style={inputSt} value={f.link} onChange={(e) => set({ link: e.target.value })} placeholder="Paste a Google Meet link" /></Field>
        {f.weekly && <Field label="Until (optional)"><input className={inputCls} style={inputSt} placeholder="End of semester" /></Field>}
        <Field label="Notes"><textarea className={inputCls} style={inputSt} rows={3} value={f.notes} onChange={(e) => set({ notes: e.target.value })} /></Field>
        <label className="flex items-center gap-3 px-4 mb-4 min-h-11">
          <input type="checkbox" className="w-5 h-5" checked={f.dailyDna} onChange={(e) => set({ dailyDna: e.target.checked })} />
          <span className="font-semibold">Show in Daily DNA for everyone</span>
        </label>
        {f.weekly && ev && <p className="px-4 mb-4 text-sm"><button className={linkBtn} onClick={() => ctx.flash('(Mock) skip one week')}>Skip one week</button></p>}
      </MoreOptions>
      <Bar>
        {ev && !confirm && <Btn kind="danger" onClick={() => setConfirm(true)}>Delete</Btn>}
        {ev && confirm && (
          <>
            <span className="text-sm" style={{ color: C.late }}>Delete {f.weekly ? 'every week' : 'it'}?</span>
            <Btn kind="danger" onClick={() => { ctx.setEvents((es) => es.filter((x) => x.id !== ev.id)); ctx.pop(); ctx.flash('Deleted'); }}>Yes, delete</Btn>
          </>
        )}
        <span className="flex-1" />
        <Btn kind="solid" onClick={save}>{ev ? 'Save' : 'Add event'}</Btn>
      </Bar>
    </>
  );
}

/* ---------- study ---------- */

function StudyView({ ctx, id }: { ctx: Ctx; id: string }) {
  const s = ctx.studies.find((x) => x.id === id)!;
  const [taking, setTaking] = useState(false);
  const [came, setCame] = useState<Record<string, boolean>>(s.came);
  const leader = s.roster.find((m) => m.leader);
  const tasks = ctx.tasks.filter((t) => t.link?.kind === 'study' && t.link.id === id && t.status === 'open');
  return (
    <>
      <Top
        onBack={ctx.pop}
        title={`${WEEKDAY[s.day]} ${s.time} Bible study`}
        sub={`${s.where} · ${s.group}${s.online ? ' · online' : ''}`}
        right={!ctx.intern && <button className="min-h-11 px-3 font-semibold" onClick={() => { ctx.pop(); ctx.push({ kind: 'study', id, edit: true }); }}>Edit</button>}
      />
      <Facts
        rows={[
          ['Students', `${s.roster.length} of ${s.cap}`],
          ['Student leader', leader ? leader.name : <span style={{ color: C.muted }}>None yet</span>],
          ['Staff on point', s.onPoint ? (s.onPoint === ctx.me ? 'You' : STAFF[s.onPoint]) : <span style={{ color: C.late }}>Nobody</span>],
          ...(s.notes ? [['Notes', s.notes] as [string, React.ReactNode]] : []),
        ]}
      />
      {tasks.length > 0 && (
        <Block title="To do">
          {tasks.map((t) => (
            <button key={t.id} className="block w-full text-left py-2 font-semibold" onClick={() => ctx.push({ kind: 'task', id: t.id })}>
              {t.title} <span className="text-sm font-normal" style={{ color: t.due < 0 ? C.late : C.muted }}>· {dueText(t.due)}</span>
            </button>
          ))}
        </Block>
      )}
      <Block title={taking ? 'Who came today?' : 'Students'}>
        <ul className="rounded-xl overflow-hidden" style={{ background: C.card, border: `1px solid ${C.line}` }}>
          {s.roster.map((m, i) => (
            <li key={m.name} className="flex items-center justify-between gap-3 px-4 py-2.5" style={{ borderTop: i ? `1px solid ${C.line}` : 'none' }}>
              <span className="min-w-0">
                <span className="block font-semibold">{m.name}{m.leader && <span className="text-xs ml-2" style={{ color: C.muted }}>Leader</span>}</span>
                <span className="text-sm" style={{ color: C.muted }}>{m.year}</span>
              </span>
              {taking ? (
                <Chips options={[['Came', 'y'], ['Missed', 'n']]} value={came[m.name] === undefined ? '' : came[m.name] ? 'y' : 'n'} onChange={(v) => setCame((c) => ({ ...c, [m.name]: v === 'y' }))} />
              ) : (
                <span className="flex gap-1 shrink-0">
                  <a className="px-3 min-h-11 inline-flex items-center rounded-lg text-sm font-semibold" style={{ border: `1px solid ${C.line}` }} href={`tel:${m.phone}`}>Call</a>
                  <a className="px-3 min-h-11 inline-flex items-center rounded-lg text-sm font-semibold" style={{ border: `1px solid ${C.line}` }} href={`sms:${m.phone}`}>Text</a>
                </span>
              )}
            </li>
          ))}
        </ul>
        {!taking && !ctx.intern && (
          <div className="flex gap-4 mt-2 text-sm">
            <button className={linkBtn} onClick={() => ctx.flash('(Mock) search students to add')}>Add a student</button>
            <button className={linkBtn} onClick={() => ctx.flash('(Mock) pick a student to move or drop (asks why)')}>Move or drop</button>
          </div>
        )}
      </Block>
      <Bar>
        {taking ? (
          <>
            <Btn kind="quiet" onClick={() => setTaking(false)}>Cancel</Btn>
            <Btn kind="go" onClick={() => { ctx.setStudies((ss) => ss.map((x) => (x.id === id ? { ...x, came } : x))); setTaking(false); ctx.flash('Attendance saved'); }}>Save attendance</Btn>
          </>
        ) : (
          <>
            <Btn onClick={() => ctx.flash('(Mock) texts the whole group')}>Text the group</Btn>
            <Btn kind="solid" onClick={() => setTaking(true)}>Take attendance</Btn>
          </>
        )}
      </Bar>
    </>
  );
}

function StudyEdit({ ctx, s }: { ctx: Ctx; s: Study }) {
  const [f, setF] = useState(s);
  const set = (p: Partial<Study>) => setF((x) => ({ ...x, ...p }));
  const back = () => { ctx.pop(); ctx.push({ kind: 'study', id: s.id }); };
  return (
    <>
      <Top onBack={back} title="Edit study" />
      <Field label="Day">
        <select className={inputCls} style={inputSt} value={f.day} onChange={(e) => set({ day: +e.target.value })}>{WEEKDAY.map((d, i) => <option key={d} value={i}>{d}</option>)}</select>
      </Field>
      <Field label="Time"><input className={inputCls} style={inputSt} value={f.time} onChange={(e) => set({ time: e.target.value })} /></Field>
      <Field label="Where"><input className={inputCls} style={inputSt} value={f.where} onChange={(e) => set({ where: e.target.value })} /></Field>
      <Field label="Staff on point">
        <select className={inputCls} style={inputSt} value={f.onPoint ?? ''} onChange={(e) => set({ onPoint: e.target.value || null })}>
          <option value="">Nobody</option>
          {Object.entries(STAFF).map(([k, n]) => <option key={k} value={k}>{n}</option>)}
        </select>
      </Field>
      <MoreOptions>
        <Field label="Who can join"><Chips options={[['Co-ed', 'Co-ed'], ['Guys', 'Guys'], ['Girls', 'Girls']]} value={f.group} onChange={(v) => set({ group: v })} /></Field>
        <Field label="Spots"><input type="number" className={inputCls} style={inputSt} value={f.cap} onChange={(e) => set({ cap: +e.target.value })} /></Field>
        <label className="flex items-center gap-3 px-4 mb-4 min-h-11">
          <input type="checkbox" className="w-5 h-5" checked={f.online} onChange={(e) => set({ online: e.target.checked })} />
          <span className="font-semibold">Meets online</span>
        </label>
        <Field label="Notes"><textarea className={inputCls} style={inputSt} rows={3} value={f.notes} onChange={(e) => set({ notes: e.target.value })} /></Field>
      </MoreOptions>
      <Bar>
        <Btn kind="quiet" onClick={back}>Cancel</Btn>
        <Btn kind="solid" onClick={() => { ctx.setStudies((ss) => ss.map((x) => (x.id === f.id ? f : x))); back(); ctx.flash('Saved. Students get the new time.'); }}>Save</Btn>
      </Bar>
    </>
  );
}
