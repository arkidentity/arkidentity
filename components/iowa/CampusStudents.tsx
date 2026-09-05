'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { CampusStudent, StudentStatus } from '@/lib/bibleStudies';
import { DAY_NAMES, formatTime } from '@/lib/bibleStudyFormat';

// Managing students as people rather than as roster lines. Every student here
// is also a contact in the main database — this view just adds the campus facts
// and the filters that only make sense on a campus.

const input = 'px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white';

const STATUS_LABEL: Record<StudentStatus, string> = {
  active: 'Active',
  dormant: 'Dormant',
  graduated: 'Graduated',
  transferred: 'Transferred',
  left_school: 'Left school',
};

const STATUS_COLOR: Record<StudentStatus, string> = {
  active: '#15803d',
  dormant: '#9d855a',
  graduated: '#143348',
  transferred: '#2563eb',
  left_school: '#8a8378',
};

// Free text would sprawl the way tags do, so year is a fixed list.
const YEARS = ['first-year', 'sophomore', 'junior', 'senior', 'grad', 'other'];

interface StudyOption {
  id: string;
  day_of_week: number;
  start_time: string;
  location: string | null;
  activeCount: number;
  capacity: number;
}

type Placement = 'all' | 'placed' | 'unplaced';

function ContactFields({
  student,
  busy,
  onSave,
}: {
  student: CampusStudent;
  busy: boolean;
  onSave: (patch: { name: string; phone: string | null; email: string | null }) => Promise<void>;
}) {
  const [name, setName] = useState(student.name);
  const [phone, setPhone] = useState(student.phone ?? '');
  const [email, setEmail] = useState(student.email ?? '');

  return (
    <div className="mt-3 pt-3 border-t" style={{ borderColor: '#f0ede8' }}>
      <p className="text-xs mb-2" style={{ color: '#8a8378' }}>
        This is their contact record — changes here show up everywhere in the database.
      </p>
      <div className="grid sm:grid-cols-3 gap-3">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className={input} />
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" className={input} />
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className={input} />
      </div>
      <button
        onClick={() => onSave({ name, phone: phone || null, email: email || null })}
        disabled={busy || !name.trim()}
        className="mt-3 px-4 py-2 rounded-lg font-semibold text-sm disabled:opacity-50"
        style={{ backgroundColor: 'var(--navy)', color: 'white' }}
      >
        Save
      </button>
    </div>
  );
}

