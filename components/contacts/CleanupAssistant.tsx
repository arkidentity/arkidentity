'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ContactWithTags, Tag } from '@/lib/contacts';

// The one-time cleanup after the first Google sync, as suggestions to accept or
// skip: duplicate pairs (with a suggested keeper), where each old tag should go
// (the final six labels, decided 11/2), and people with no ministry tie who are
// probably plumbers and dentists from the phone. Every Accept calls the same
// endpoints the Contacts and Tags pages use; skips are remembered per browser.

const card = { backgroundColor: '#FFFFFF', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' } as const;
const inputStyle = { borderColor: '#d1d5db', color: '#111827' } as const;

const FINAL = ['Financial Partner', 'Prayer Partner', 'Prospect', 'Worship Night', 'ARK Iowa', 'Ministry Partner'];

// First match wins. Lowercased tag name in, final label (or null) out.
const RULES: [RegExp, string][] = [
  [/pray|intercess/, 'Prayer Partner'],
  [/donor|financial|giv|support|monthly|tith|sponsor/, 'Financial Partner'],
  [/prospect|lead|referr|potential/, 'Prospect'],
  [/worship/, 'Worship Night'],
  [/iowa|student|campus|uiowa|hawkeye|intern|bible study|trick|truth|baja/, 'ARK Iowa'],
  [/pastor|church|ministr|leader|partner|board|advis|trainer|coach|dna/, 'Ministry Partner'],
];

function suggestTarget(name: string): string | null {
  const n = name.toLowerCase();
  for (const [re, target] of RULES) if (re.test(n)) return target;
  return null;
}

const slug = (s: string) => s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const phoneKey = (p?: string | null) => {
  const d = p?.replace(/\D/g, '') ?? '';
  return d.length >= 7 ? d.slice(-10) : null;
};

function loadSkips(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem('cleanup-skips') ?? '[]') as string[]);
  } catch {
    return new Set();
  }
}

function keeperOf(a: ContactWithTags, b: ContactWithTags): ContactWithTags {
  const score = (c: ContactWithTags) =>
    (c.google_resource_name ? 8 : 0) + (c.subscribed ? 4 : 0) + (c.email ? 2 : 0) + c.tags.length * 0.5 + (c.phone ? 1 : 0);
  return score(b) > score(a) ? b : a;
}

