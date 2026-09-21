'use client';

import { useEffect, useState } from 'react';

// "Who did you meet?" on the public signup forms. Optional. Value is a staff
// id, 'friend', 'self', 'other', or '' (skipped) — see parseMetBy().
export default function MetByPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [staff, setStaff] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    let live = true;
    fetch('/api/iowa/met-by')
      .then((r) => r.json())
      .then((d) => live && setStaff(d.staff ?? []))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  const choices = [
    ...staff.map((s) => ({ value: s.id, label: s.name })),
    { value: 'friend', label: 'A friend invited me' },
    { value: 'self', label: 'Found it on my own' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <div>
      <span className="block text-sm font-semibold mb-2" style={{ color: 'var(--navy)' }}>
        Who did you meet? <span className="font-normal text-[#8a8378]">(optional)</span>
      </span>
      <div className="flex flex-wrap gap-2">
        {choices.map((c) => (
          <button
            key={c.value}
            type="button"
            onClick={() => onChange(value === c.value ? '' : c.value)}
            className="px-3 py-1.5 rounded-md text-sm font-semibold transition"
            style={{
              backgroundColor: value === c.value ? 'var(--gold)' : '#f1ede7',
              color: value === c.value ? 'var(--navy)' : '#8a8378',
              border: value === c.value ? '1px solid var(--gold)' : '1px solid #e2ddd5',
            }}
          >
            {c.label}
          </button>
        ))}
      </div>
    </div>
  );
}
