'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { CampusStudent, StudentStatus } from '@/lib/bibleStudies';
import { DAY_NAMES, formatTime, slotLabel, sortSlots } from '@/lib/bibleStudyFormat';
import { DORMANT_REASONS, type CheckinRow, type SocialEventOption } from '@/lib/checkinFormat';
import type { DupeGroup } from '@/lib/studentDupes';
import { CheckinReport } from '@/components/iowa/CheckinReport';
import { StudentHistory } from '@/components/iowa/StudentHistory';

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
  staff = [],
  report = null,
  events = [],
  openReport = false,
  initialSearch = '',
  dupes = [],
}: {
  initial: CampusStudent[];
  studies: StudyOption[];
  semester: string;
  staff?: { id: string; name: string }[];
  report?: CheckinRow[] | null; // null = not staff/intern, no report
  events?: SocialEventOption[];
  initialSearch?: string; // ?q= — from a student card's "Open in Students"
  openReport?: boolean; // ?report=1 — from the dashboard's follow-up cards
  dupes?: DupeGroup[];
}) {
  const router = useRouter();
  const [students, setStudents] = useState(initial);
  const [search, setSearch] = useState(initialSearch);
  const [yearFilter, setYearFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<StudentStatus | ''>('');
  const [placement, setPlacement] = useState<Placement>('all');
  const [editing, setEditing] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState<string | null>(null);
  const [showReport, setShowReport] = useState(openReport);
  const [adding, setAdding] = useState(false);
  const [f, setF] = useState({ name: '', phone: '', email: '', year: '', metBy: '' });

  // Moving a student refreshes the server data; pick it up (see EventDetail).
  useEffect(() => { setStudents(initial); }, [initial]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const label = (s: StudyOption) =>
    `${DAY_NAMES[s.day_of_week]} ${formatTime(s.start_time)}${s.location ? ` · ${s.location}` : ''}`;

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    // Active first, then dormant, then everyone else — A–Z within each.
    const rank = (st: StudentStatus) => Object.keys(STATUS_LABEL).indexOf(st);
    return students
      .filter((s) => {
      if (yearFilter && s.year !== yearFilter) return false;
      if (statusFilter && s.status !== statusFilter) return false;
      if (placement === 'placed' && s.studies.length === 0) return false;
      if (placement === 'unplaced' && s.studies.length > 0) return false;
      if (!q) return true;
      return [s.name, s.email, s.phone].some((v) => v?.toLowerCase().includes(q));
    })
      .sort((a, b) => rank(a.status) - rank(b.status) || a.name.localeCompare(b.name));
  }, [students, search, yearFilter, statusFilter, placement]);

  // One endpoint for both records: campus facts land on campus_students, name /
  // phone / email on the contact itself — so a fix here is a fix everywhere.
  async function patchStudent(
    contactId: string,
    patch: {
      year?: string | null; status?: StudentStatus; name?: string; phone?: string | null; email?: string | null; metBy?: string;
      dormantReason?: string | null; dormantNote?: string | null;
    }
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
    const { metBy, dormantReason, dormantNote, ...rest } = patch;
    const dormant = {
      ...(dormantReason !== undefined && { dormant_reason: dormantReason || null }),
      ...(dormantNote !== undefined && { dormant_note: dormantNote || null }),
      ...(rest.status && rest.status !== 'dormant' && { dormant_reason: null, dormant_note: null }),
    };
    const met =
      metBy === undefined
        ? {}
        : ['friend', 'self', 'other'].includes(metBy)
          ? { met_by_staff_id: null, met_by_other: metBy as CampusStudent['met_by_other'] }
          : { met_by_staff_id: metBy || null, met_by_other: null };
    setStudents((list) => list.map((s) => (s.contact_id === contactId ? { ...s, ...rest, ...met, ...dormant } : s)));
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

  // A new student with no study yet. Phone is required, email is not.
  async function addStudent() {
    setBusy(true);
    setError('');
    const res = await fetch('/api/iowa/admin/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(f),
    });
    setBusy(false);
    if (!res.ok) {
      setError((await res.json().catch(() => ({}))).error || 'Could not add them.');
      return;
    }
    setF({ name: '', phone: '', email: '', year: '', metBy: '' });
    setAdding(false);
    router.refresh();
  }

  const filtered = !!(search.trim() || yearFilter || statusFilter || placement !== 'all');
  const clearFilters = () => { setSearch(''); setYearFilter(''); setStatusFilter(''); setPlacement('all'); };

  const counts = useMemo(() => ({
    total: students.length,
    unplaced: students.filter((s) => s.studies.length === 0 && s.status === 'active').length,
  }), [students]);

  return (
    <div style={{ background: '#FAF8F5', minHeight: '100vh' }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Title + count on the left, actions together on the right. On a phone the
            two buttons drop below and split the row so both are easy thumb targets. */}
        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3 mb-5">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: 'var(--navy)' }}>Students</h1>
            <p className="mt-1" style={{ color: '#8a8378' }}>
              {semester} ·{' '}
              {visible.length === counts.total ? `${counts.total} students` : `${visible.length} of ${counts.total} students`}
              {counts.unplaced > 0 && ` · ${counts.unplaced} active but not in a study`}
            </p>
          </div>
          <div className="flex w-full sm:w-auto gap-2">
            {report && (
              <button
                onClick={() => setShowReport(true)}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-lg font-semibold text-sm border"
                style={{ borderColor: 'var(--navy)', color: 'var(--navy)', backgroundColor: 'white' }}
              >
                Check-in report{report.length > 0 && ` (${report.length})`}
              </button>
            )}
            <button
              onClick={() => setAdding((v) => !v)}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-lg font-semibold text-sm"
              style={{ backgroundColor: 'var(--navy)', color: 'white' }}
            >
              {adding ? 'Close' : '+ Add student'}
            </button>
          </div>
        </div>
        {showReport && report && (
          <CheckinReport
            initial={report}
            events={events}
            onClose={() => { setShowReport(false); router.refresh(); }}
          />
        )}
        {adding && (
          <div className="rounded-xl border border-gray-200 bg-white p-4 mb-4 grid sm:grid-cols-2 gap-2">
            <input className={input} placeholder="Name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
            <input className={input} placeholder="Phone" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
            <input className={input} placeholder="Email (optional)" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
            <select className={input} value={f.year} onChange={(e) => setF({ ...f, year: e.target.value })}>
              <option value="">Year (optional)</option>
              {YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <select className={input} value={f.metBy} onChange={(e) => setF({ ...f, metBy: e.target.value })}>
              <option value="">Who met them? (optional)</option>
              {staff.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
              <option value="friend">A friend invited them</option>
              <option value="self">Found it on their own</option>
            </select>
            <div className="sm:col-span-2 flex gap-2">
              <button
                disabled={busy}
                onClick={addStudent}
                className="px-4 py-2 rounded-md text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: 'var(--navy)' }}
              >
                Add
              </button>
              <button onClick={() => setAdding(false)} className="px-4 py-2 rounded-md text-sm text-[#8a8378]">
                Cancel
              </button>
            </div>
          </div>
        )}
        {error && <p className="mb-4 text-sm" style={{ color: '#b91c1c' }}>{error}</p>}

        {/* Filters */}
        <div className="rounded-xl p-3 sm:p-4 mb-5 grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3" style={{ backgroundColor: '#FFFFFF', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <input
            type="search"
            placeholder="Search name, email, phone"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${input} col-span-2 sm:flex-1 sm:min-w-[200px]`}
          />
          <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} className={`${input} w-full sm:w-auto`}>
            <option value="">All years</option>
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StudentStatus | '')}
            className={`${input} w-full sm:w-auto`}
          >
            <option value="">All statuses</option>
            {(Object.keys(STATUS_LABEL) as StudentStatus[]).map((s) => (
              <option key={s} value={s}>{STATUS_LABEL[s]}</option>
            ))}
          </select>
          <select value={placement} onChange={(e) => setPlacement(e.target.value as Placement)} className={`${input} w-full sm:w-auto`}>
            <option value="all">Placed or not</option>
            <option value="placed">In a study</option>
            <option value="unplaced">Not in a study</option>
          </select>
          {filtered && (
            <button onClick={clearFilters} className="text-sm font-semibold underline whitespace-nowrap px-1" style={{ color: 'var(--navy)' }}>
              Clear filters
            </button>
          )}
        </div>

        <Dupes groups={dupes} />

        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#FFFFFF', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          {visible.map((s, i) => (
            <div
              key={s.contact_id}
              className="px-4 sm:px-5 py-4 border-b"
              // Alternate the shade so one student ends and the next begins at a glance.
              style={{ borderColor: '#e8e3db', backgroundColor: i % 2 === 0 ? '#FFFFFF' : '#F6F3EE' }}
            >
              {/* Phone: name + contact across the top, then the pickers two to a row.
                  Desktop: one line. */}
              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
                <div className="col-span-2 sm:flex-1 sm:min-w-[200px] min-w-0">
                  <p className="font-semibold" style={{ color: 'var(--navy)' }}>{s.name}</p>
                  {/* Both, always — the whole point of the contacts merge is not
                      having to go hunting for someone's email. Tappable to call/email. */}
                  <p className="text-sm break-words" style={{ color: '#8a8378' }}>
                    {!s.phone && !s.email && 'No contact details'}
                    {s.phone && (
                      <a href={`sms:${s.phone.replace(/[^\d+]/g, '')}`} title="Text" className="hover:underline" style={{ color: '#6b6459' }}>{s.phone}</a>
                    )}
                    {s.phone && s.email && ' · '}
                    {s.email && (
                      <a href={`mailto:${s.email}`} className="hover:underline" style={{ color: '#6b6459' }}>{s.email}</a>
                    )}
                  </p>
                  {s.free_slots.length > 0 && (
                    <p className="text-xs mt-0.5" style={{ color: '#8a8378' }}>
                      Free{s.free_slots_semester ? ` (${s.free_slots_semester})` : ''}: {sortSlots(s.free_slots).map(slotLabel).join(', ')}
                    </p>
                  )}
                </div>

                <select
                  value={s.year ?? ''}
                  onChange={(e) => patchStudent(s.contact_id, { year: e.target.value || null })}
                  disabled={busy}
                  className={`${input} w-full sm:w-auto`}
                >
                  <option value="">Year?</option>
                  {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>

                {/* Who met them. First answer comes from the signup form; fix it here. */}
                <select
                  value={s.met_by_staff_id ?? s.met_by_other ?? ''}
                  onChange={(e) => patchStudent(s.contact_id, { metBy: e.target.value })}
                  disabled={busy}
                  className={`${input} w-full sm:w-auto`}
                  title="Who did they meet?"
                >
                  <option value="">Met who?</option>
                  {staff.map((p) => (
                    <option key={p.id} value={p.id}>Met {p.name.split(' ')[0]}</option>
                  ))}
                  <option value="friend">Friend invited</option>
                  <option value="self">Found it on their own</option>
                  <option value="other">Other</option>
                </select>

                <select
                  value={s.status}
                  onChange={(e) => patchStudent(s.contact_id, { status: e.target.value as StudentStatus })}
                  disabled={busy}
                  className={`${input} w-full sm:w-auto`}
                  style={{ color: STATUS_COLOR[s.status], fontWeight: 600 }}
                >
                  {(Object.keys(STATUS_LABEL) as StudentStatus[]).map((st) => (
                    <option key={st} value={st}>{STATUS_LABEL[st]}</option>
                  ))}
                </select>

                <button
                  onClick={() => setEditing(editing === s.contact_id ? null : s.contact_id)}
                  className="w-full sm:w-auto text-sm font-semibold px-3 py-2 rounded-md border bg-white"
                  style={{ borderColor: '#d1d5db', color: 'var(--navy)' }}
                >
                  {editing === s.contact_id ? 'Close' : 'Edit'}
                </button>
              </div>

              {/* Dormant: say why, so whoever checks in later knows. */}
              {s.status === 'dormant' && (
                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                  <span style={{ color: '#9d855a' }}>Why dormant?</span>
                  <select
                    value={s.dormant_reason ?? ''}
                    onChange={(e) => patchStudent(s.contact_id, { dormantReason: e.target.value || null })}
                    disabled={busy}
                    className={`${input} w-full sm:w-auto`}
                  >
                    <option value="">— pick a reason —</option>
                    {DORMANT_REASONS.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
                  </select>
                  <input
                    key={s.dormant_note ?? ''}
                    defaultValue={s.dormant_note ?? ''}
                    onBlur={(e) => {
                      if (e.target.value !== (s.dormant_note ?? '')) patchStudent(s.contact_id, { dormantNote: e.target.value });
                    }}
                    placeholder="Note (optional)"
                    className={`${input} w-full sm:w-auto sm:flex-1 sm:min-w-[180px]`}
                  />
                </div>
              )}

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
              <div className="mt-3 pt-3 border-t flex items-start justify-between gap-3" style={{ borderColor: '#f0ede8' }}>
                <div className="min-w-0">
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
                        className={`${input} max-w-full`}
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
                {/* History is always one tap away: the chevron opens their timeline. */}
                <button
                  onClick={() => setHistoryOpen(historyOpen === s.contact_id ? null : s.contact_id)}
                  aria-expanded={historyOpen === s.contact_id}
                  className="shrink-0 flex items-center gap-1 text-sm font-semibold"
                  style={{ color: 'var(--navy)' }}
                >
                  History
                  <svg
                    width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5"
                    strokeLinecap="round" strokeLinejoin="round" aria-hidden
                    className={`transition-transform ${historyOpen === s.contact_id ? 'rotate-180' : ''}`}
                  >
                    <path d="M5 8l5 5 5-5" />
                  </svg>
                </button>
              </div>
              {historyOpen === s.contact_id && (
                <div className="mt-3 pt-3 border-t" style={{ borderColor: '#f0ede8' }}>
                  <StudentHistory contactId={s.contact_id} />
                </div>
              )}
            </div>
          ))}

          {visible.length === 0 && (
            <p className="px-5 py-6 text-sm" style={{ color: '#8a8378' }}>
              {students.length === 0
                ? 'No students yet. Add one above, or they appear once someone joins a Bible study.'
                : <>Nothing matches those filters. <button onClick={clearFilters} className="font-semibold underline" style={{ color: 'var(--navy)' }}>Clear filters</button></>}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Quiet by design: a line at the top of the list, not a modal. There's no merge
// yet, so it tells you what it sees and leaves the call to you.
function Dupes({ groups }: { groups: DupeGroup[] }) {
  const [open, setOpen] = useState(false);
  if (groups.length === 0) return null;

  return (
    <div className="rounded-xl p-4 mb-4" style={{ backgroundColor: '#fffbeb', border: '1px solid #fcd34d' }}>
      <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center justify-between gap-3 text-left">
        <span className="text-sm font-semibold" style={{ color: '#92400e' }}>
          {groups.length} possible duplicate{groups.length === 1 ? '' : 's'}
        </span>
        <span className="text-xs font-semibold" style={{ color: '#92400e' }}>{open ? 'Hide' : 'Show'}</span>
      </button>
      {open && (
        <div className="mt-3 space-y-3">
          {groups.map((g) => (
            <div key={g.students.map((s) => s.contact_id).join('-')} className="rounded-lg bg-white border border-amber-200 p-3">
              <p className="text-xs mb-2" style={{ color: '#92400e' }}>
                {g.reason === 'phone' ? 'Same phone number' : 'Same name, different contact details'}
              </p>
              <ul className="text-sm space-y-1">
                {g.students.map((s) => (
                  <li key={s.contact_id} className="text-[#4a4540]">
                    <span className="font-semibold" style={{ color: 'var(--navy)' }}>{s.name}</span>
                    {' · '}
                    {[s.email, s.phone, s.year].filter(Boolean).join(' · ') || 'no contact details'}
                    {s.studies.length > 0 && <span className="text-[#8a8378]"> · {s.studies.map((x) => x.label).join(', ')}</span>}
                    {s.studies.length === 0 && <span className="text-[#8a8378]"> · not in a study</span>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <p className="text-xs" style={{ color: '#92400e' }}>
            Same person? Move them into one study, drop the spare, and edit whichever record you&apos;re keeping.
            Merging isn&apos;t automatic yet — their history would need to move too.
          </p>
        </div>
      )}
    </div>
  );
}
