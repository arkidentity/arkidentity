'use client';

import { useEffect, useState } from 'react';
import StudentPanel from '@/components/iowa/campus/StudentPanel';
import { useCan } from '@/components/iowa/campus/ui';

// A student's name, anywhere in the admin, that opens their card: Text/Email,
// year + status, the studies they're in, notes, and their full history. A
// popup over whatever you were doing — not a trip to the Students tab.

interface Card {
  contact_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  year: string | null;
  status: string;
  notes: string | null;
  studies: { id: string; label: string }[];
  free_slots?: string[];
  free_slots_semester?: string | null;
}


export function StudentLink({ contactId, name, className }: { contactId: string | null; name: string; className?: string }) {
  const [open, setOpen] = useState(false);
  // The card comes from the student directory (staff + interns); a student
  // leader just sees the name, not a link that would answer "not allowed".
  const seesProfiles = useCan()('viewStudents');
  if (!contactId || !seesProfiles) return <span className={className}>{name}</span>;
  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        className={`text-left underline decoration-dotted underline-offset-2 hover:decoration-solid ${className ?? ''}`}
      >
        {name}
      </button>
      {open && <StudentCard contactId={contactId} fallbackName={name} onClose={() => setOpen(false)} />}
    </>
  );
}

function StudentCard({ contactId, fallbackName, onClose }: { contactId: string; fallbackName: string; onClose: () => void }) {
  const [card, setCard] = useState<Card | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let live = true;
    fetch(`/api/iowa/admin/students/${contactId}`)
      .then(async (r) => {
        const j = await r.json().catch(() => ({}));
        if (!live) return;
        if (!r.ok) setError(r.status === 403 ? 'Student profiles aren’t open to your login.' : j.error ?? 'Couldn’t load.');
        else setCard(j.student);
      })
      .catch(() => live && setError('Couldn’t load.'));
    return () => {
      live = false;
    };
  }, [contactId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start sm:items-center justify-center bg-black/30 p-4 pt-12 sm:pt-4"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <div
        className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-xl bg-white shadow-xl p-5 text-left"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={card?.name ?? fallbackName}
      >
        <div className="flex justify-end -mb-2">
          <button onClick={onClose} className="text-[#8a8378] text-xl leading-none" aria-label="Close">
            ×
          </button>
        </div>

        {error && <p className="text-sm text-red-700">{error}</p>}
        {!card && !error && <p className="text-sm text-[#8a8378]">Loading…</p>}

        {card && (
          <div className="space-y-4">
            <StudentPanel contactId={card.contact_id} fallbackName={card.name} />
            <CheckinLinkButton contactId={card.contact_id} />

            <a href={`/iowa/admin/students?q=${encodeURIComponent(card.name)}`} className="inline-block text-sm font-semibold" style={{ color: 'var(--navy)' }}>
              Open in Students →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

// Copy a next-semester check-in link for this student (migration 038) — for
// anyone the automatic send skips (dormant, never placed).
function CheckinLinkButton({ contactId }: { contactId: string }) {
  const [msg, setMsg] = useState('');
  return (
    <div>
      <button
        onClick={async () => {
          const r = await fetch('/api/iowa/admin/checkins', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contactId }),
          });
          const j = await r.json().catch(() => ({}));
          if (!r.ok) return setMsg(j.error ?? 'Couldn’t make a link.');
          await navigator.clipboard?.writeText(j.url).catch(() => {});
          setMsg(`Copied their ${j.semester} check-in link: ${j.url}`);
        }}
        className="text-sm font-semibold underline"
        style={{ color: 'var(--navy)' }}
      >
        Copy next-semester check-in link
      </button>
      {msg && <p className="text-xs text-[#8a8378] mt-1 break-all">{msg}</p>}
    </div>
  );
}
