'use client';

import { useMemo, useState } from 'react';

type Kind = 'thank' | 'celebrate' | 'checkin' | 'followup' | 'prayer' | 'travis';
type Person = 'Kimberly' | 'Travis';

interface Item {
  id: string;
  kind: Kind;
  name: string;
  why: string;
  giving: string;
  lastTouch: string;
  draft: string;
  owner: Person;
  from?: string;
}

// Made-up people. None of these are real donors.
const SAMPLE: Item[] = [
  { id: '1', kind: 'thank', name: 'Dan & Rachel Miller', why: 'First gift came in Tuesday · $100 via Square', giving: 'New · Square', lastTouch: 'Met at worship night, Sep 12', owner: 'Kimberly',
    draft: 'Dan and Rachel, we saw your first gift come in this week and wanted to say thank you. It means more than you know. We would love to grab coffee soon and tell you what God is doing.' },
  { id: '2', kind: 'celebrate', name: 'Laura Bennett', why: 'Birthday Thursday', giving: 'Secured · $150/mo · GSA (personal)', lastTouch: 'Text, 3 weeks ago', owner: 'Kimberly',
    draft: 'Happy birthday, Laura! We are so thankful for you. Praying this year is full of good things.' },
  { id: '3', kind: 'celebrate', name: 'Marcus & Jen Ortiz', why: '15th anniversary Saturday', giving: 'Secured · $300/mo · Zelle', lastTouch: 'Call, Sep 30', owner: 'Kimberly',
    draft: 'Happy 15th, Marcus and Jen! Thank you for showing us what a faithful marriage looks like.' },
  { id: '4', kind: 'checkin', name: 'Greg Thompson', why: 'Usually gives monthly · nothing in 47 days', giving: 'Secured · $200/mo · Square', lastTouch: 'Email, Aug 2', owner: 'Kimberly',
    draft: 'Hey Greg, you came to mind today and we wanted to check in. How are you and the family doing? Anything we can be praying about?' },
  { id: '5', kind: 'checkin', name: 'Sarah Kim', why: 'No contact in 4 months', giving: 'Paused · was $75/mo · GSA (ARK)', lastTouch: 'Card, June 14', owner: 'Kimberly',
    draft: 'Sarah, just thinking of you. No agenda, we just miss hearing how you are doing.' },
  { id: '6', kind: 'prayer', name: 'Tom & Amy Reed', why: 'Amy had surgery Oct 10. Ask how recovery is going.', giving: 'Secured · $100/mo · GSA (personal)', lastTouch: 'Prayer note, Oct 8', owner: 'Kimberly',
    draft: 'Amy, we have been praying for you since your surgery. How is recovery going?' },
  { id: '7', kind: 'followup', name: 'Chris Walters', why: 'Referred by Laura Bennett · next step: coffee', giving: 'Prospect', lastTouch: 'None yet', owner: 'Kimberly',
    draft: 'Hi Chris, Laura Bennett mentioned you and said we should meet. Would you be open to coffee in the next couple of weeks?' },
  { id: '8', kind: 'travis', name: 'Pastor Ray Collins', why: 'Gave $1,000 one-time. Feels like a call from you.', from: 'Kimberly', giving: 'Periodically · GSA (ARK)', lastTouch: 'Email from Kimberly, Oct 15', owner: 'Travis',
    draft: 'Ray, thank you for your gift. Would love 20 minutes this week to tell you where it is going.' },
];

const KIND: Record<Kind, { label: string; dot: string }> = {
  thank: { label: 'Say thank you', dot: '#2f7d4f' },
  celebrate: { label: 'Celebrate', dot: '#e8b562' },
  checkin: { label: 'Check in', dot: '#b4542d' },
  prayer: { label: 'Prayer follow-up', dot: '#5f0c0b' },
  followup: { label: 'Next step', dot: '#143348' },
  travis: { label: 'From Kimberly', dot: '#143348' },
};
const ORDER: Kind[] = ['travis', 'thank', 'celebrate', 'prayer', 'checkin', 'followup'];

type Status = 'open' | 'done' | 'snoozed' | 'skipped' | 'handed';

