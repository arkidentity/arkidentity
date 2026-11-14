'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { CampusStudent, StudentStatus } from '@/lib/bibleStudies';
import { type CheckinRow, type SocialEventOption } from '@/lib/checkinFormat';
import type { DupeGroup } from '@/lib/studentDupes';
import { CheckinReport } from '@/components/iowa/CheckinReport';
import StudentPanel from '@/components/iowa/campus/StudentPanel';
import { Modal } from '@/components/iowa/campus/ui';

// Managing students as people rather than as roster lines. Every student here
// is also a contact in the main database — this view just adds the campus facts
// and the filters that only make sense on a campus.

const input = 'px-3 py-2 border border-gray-300 rounded-md text-base sm:text-sm text-gray-900 bg-white';

import { STATUS_COLOR, STATUS_LABEL, YEARS } from '@/components/iowa/studentStatus';

// Free text would sprawl the way tags do, so year is a fixed list.


interface StudyOption {
  id: string;
  day_of_week: number;
  start_time: string;
  location: string | null;
  activeCount: number;
  capacity: number;
}

type Placement = 'all' | 'placed' | 'unplaced';

export function CampusStudents({
  initial,
  semester,
  staff = [],
  report = null,
  events = [],
  openReport = false,
  initialSearch = '',
  dupes = [],
  startAdding = false,
}: {
  startAdding?: boolean; // ?add=1 (the + button's "A student")
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
  const [moreFilters, setMoreFilters] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [showReport, setShowReport] = useState(openReport);
  const [adding, setAdding] = useState(startAdding);
  const [f, setF] = useState({ name: '', phone: '', email: '', year: '', metBy: '' });

  // Moving a student refreshes the server data; pick it up (see EventDetail).
  useEffect(() => { setStudents(initial); }, [initial]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    // Needs a study first, then active, dormant, the rest — A–Z within each.
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
    unplaced: students.filter((s) => s.status === 'unplaced').length,
  }), [students]);

  return (
    <div style={{ background: '#FAF8F5', minHeight: '100vh' }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-24 sm:py-10">
        <div className="flex items-end justify-between gap-3 mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--navy)' }}>Students</h1>
            <p className="text-sm" style={{ color: '#8a8378' }}>
              {semester} ·{' '}
              {visible.length === counts.total ? `${counts.total} students` : `${visible.length} of ${counts.total}`}
            </p>
          </div>
          {report && (
            <button
              onClick={() => setShowReport(true)}
              className="shrink-0 px-4 min-h-11 rounded-lg font-semibold text-sm border bg-white"
              style={{ borderColor: '#d6cfc2', color: 'var(--navy)' }}
            >
              Check-ins{report.length > 0 && ` (${report.length})`}
            </button>
          )}
        </div>
        <button
          onClick={() => setAdding(true)}
          className="fixed z-40 right-4 px-5 min-h-12 rounded-full font-bold shadow-lg"
          style={{ background: '#E8B562', color: '#1a2b3c', bottom: 'calc(80px + env(safe-area-inset-bottom))' }}
        >
          + Add student
        </button>
        {showReport && report && (
          <CheckinReport
            initial={report}
            events={events}
            onClose={() => { setShowReport(false); router.refresh(); }}
          />
        )}
        {adding && (
          <Modal title="Add a student" sub="Phone is required so someone can text them." onClose={() => setAdding(false)}>
          {error && <p className="mb-3 text-sm" style={{ color: '#b91c1c' }}>{error}</p>}
          <div className="grid gap-2">
            <input className={input} autoComplete="off" placeholder="Name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
            <input className={input} type="tel" inputMode="tel" placeholder="Phone" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
            <input className={input} type="email" inputMode="email" placeholder="Email (optional)" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
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
            <div className="flex justify-end gap-2 mt-3">
              <button onClick={() => setAdding(false)} className="px-4 min-h-11 rounded-lg text-sm font-semibold text-[#8a8378]">
                Cancel
              </button>
              <button
                disabled={busy || !f.name.trim() || !f.phone.trim()}
                onClick={addStudent}
                className="px-5 min-h-11 rounded-lg text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: 'var(--navy)' }}
              >
                {busy ? 'Adding…' : 'Add student'}
              </button>
            </div>
          </div>
          </Modal>
        )}

        {/* Search, then status as chips; year and placement are rarer, under More. */}
        <input
          type="search"
          placeholder="Search name, email, phone"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`${input} w-full min-h-11 mb-2`}
        />
        <div className="flex gap-2 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 pb-1 mb-2">
          {([['', 'All'], ['unplaced', 'Needs a study'], ['active', 'Active'], ['dormant', 'Dormant'], ['elsewhere', 'Elsewhere']] as [StudentStatus | '', string][]).map(([k, label]) => (
            <button
              key={k || 'all'}
              onClick={() => setStatusFilter(k)}
              className="shrink-0 px-3 min-h-9 rounded-full text-sm font-semibold border"
              style={statusFilter === k ? { backgroundColor: 'var(--navy)', color: 'white', borderColor: 'var(--navy)' } : { backgroundColor: 'white', color: 'var(--navy)', borderColor: '#e7e2d9' }}
            >
              {label}
              {k === 'unplaced' && counts.unplaced > 0 ? ` (${counts.unplaced})` : ''}
            </button>
          ))}
          <button onClick={() => setMoreFilters((v) => !v)} className="shrink-0 px-3 min-h-9 text-sm font-semibold underline" style={{ color: 'var(--navy)' }}>
            {moreFilters ? 'Fewer' : 'More'}
          </button>
        </div>
        {moreFilters && (
          <div className="grid grid-cols-2 sm:flex gap-2 mb-2">
            <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} className={`${input} w-full sm:w-auto`}>
              <option value="">All years</option>
              {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StudentStatus | '')} className={`${input} w-full sm:w-auto`}>
              <option value="">All statuses</option>
              {(Object.keys(STATUS_LABEL) as StudentStatus[]).map((st) => (
                <option key={st} value={st}>{STATUS_LABEL[st]}</option>
              ))}
            </select>
            <select value={placement} onChange={(e) => setPlacement(e.target.value as Placement)} className={`${input} w-full sm:w-auto col-span-2`}>
              <option value="all">Placed or not</option>
              <option value="placed">In a study</option>
              <option value="unplaced">Not in a study</option>
            </select>
          </div>
        )}
        {filtered && (
          <button onClick={clearFilters} className="mb-3 text-sm font-semibold underline min-h-9" style={{ color: 'var(--navy)' }}>
            Clear filters
          </button>
        )}
        <div className="mb-3" />
        <Dupes groups={dupes} />

        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#FFFFFF', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          {/* One line per student; tap opens their panel (same one tasks use). */}
          <ul>
            {visible.map((s, i) => (
              <li key={s.contact_id} style={{ borderTop: i ? '1px solid #e8e3db' : 'none' }}>
                <button className="w-full text-left px-4 sm:px-5 py-3 flex items-center justify-between gap-3" onClick={() => setOpenId(s.contact_id)}>
                  <span className="min-w-0">
                    <span className="block font-semibold" style={{ color: 'var(--navy)' }}>{s.name}</span>
                    <span className="block text-sm truncate" style={{ color: '#8a8378' }}>
                      {s.studies.length ? s.studies.map((st) => st.label).join(', ') : s.year ?? (s.phone ? s.phone : 'No contact details')}
                    </span>
                  </span>
                  <span className="text-sm font-semibold shrink-0 text-right" style={{ color: STATUS_COLOR[s.status] }}>
                    {STATUS_LABEL[s.status]}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {openId && (
            <Modal title={students.find((x) => x.contact_id === openId)?.name ?? 'Student'} onClose={() => { setOpenId(null); router.refresh(); }}>
              <StudentPanel contactId={openId} staff={staff} />
            </Modal>
          )}

          {visible.length === 0 && (
            <p className="px-5 py-6 text-sm" style={{ color: '#8a8378' }}>
              {students.length === 0
                ? 'No students yet. Tap + Add student, or they appear once someone joins a Bible study.'
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
