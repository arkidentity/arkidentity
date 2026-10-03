'use client';

import { useEffect, useState } from 'react';
import { StudentLink } from '@/components/iowa/campus/StudentLink';

// The "Text <semester> check-in links" task (migration 038): each returning
// student in this person's groups, their answer, and a Text button with the
// message + their personal link filled in.

interface Person {
  contact_id: string;
  name: string;
  phone: string | null;
  group: string;
  url: string;
  response: 'yes' | 'no' | 'unsure' | null;
}

const ANSWER = { yes: ['In', '#15803d'], unsure: ['Not sure', '#b45309'], no: ['Not this time', '#8a8378'] } as const;

export function CheckinLinks({ ownerId }: { ownerId: string | null }) {
  const [data, setData] = useState<{ semester: string; people: Person[] } | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let live = true;
    fetch(`/api/iowa/admin/checkins${ownerId ? `?owner=${ownerId}` : ''}`)
      .then(async (r) => {
        const j = await r.json().catch(() => ({}));
        if (!live) return;
        if (r.ok) setData(j);
        else setError(j.error ?? 'Couldn’t load the list.');
      })
      .catch(() => live && setError('Couldn’t load the list.'));
    return () => {
      live = false;
    };
  }, [ownerId]);

  if (error) return <p className="text-xs text-red-700">{error}</p>;
  if (!data) return <p className="text-xs text-[#8a8378]">Loading…</p>;
  const waiting = data.people.filter((p) => !p.response).length;

  return (
    <div className="rounded-lg border border-gray-200 bg-[#FAF8F5] p-3">
      <p className="text-xs font-bold uppercase tracking-wide text-[#8a8378] mb-2">
        {data.semester} check-ins · {data.people.length - waiting} of {data.people.length} answered
      </p>
      <ul className="space-y-1.5">
        {data.people.map((p) => {
          const body = `Hey ${p.name.split(' ')[0]}! Are you in for ${data.semester}? Tap the times you're free so we can set your group: ${p.url}`;
          return (
            <li key={p.contact_id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span>
                <StudentLink contactId={p.contact_id} name={p.name} className="text-[#4a4540]" />
                <span className="text-xs text-[#8a8378]"> · {p.group}</span>
              </span>
              {p.response ? (
                <span className="text-xs font-semibold" style={{ color: ANSWER[p.response][1] }}>
                  {ANSWER[p.response][0]}
                </span>
              ) : p.phone ? (
                <a
                  href={`sms:${p.phone.replace(/[^\d+]/g, '')}?&body=${encodeURIComponent(body)}`}
                  className="text-xs px-2 py-0.5 rounded-md font-semibold border border-gray-300 bg-white"
                  style={{ color: 'var(--navy)' }}
                >
                  Text link
                </a>
              ) : (
                <button onClick={() => navigator.clipboard?.writeText(p.url)} className="text-xs underline text-[#8a8378]">
                  Copy link
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