export function CampusStudents({
  initial,
  studies,
  semester,
}: {
  initial: CampusStudent[];
  studies: StudyOption[];
  semester: string;
}) {
  const router = useRouter();
  const [students, setStudents] = useState(initial);
  const [search, setSearch] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<StudentStatus | ''>('');
  const [placement, setPlacement] = useState<Placement>('all');
  const [editing, setEditing] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const label = (s: StudyOption) =>
    `${DAY_NAMES[s.day_of_week]} ${formatTime(s.start_time)}${s.location ? ` · ${s.location}` : ''}`;

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students.filter((s) => {
      if (yearFilter && s.year !== yearFilter) return false;
      if (statusFilter && s.status !== statusFilter) return false;
      if (placement === 'placed' && s.studies.length === 0) return false;
      if (placement === 'unplaced' && s.studies.length > 0) return false;
      if (!q) return true;
      return [s.name, s.email, s.phone].some((v) => v?.toLowerCase().includes(q));
    });
  }, [students, search, yearFilter, statusFilter, placement]);

  // One endpoint for both records: campus facts land on campus_students, name /
  // phone / email on the contact itself — so a fix here is a fix everywhere.
  async function patchStudent(
    contactId: string,
    patch: { year?: string | null; status?: StudentStatus; name?: string; phone?: string | null; email?: string | null }
  ) {
    setBusy(true);
    setError('');
    const res = await fetch(`/api/iowa/admin/students/${contactId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    setBusy(false);
    if (!res.ok) {
      setError((await res.json().catch(() => ({}))).error || 'Could not save.');
      return;
    }
    setStudents((list) => list.map((s) => (s.contact_id === contactId ? { ...s, ...patch } : s)));
  }

  // Moving keeps the same roster row, so joined_at and history survive.
  async function move(memberId: string, toStudyId: string) {
    setBusy(true);
    setError('');
    const res = await fetch(`/api/iowa/admin/members/${memberId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studyId: toStudyId }),
    });
    setBusy(false);
    if (!res.ok) {
      setError((await res.json().catch(() => ({}))).error || 'Could not move them.');
      return;
    }
    router.refresh();
  }

  const counts = useMemo(() => ({
    total: students.length,
    unplaced: students.filter((s) => s.studies.length === 0 && s.status === 'active').length,
  }), [students]);

  return (
    <div style={{ background: '#FAF8F5', minHeight: '100vh' }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
          <h1 className="text-3xl font-bold" style={{ color: 'var(--navy)' }}>Students</h1>
          <a href="/iowa/admin" className="text-sm font-semibold hover:underline" style={{ color: 'var(--navy)' }}>
            ← Bible studies
          </a>
        </div>
        <p className="mb-6" style={{ color: '#8a8378' }}>
          {semester} · {counts.total} students
          {counts.unplaced > 0 && ` · ${counts.unplaced} active but not in a study`}
        </p>

        {/* Filters */}
        <div className="rounded-xl p-4 mb-5 flex flex-wrap gap-3" style={{ backgroundColor: '#FFFFFF', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <input
            placeholder="Search name, email, phone"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${input} flex-1 min-w-[200px]`}
          />
          <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} className={input}>
            <option value="">All years</option>
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StudentStatus | '')}
            className={input}
          >
            <option value="">All statuses</option>
            {(Object.keys(STATUS_LABEL) as StudentStatus[]).map((s) => (
              <option key={s} value={s}>{STATUS_LABEL[s]}</option>
            ))}
          </select>
          <select value={placement} onChange={(e) => setPlacement(e.target.value as Placement)} className={input}>
            <option value="all">Placed or not</option>
            <option value="placed">In a study</option>
            <option value="unplaced">Not in a study</option>
          </select>
        </div>

        {error && <p className="mb-4 text-sm" style={{ color: '#b91c1c' }}>{error}</p>}

        <p className="text-sm mb-3" style={{ color: '#8a8378' }}>{visible.length} shown</p>

        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#FFFFFF', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          {visible.map((s) => (
            <div key={s.contact_id} className="px-5 py-4 border-b" style={{ borderColor: '#f0ede8' }}>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-[200px]">
                  <p className="font-semibold" style={{ color: 'var(--navy)' }}>{s.name}</p>
                  {/* Both, always — the whole point of the contacts merge is not
                      having to go hunting for someone's email. */}
                  <p className="text-sm" style={{ color: '#8a8378' }}>
                    {[s.phone, s.email].filter(Boolean).join(' · ') || 'No contact details'}
                  </p>
                </div>

                <select
                  value={s.year ?? ''}
                  onChange={(e) => patchStudent(s.contact_id, { year: e.target.value || null })}
                  disabled={busy}
                  className={input}
                >
                  <option value="">Year?</option>
                  {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>

                <select
                  value={s.status}
                  onChange={(e) => patchStudent(s.contact_id, { status: e.target.value as StudentStatus })}
                  disabled={busy}
                  className={input}
                  style={{ color: STATUS_COLOR[s.status], fontWeight: 600 }}
                >
                  {(Object.keys(STATUS_LABEL) as StudentStatus[]).map((st) => (
                    <option key={st} value={st}>{STATUS_LABEL[st]}</option>
                  ))}
                </select>

                <button
                  onClick={() => setEditing(editing === s.contact_id ? null : s.contact_id)}
                  className="text-sm font-semibold px-3 py-2 rounded-md border"
                  style={{ borderColor: '#d1d5db', color: 'var(--navy)' }}
                >
                  {editing === s.contact_id ? 'Close' : 'Edit'}
                </button>
              </div>

              {editing === s.contact_id && (
                <ContactFields
                  student={s}
                  busy={busy}
                  onSave={async (patch) => {
                    await patchStudent(s.contact_id, patch);
                    setEditing(null);
                  }}
                />
              )}

              {/* Placement */}
              <div className="mt-3 pt-3 border-t" style={{ borderColor: '#f0ede8' }}>
                {s.studies.length === 0 ? (
                  <p className="text-sm" style={{ color: '#9d855a' }}>Not in a study.</p>
                ) : (
                  s.studies.map((st) => (
                    <div key={st.member_id} className="flex flex-wrap items-center gap-2 text-sm mb-2">
                      <span style={{ color: '#4a4540' }}>{st.label}</span>
                      <span style={{ color: '#8a8378' }}>→ move to</span>
                      <select
                        defaultValue=""
                        disabled={busy}
                        onChange={(e) => { if (e.target.value) move(st.member_id, e.target.value); }}
                        className={input}
                      >
                        <option value="">— pick a study —</option>
                        {studies
                          .filter((o) => o.id !== st.id)
                          .map((o) => (
                            <option key={o.id} value={o.id}>
                              {label(o)} ({o.activeCount}/{o.capacity})
                            </option>
                          ))}
                      </select>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}

          {visible.length === 0 && (
            <p className="px-5 py-6 text-sm" style={{ color: '#8a8378' }}>
              {students.length === 0
                ? 'No students yet. They appear here once someone joins a Bible study.'
                : 'Nothing matches those filters.'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