export function DonorTodayLab() {
  const [who, setWho] = useState<Person>('Kimberly');
  const [items, setItems] = useState<Item[]>(SAMPLE);
  const [status, setStatus] = useState<Record<string, Status>>({});
  const [open, setOpen] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const mine = items.filter((i) => i.owner === who);
  const waiting = mine.filter((i) => !status[i.id] || status[i.id] === 'open');
  const doneCount = mine.filter((i) => status[i.id] === 'done').length;

  const groups = useMemo(
    () => ORDER.map((k) => ({ k, list: waiting.filter((i) => i.kind === k) })).filter((g) => g.list.length),
    [waiting],
  );

  function act(id: string, s: Status) {
    setStatus((p) => ({ ...p, [id]: s }));
    setOpen(null);
  }
  function handToTravis(item: Item) {
    act(item.id, 'handed');
    setItems((p) => [...p, { ...item, id: item.id + '-t', kind: 'travis', owner: 'Travis', from: 'Kimberly', why: item.why + ' · Kimberly thinks you should reach out.' }]);
  }
  function reset() {
    setItems(SAMPLE); setStatus({}); setDrafts({}); setOpen(null);
  }

  return (
    <div style={{ background: '#FAF8F5', minHeight: '100vh', color: '#1a2b3c' }}>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#b4542d' }}>Lab · sample donors, nothing is saved</p>
        <div className="flex items-end justify-between gap-3 mt-1 mb-5">
          <h1 className="text-3xl font-bold">Today</h1>
          <div className="flex rounded-lg overflow-hidden border text-sm" style={{ borderColor: '#d9d3ca' }}>
            {(['Kimberly', 'Travis'] as Person[]).map((p) => (
              <button key={p} onClick={() => { setWho(p); setOpen(null); }}
                className="px-3 py-1.5 font-semibold"
                style={{ background: who === p ? '#143348' : 'white', color: who === p ? 'white' : '#143348' }}>
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-6">
          <Stat n={waiting.length} label="waiting" />
          <Stat n={doneCount} label="cared for today" />
          <Stat n="$6,505" label="secured monthly" />
        </div>

        {groups.length === 0 && (
          <div className="rounded-xl bg-white p-6 text-center border" style={{ borderColor: '#e6e0d6' }}>
            <p className="text-lg font-bold">All caught up.</p>
            <p className="text-sm mt-1" style={{ color: '#6b6560' }}>Snoozed people come back on their date.</p>
          </div>
        )}

        {groups.map(({ k, list }) => (
          <section key={k} className="mb-6">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide mb-2" style={{ color: '#6b6560' }}>
              <span className="inline-block w-2 h-2 rounded-full" style={{ background: KIND[k].dot }} />
              {KIND[k].label} <span className="font-normal">· {list.length}</span>
            </h2>
            <div className="space-y-2">
              {list.map((i) => {
                const isOpen = open === i.id;
                return (
                  <div key={i.id} className="rounded-xl bg-white border" style={{ borderColor: '#e6e0d6' }}>
                    <button className="w-full text-left p-4" onClick={() => setOpen(isOpen ? null : i.id)}>
                      <p className="font-bold">{i.name}</p>
                      <p className="text-sm mt-0.5">{i.why}</p>
                      <p className="text-xs mt-1" style={{ color: '#6b6560' }}>{i.giving}</p>
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4">
                        <p className="text-xs mb-2" style={{ color: '#6b6560' }}>Last contact: {i.lastTouch}</p>
                        <textarea
                          className="w-full rounded-lg border p-3 text-sm"
                          style={{ borderColor: '#d9d3ca', minHeight: 96 }}
                          value={drafts[i.id] ?? i.draft}
                          onChange={(e) => setDrafts((p) => ({ ...p, [i.id]: e.target.value }))}
                        />
                        <div className="flex flex-wrap items-center justify-end gap-2 mt-3 text-sm">
                          {who === 'Kimberly' && (
                            <button onClick={() => handToTravis(i)} className="mr-auto font-semibold hover:underline" style={{ color: '#143348' }}>
                              Travis should reach out
                            </button>
                          )}
                          <button onClick={() => act(i.id, 'skipped')} className="px-3 py-2 rounded-lg" style={{ color: '#6b6560' }}>Skip</button>
                          <button onClick={() => act(i.id, 'snoozed')} className="px-3 py-2 rounded-lg border font-semibold" style={{ borderColor: '#d9d3ca' }}>Snooze a week</button>
                          <button onClick={() => act(i.id, 'done')} className="px-4 py-2 rounded-lg font-semibold text-white" style={{ background: '#143348' }}>Done</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        <div className="flex justify-end mt-8">
          <button onClick={reset} className="text-sm font-semibold hover:underline" style={{ color: '#6b6560' }}>Reset the lab</button>
        </div>
      </div>
    </div>
  );
}

function Stat({ n, label }: { n: number | string; label: string }) {
  return (
    <div className="rounded-xl bg-white border p-3" style={{ borderColor: '#e6e0d6' }}>
      <p className="text-2xl font-bold">{n}</p>
      <p className="text-xs" style={{ color: '#6b6560' }}>{label}</p>
    </div>
  );
}
