'use client';

import { useEffect, useState } from 'react';
import { StudentHistory } from '@/components/iowa/StudentHistory';
import { ContactButtons } from '@/components/iowa/campus/ui';
import { slotLabel, sortSlots } from '@/lib/bibleStudyFormat';

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

const STATUS: Record<string, { label: string; color: string }> = {
  active: { label: 'Active', color: '#15803d' },
  dormant: { label: 'Dormant', color: '#9d855a' },
  graduated: { label: 'Graduated', color: '#143348' },
  transferred: { label: 'Transferred', color: '#2563eb' },
  left_school: { label: 'Left school', color: '#8a8378' },
};

export function StudentLink({ contactId, name, className }: { contactId: string | null; name: string; className?: string }) {
  const [open, setOpen] = useState(false);
  if (!contactId) return <span className={className}>{name}</span>;
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

  const status = card ? STATUS[card.status] : undefined;

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
        <div className="flex items-start justify-between gap-3 mb-1">
          <h3 className="text-lg font-bold" style={{ color: 'var(--navy)' }}>
            {card?.name ?? fallbackName}
          </h3>
          <button onClick={onClose} className="text-[#8a8378] text-xl leading-none" aria-label="Close">
            ×
          </button>
        </div>

        {error && <p className="text-sm text-red-700">{error}</p>}
        {!card && !error && <p className="text-sm text-[#8a8378]">Loading…</p>}

        {card && (
          <div className="space-y-4">
            <p className="text-sm text-[#8a8378]">
              {status && <span className="font-semibold" style={{ color: status.color }}>{status.label}</span>}
              {card.year ? ` · ${card.year}` : ''}
            </p>
            {(card.phone || card.email) && (
              <div className="space-y-2">
                <ContactButtons phone={card.phone} email={card.email} />
                <p className="text-sm text-[#6b6459] break-words">{[card.phone, card.email].filter(Boolean).join(' · ')}</p>
              </div>
            )}

            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-[#8a8378] mb-1">Bible studies</p>
              {card.studies.length === 0 ? (
                <p className="text-sm text-[#8a8378]">Not in a study right now.</p>
              ) : (
                <ul className="text-sm text-[#4a4540] space-y-0.5">
                  {card.studies.map((s) => (
                    <li key={s.id}>{s.label}</li>
                  ))}
                </ul>
              )}
            </div>

            {(card.free_slots?.length ?? 0) > 0 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-[#8a8378] mb-1">Free{card.free_slots_semester ? ` for ${card.free_slots_semester}` : ''} (from signup)</p>
                <p className="text-sm text-[#4a4540]">{sortSlots(card.free_slots!).map(slotLabel).join(', ')}</p>
              </div>
            )}

            {card.notes && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-[#8a8378] mb-1">Notes</p>
                <p className="text-sm text-[#4a4540] whitespace-pre-wrap">{card.notes}</p>
              </div>
            )}

            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-[#8a8378] mb-2">History</p>
              <StudentHistory contactId={card.contact_id} compact />
            </div>

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