export function CleanupAssistant({ contacts: initial, tags: initialTags }: { contacts: ContactWithTags[]; tags: Tag[] }) {
  const router = useRouter();
  const [contacts, setContacts] = useState(initial);
  const [tags, setTags] = useState(initialTags);
  const [skips, setSkips] = useState<Set<string>>(() => (typeof window === 'undefined' ? new Set() : loadSkips()));
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'dupes' | 'tags' | 'archive'>('dupes');

  function skip(key: string) {
    const next = new Set(skips).add(key);
    setSkips(next);
    try { localStorage.setItem('cleanup-skips', JSON.stringify([...next])); } catch {}
  }

  // ---- Duplicate pairs -------------------------------------------------------
  const pairs = useMemo(() => {
    const groups = new Map<string, { ids: string[]; why: string }>();
    const add = (key: string | null, why: string, id: string) => {
      if (!key) return;
      const g = groups.get(key) ?? { ids: [], why };
      g.ids.push(id);
      groups.set(key, g);
    };
    for (const c of contacts) {
      add(c.name ? `n:${c.name.trim().toLowerCase().replace(/\s+/g, ' ')}` : null, 'same name', c.id);
      for (const e of [c.email, ...(c.other_emails ?? [])]) add(e ? `e:${e.toLowerCase()}` : null, 'same email', c.id);
      for (const p of [c.phone, ...(c.other_phones ?? [])]) add(phoneKey(p) ? `p:${phoneKey(p)}` : null, 'same phone', c.id);
    }
    const byId = new Map(contacts.map((c) => [c.id, c]));
    const out = new Map<string, { a: ContactWithTags; b: ContactWithTags; why: Set<string> }>();
    for (const { ids, why } of groups.values()) {
      const uniq = [...new Set(ids)];
      for (let i = 0; i < uniq.length; i++) {
        for (let j = i + 1; j < uniq.length; j++) {
          const [x, y] = [uniq[i], uniq[j]].sort();
          const key = `pair:${x}:${y}`;
          const a = byId.get(x), b = byId.get(y);
          if (!a || !b) continue;
          const entry = out.get(key) ?? { a, b, why: new Set<string>() };
          entry.why.add(why);
          out.set(key, entry);
        }
      }
    }
    // Strongest first: a shared email or phone beats a shared name.
    return [...out.entries()]
      .filter(([key]) => !skips.has(key))
      .map(([key, v]) => ({ key, ...v, strength: (v.why.has('same email') ? 2 : 0) + (v.why.has('same phone') ? 2 : 0) + (v.why.has('same name') ? 1 : 0) }))
      .sort((p, q) => q.strength - p.strength);
  }, [contacts, skips]);

  async function acceptMerge(keep: ContactWithTags, lose: ContactWithTags) {
    setBusy(`m:${lose.id}`); setError('');
    const res = await fetch('/api/admin/contacts/merge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keepId: keep.id, loseId: lose.id }),
    });
    setBusy(null);
    if (!res.ok) { setError((await res.json().catch(() => ({}))).error || 'Merge failed.'); return; }
    const { contact } = (await res.json()) as { contact: ContactWithTags };
    setContacts((l) => l.filter((c) => c.id !== lose.id).map((c) => (c.id === keep.id ? contact : c)));
  }

  // ---- Tag mapping -----------------------------------------------------------
  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const c of contacts) for (const t of c.tags) m[t.id] = (m[t.id] ?? 0) + 1;
    return m;
  }, [contacts]);
  const finalSlugs = new Set(FINAL.map(slug));
  const oldTags = tags.filter((t) => !finalSlugs.has(t.slug) && !skips.has(`tag:${t.id}`));
  const missingFinal = FINAL.filter((n) => !tags.some((t) => t.slug === slug(n)));
  const [choice, setChoice] = useState<Record<string, string>>({});

  async function ensureFinal(name: string): Promise<Tag | null> {
    const existing = tags.find((t) => t.slug === slug(name));
    if (existing) return existing;
    const res = await fetch('/api/admin/contacts/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) return null;
    const { tag } = (await res.json()) as { tag: Tag };
    setTags((t) => [...t, tag]);
    return tag;
  }

  async function acceptTag(tag: Tag, target: string) {
    setBusy(`t:${tag.id}`); setError('');
    let res: Response;
    if (target === '__delete') {
      res = await fetch(`/api/admin/contacts/tags/${tag.id}`, { method: 'DELETE' });
    } else {
      const into = await ensureFinal(target);
      if (!into) { setBusy(null); setError(`Could not create ${target}.`); return; }
      res = await fetch(`/api/admin/contacts/tags/${tag.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mergeIntoId: into.id }),
      });
      if (res.ok) {
        setContacts((l) =>
          l.map((c) =>
            c.tags.some((t) => t.id === tag.id)
              ? { ...c, tags: [...c.tags.filter((t) => t.id !== tag.id && t.id !== into.id), into] }
              : c
          )
        );
      }
    }
    setBusy(null);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { setError(data.error || 'That didn’t work.'); return; }
    if (data.googleError) setError(data.googleError);
    setTags((t) => t.filter((x) => x.id !== tag.id));
    if (target === '__delete') setContacts((l) => l.map((c) => ({ ...c, tags: c.tags.filter((t) => t.id !== tag.id) })));
  }

  // ---- Archive candidates ----------------------------------------------------
  const candidates = useMemo(
    () =>
      contacts
        .filter((c) => c.status === 'active' && c.tags.length === 0 && !c.subscribed && !skips.has(`arch:${c.id}`))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [contacts, skips]
  );
  const [archivePick, setArchivePick] = useState<Set<string>>(new Set());

  async function archivePicked() {
    const ids = [...archivePick];
    if (!ids.length || !window.confirm(`Archive ${ids.length}? They stay in Google and can be restored on Contacts.`)) return;
    setBusy('archive'); setError('');
    const ok = await Promise.all(ids.map((id) => fetch(`/api/admin/contacts/${id}`, { method: 'DELETE' }).then((r) => r.ok)));
    setBusy(null);
    const done = new Set(ids.filter((_, i) => ok[i]));
    setContacts((l) => l.filter((c) => !done.has(c.id)));
    setArchivePick(new Set());
    if (done.size < ids.length) setError(`${ids.length - done.size} couldn't be archived.`);
  }

  const tabs = [
    { id: 'dupes' as const, label: 'Duplicates', n: pairs.length },
    { id: 'tags' as const, label: 'Tags', n: oldTags.length },
    { id: 'archive' as const, label: 'Not ministry?', n: candidates.length },
  ];

  return (
    <div>
      <div className="flex gap-2 mb-5">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="px-4 py-2 rounded-lg text-sm font-semibold border"
            style={tab === t.id ? { backgroundColor: 'var(--navy)', color: 'white', borderColor: 'var(--navy)' } : { borderColor: '#d1d5db', color: 'var(--navy)', backgroundColor: 'white' }}
          >
            {t.label} ({t.n})
          </button>
        ))}
      </div>

      {error && <p className="rounded-lg px-4 py-3 mb-4 text-sm" style={{ background: '#fdecea', color: '#9b2c2c' }}>{error}</p>}

      {tab === 'dupes' && (
        <div className="space-y-3">
          {pairs.length === 0 && <p style={{ color: '#8a8378' }}>No likely duplicates left.</p>}
          {pairs.slice(0, 30).map(({ key, a, b, why }) => (
            <DupeCard key={key} a={a} b={b} why={[...why]} busy={busy === `m:${a.id}` || busy === `m:${b.id}`} onMerge={acceptMerge} onSkip={() => skip(key)} />
          ))}
          {pairs.length > 30 && <p className="text-sm" style={{ color: '#8a8378' }}>Showing 30 of {pairs.length}. More appear as you go.</p>}
        </div>
      )}

      {tab === 'tags' && (
        <div className="space-y-3">
          <p className="text-sm" style={{ color: '#5f5a52' }}>
            Keeping: <b>{FINAL.join(', ')}</b>.{missingFinal.length ? ` ${missingFinal.join(', ')} will be created when first used.` : ''} Moving a tag puts everyone on it onto the new one, in ARK and Google.
          </p>
          {oldTags.length === 0 && <p style={{ color: '#8a8378' }}>Only the final six are left.</p>}
          {oldTags.map((t) => {
            const suggested = suggestTarget(t.name) ?? '__delete';
            const picked = choice[t.id] ?? suggested;
            return (
              <div key={t.id} className="rounded-xl p-4 flex flex-wrap items-center gap-3" style={card}>
                <div className="flex-1 min-w-[160px]">
                  <p className="font-semibold" style={{ color: 'var(--navy)' }}>{t.name}</p>
                  <p className="text-xs" style={{ color: '#8a8378' }}>{counts[t.id] ?? 0} people</p>
                </div>
                <select
                  value={picked}
                  onChange={(e) => setChoice((c) => ({ ...c, [t.id]: e.target.value }))}
                  className="px-3 py-2 rounded-lg border text-sm"
                  style={inputStyle}
                >
                  {FINAL.map((f) => <option key={f} value={f}>Move to {f}</option>)}
                  <option value="__delete">Remove this tag</option>
                </select>
                <button onClick={() => skip(`tag:${t.id}`)} className="text-sm font-semibold px-3 py-2 rounded-lg border" style={{ borderColor: '#d1d5db', color: '#8a8378' }}>
                  Keep as is
                </button>
                <button
                  onClick={() => acceptTag(t, picked)}
                  disabled={!!busy}
                  className="text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-50"
                  style={{ backgroundColor: 'var(--navy)', color: 'white' }}
                >
                  {busy === `t:${t.id}` ? 'Working…' : 'Accept'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'archive' && (
        <div>
          <p className="text-sm mb-3" style={{ color: '#5f5a52' }}>
            Active people with no tags who aren&apos;t on updates. Mostly from your phone. Check the ones who aren&apos;t ministry, then archive them. They stay in Google.
          </p>
          {candidates.length > 0 && (
            <div className="flex flex-wrap items-center justify-end gap-3 mb-3">
              <button
                onClick={() => setArchivePick(archivePick.size === candidates.length ? new Set() : new Set(candidates.map((c) => c.id)))}
                className="text-sm font-semibold px-3 py-2 rounded-lg border"
                style={{ borderColor: '#d1d5db', color: 'var(--navy)' }}
              >
                {archivePick.size === candidates.length ? 'Uncheck all' : 'Check all'}
              </button>
              <button
                onClick={archivePicked}
                disabled={!archivePick.size || !!busy}
                className="text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-40"
                style={{ backgroundColor: '#b91c1c', color: 'white' }}
              >
                {busy === 'archive' ? 'Archiving…' : `Archive ${archivePick.size || ''}`}
              </button>
            </div>
          )}
          <div className="rounded-xl overflow-hidden" style={card}>
            {candidates.length === 0 && <p className="px-5 py-6 text-sm" style={{ color: '#8a8378' }}>Nobody left to review.</p>}
            {candidates.map((c) => (
              <label key={c.id} className="flex items-center gap-3 px-5 py-3 border-b cursor-pointer" style={{ borderColor: '#f0ede8' }}>
                <input
                  type="checkbox"
                  checked={archivePick.has(c.id)}
                  onChange={() => setArchivePick((s) => { const n = new Set(s); if (n.has(c.id)) n.delete(c.id); else n.add(c.id); return n; })}
                />
                <span className="flex-1">
                  <span className="font-semibold" style={{ color: 'var(--navy)' }}>{c.name}</span>
                  <span className="block text-sm" style={{ color: '#8a8378' }}>{[c.email, c.phone].filter(Boolean).join(' · ')}</span>
                </span>
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); skip(`arch:${c.id}`); }}
                  className="text-sm font-semibold hover:underline"
                  style={{ color: 'var(--navy)' }}
                >
                  Keep
                </button>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 flex justify-end">
        <button onClick={() => router.push('/admin/contacts')} className="text-sm font-semibold hover:underline" style={{ color: 'var(--navy)' }}>
          Back to Contacts to sync →
        </button>
      </div>
    </div>
  );
}

function DupeCard({
  a,
  b,
  why,
  busy,
  onMerge,
  onSkip,
}: {
  a: ContactWithTags;
  b: ContactWithTags;
  why: string[];
  busy: boolean;
  onMerge: (keep: ContactWithTags, lose: ContactWithTags) => void;
  onSkip: () => void;
}) {
  const [keepId, setKeepId] = useState(keeperOf(a, b).id);
  const keep = keepId === a.id ? a : b;
  const lose = keepId === a.id ? b : a;
  return (
    <div className="rounded-xl p-4" style={card}>
      <p className="text-xs font-semibold mb-2" style={{ color: '#8a8378' }}>{why.join(' · ')}</p>
      <div className="grid sm:grid-cols-2 gap-2">
        {[a, b].map((c) => (
          <label
            key={c.id}
            className="rounded-lg border p-3 cursor-pointer"
            style={{ borderColor: keepId === c.id ? 'var(--navy)' : '#e5e1da', backgroundColor: keepId === c.id ? '#f3f6f9' : 'white' }}
          >
            <span className="flex items-center gap-2">
              <input type="radio" checked={keepId === c.id} onChange={() => setKeepId(c.id)} />
              <span className="font-semibold" style={{ color: 'var(--navy)' }}>{c.name}</span>
              {keepId === c.id && <span className="text-xs" style={{ color: '#2f6b3a' }}>keep</span>}
            </span>
            <span className="block text-sm mt-1" style={{ color: '#5f5a52' }}>{[c.email, c.phone].filter(Boolean).join(' · ') || 'No email or phone'}</span>
            <span className="block text-xs mt-1" style={{ color: '#8a8378' }}>
              {c.tags.length ? c.tags.map((t) => t.name).join(', ') : 'No tags'}
              {c.google_resource_name ? ' · In Google' : ''}
              {c.subscribed ? ' · On updates' : ''}
            </span>
          </label>
        ))}
      </div>
      <div className="mt-3 flex justify-end gap-3">
        <button onClick={onSkip} className="text-sm font-semibold px-3 py-2 rounded-lg border" style={{ borderColor: '#d1d5db', color: '#8a8378' }}>
          Not the same
        </button>
        <button
          onClick={() => onMerge(keep, lose)}
          disabled={busy}
          className="text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-50"
          style={{ backgroundColor: 'var(--navy)', color: 'white' }}
        >
          {busy ? 'Merging…' : 'Merge'}
        </button>
      </div>
    </div>
  );
}
