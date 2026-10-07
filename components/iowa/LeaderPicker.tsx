'use client';

import { useEffect, useRef, useState } from 'react';

// Study leader: search people already in the system (students + staff) and tap one.
// Fills name / phone / email; "Type it in" keeps the old fields for someone who isn't in yet.

type Person = { key: string; name: string; phone: string | null; email: string | null; kind: string };
type Leader = { leader_name: string; leader_phone: string; leader_email: string };

const input = 'w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white';

export function LeaderPicker({ value, onChange }: { value: Leader; onChange: (v: Leader) => void }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Person[]>([]);
  const [open, setOpen] = useState(false);
  const [manual, setManual] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (q.trim().length < 2) return;
    timer.current = setTimeout(async () => {
      const res = await fetch(`/api/iowa/admin/people?q=${encodeURIComponent(q.trim())}`);
      const body = await res.json().catch(() => ({ people: [] }));
      setResults(body.people ?? []);
      setOpen(true);
    }, 250);
  }, [q]);

  const pick = (p: Person) => {
    onChange({ leader_name: p.name, leader_phone: p.phone ?? '', leader_email: p.email ?? '' });
    setQ(''); setResults([]); setOpen(false);
  };
  const clear = () => onChange({ leader_name: '', leader_phone: '', leader_email: '' });

  if (manual) {
    return (
      <div className="space-y-2">
        <input className={input} placeholder="Name" value={value.leader_name} onChange={(e) => onChange({ ...value, leader_name: e.target.value })} />
        <input className={input} placeholder="Phone" value={value.leader_phone} onChange={(e) => onChange({ ...value, leader_phone: e.target.value })} />
        <input className={input} placeholder="Email" value={value.leader_email} onChange={(e) => onChange({ ...value, leader_email: e.target.value })} />
        <button type="button" onClick={() => setManual(false)} className="text-sm font-semibold" style={{ color: 'var(--navy)' }}>Search instead</button>
      </div>
    );
  }

  return (
    <div className="relative">
      {value.leader_name ? (
        <div className="flex items-center justify-between gap-2 px-3 py-2 border border-gray-300 rounded-md bg-white text-sm text-gray-900">
          <span className="min-w-0 truncate">
            <strong>✓ {value.leader_name}</strong>
            <span className="text-gray-500">{value.leader_phone ? ` · ${value.leader_phone}` : ''}{value.leader_email ? ` · ${value.leader_email}` : ''}</span>
          </span>
          <button type="button" onClick={clear} className="shrink-0 text-gray-500 font-semibold">Change</button>
        </div>
      ) : (
        <input className={input} placeholder="Search students or staff" value={q}
          onChange={(e) => setQ(e.target.value)} onFocus={() => results.length && setOpen(true)} />
      )}
      {open && !value.leader_name && q.trim().length >= 2 && (
        <div className="absolute z-20 mt-1 w-full max-h-64 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg">
          {results.length === 0 && <p className="px-3 py-2 text-sm text-gray-500">No one by that name.</p>}
          {results.map((p) => (
            <button key={p.key} type="button" onClick={() => pick(p)} className="w-full text-left px-3 py-2 text-sm text-gray-900 hover:bg-[#FAF8F5]">
              <strong>{p.name}</strong> <span className="text-gray-500">· {p.kind}{p.phone ? ` · ${p.phone}` : ''}</span>
            </button>
          ))}
        </div>
      )}
      {!value.leader_name && (
        <button type="button" onClick={() => setManual(true)} className="mt-1 text-xs font-semibold text-gray-500">Not in the system? Type it in</button>
      )}
    </div>
  );
}
