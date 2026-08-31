import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { findOrCreateContact, ensureTag } from '@/lib/contacts';
// Re-exported below for callers, but also needed locally.
import { DAY_NAMES as DAYS, formatTime as fmtTime } from '@/lib/bibleStudyFormat';

// Data layer for the ARK Iowa Bible Study system. Server-only — every function
// here uses the service-role client and must be called from a route handler or
// server component, never the browser. See docs/IOWA-BIBLE-STUDY-SYSTEM.md.
// Pure formatting helpers live in bibleStudyFormat.ts and are re-exported here.

export { blockOf, formatTime, formatSlot, DAY_NAMES } from '@/lib/bibleStudyFormat';
export type { TimeBlock } from '@/lib/bibleStudyFormat';

export const CURRENT_SEMESTER = process.env.IOWA_SEMESTER || 'Fall 2026';

export type StudyStatus =
  | 'pending_setup' | 'forming' | 'full' | 'activated' | 'paused' | 'ended';
export type MemberStatus = 'active' | 'dropped';
// Where a student sits in the ministry's life cycle. Whether they're currently
// in a study is NOT here — that's derived from an active seat, so the two can't
// disagree. This covers only what the roster can't tell you.
export type StudentStatus = 'active' | 'dormant' | 'graduated' | 'transferred' | 'left_school';
export type PulseStatus = 'green' | 'yellow' | 'red';

export interface BibleStudy {
  id: string;
  semester: string;
  day_of_week: number;
  start_time: string; // 'HH:MM:SS'
  location: string | null;
  capacity: number;
  status: StudyStatus;
  accepting_signups: boolean;
  leader_name: string | null;
  leader_phone: string | null;
  leader_email: string | null;
  notes: string | null;
  break_plan: string | null;
  parent_study_id: string | null;
  pulse_status: PulseStatus | null;
  pulse_note: string | null;
  pulse_at: string | null;
  activated_at: string | null;
  created_at: string;
}

// A seat in a study. The person's name/phone/email live on their contact row
// (migration 007) and are flattened in here on read, so the Iowa UI sees the
// same shape it always did.
export interface StudyMember {
  id: string;
  study_id: string;
  contact_id: string;
  name: string;
  phone: string;
  email: string;
  year: string | null;            // from campus_students, not the seat
  student_status: StudentStatus;
  status: MemberStatus;
  source: string | null;
  notes: string | null;
  joined_at: string;
  left_at: string | null;
}

export interface StudyWithMembers extends BibleStudy {
  members: StudyMember[];
  activeCount: number;
}

// What a student is allowed to see before they join: no member PII, just counts.
export interface PublicStudy {
  id: string;
  day_of_week: number;
  start_time: string;
  location: string | null;
  capacity: number;
  status: StudyStatus;
  spotsLeft: number;
  leader_name: string | null;
}

// Renamed from `Contact` in migration 007 — that name now belongs to a person
// in the contacts table. This is just what a joining student is shown.
export interface RosterContact {
  name: string;
  phone: string;
  role: 'leader' | 'member';
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Every member read joins the contact and flattens it, so callers keep seeing
// name/phone/email directly on the member.
const MEMBER_SELECT = '*, contacts(name, phone, email)';

type MemberRow = Omit<StudyMember, 'name' | 'phone' | 'email' | 'year' | 'student_status'> & {
  contacts: { name: string; phone: string | null; email: string | null } | null;
};

function flattenMember(row: MemberRow): StudyMember {
  const { contacts, ...seat } = row;
  return {
    ...seat,
    name: contacts?.name ?? '(deleted contact)',
    phone: contacts?.phone ?? '',
    email: contacts?.email ?? '',
    year: null,
    student_status: 'active',
  };
}

// Year and life-cycle status come from campus_students, fetched in one extra
// query and merged. A separate round trip rather than a nested embed so what
// comes back has an obvious shape.
async function withCampus(members: StudyMember[]): Promise<StudyMember[]> {
  if (members.length === 0) return members;
  const { data, error } = await getSupabaseAdmin()
    .from('campus_students')
    .select('contact_id, year, status')
    .in('contact_id', members.map((m) => m.contact_id));
  if (error) throw error;

  const byContact = new Map<string, { year: string | null; status: StudentStatus }>();
  for (const r of (data ?? []) as { contact_id: string; year: string | null; status: StudentStatus }[]) {
    byContact.set(r.contact_id, { year: r.year, status: r.status });
  }
  return members.map((m) => {
    const campus = byContact.get(m.contact_id);
    return campus ? { ...m, year: campus.year, student_status: campus.status } : m;
  });
}

function spotsLeft(capacity: number, activeCount: number): number {
  return Math.max(0, capacity - activeCount);
}

// A study a student can browse to and join: has room, is accepting, and its
// status is one that takes signups. `pending_setup`, `full`, `paused`, `ended`
// never show.
export function isListable(study: BibleStudy, activeCount: number): boolean {
  if (!study.accepting_signups) return false;
  if (study.status !== 'forming' && study.status !== 'activated') return false;
  if (!study.location) return false;
  return spotsLeft(study.capacity, activeCount) > 0;
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

async function membersBySemester(semester: string): Promise<Map<string, StudyMember[]>> {
  const db = getSupabaseAdmin();
  const { data: studies, error: sErr } = await db
    .from('bible_studies')
    .select('id')
    .eq('semester', semester);
  if (sErr) throw sErr;
  const ids = (studies ?? []).map((s) => s.id);
  const byStudy = new Map<string, StudyMember[]>();
  if (ids.length === 0) return byStudy;

  const { data: members, error: mErr } = await db
    .from('bible_study_members')
    .select(MEMBER_SELECT)
    .in('study_id', ids)
    .order('joined_at', { ascending: true });
  if (mErr) throw mErr;
  const flat = await withCampus(((members ?? []) as unknown as MemberRow[]).map(flattenMember));
  for (const m of flat) {
    const list = byStudy.get(m.study_id) ?? [];
    list.push(m);
    byStudy.set(m.study_id, list);
  }
  return byStudy;
}

// Full admin view: every study in the semester with its roster attached.
export async function listStudies(semester = CURRENT_SEMESTER): Promise<StudyWithMembers[]> {
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from('bible_studies')
    .select('*')
    .eq('semester', semester)
    .order('day_of_week', { ascending: true })
    .order('start_time', { ascending: true });
  if (error) throw error;

  const byStudy = await membersBySemester(semester);
  return (data ?? []).map((s) => {
    const members = byStudy.get(s.id) ?? [];
    return {
      ...(s as BibleStudy),
      members,
      activeCount: members.filter((m) => m.status === 'active').length,
    };
  });
}

// Headline numbers for the landing page. Only real, current counts — callers
// should hide the line when `running` is 0 rather than show a zero.
export async function studyCounts(
  semester = CURRENT_SEMESTER
): Promise<{ running: number; open: number }> {
  const all = await listStudies(semester);
  return {
    running: all.filter(
      (s) => s.status === 'forming' || s.status === 'full' || s.status === 'activated'
    ).length,
    open: all.filter((s) => isListable(s, s.activeCount)).length,
  };
}

// Student browser: only studies with an open seat, no PII.
export async function listListableStudies(semester = CURRENT_SEMESTER): Promise<PublicStudy[]> {
  const all = await listStudies(semester);
  return all
    .filter((s) => isListable(s, s.activeCount))
    .map((s) => ({
      id: s.id,
      day_of_week: s.day_of_week,
      start_time: s.start_time,
      location: s.location,
      capacity: s.capacity,
      status: s.status,
      spotsLeft: spotsLeft(s.capacity, s.activeCount),
      leader_name: s.leader_name,
    }));
}

export async function getStudyWithMembers(id: string): Promise<StudyWithMembers | null> {
  const db = getSupabaseAdmin();
  const { data: study, error } = await db
    .from('bible_studies')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!study) return null;

  const { data: members, error: mErr } = await db
    .from('bible_study_members')
    .select(MEMBER_SELECT)
    .eq('study_id', id)
    .order('joined_at', { ascending: true });
  if (mErr) throw mErr;

  const list = await withCampus(((members ?? []) as unknown as MemberRow[]).map(flattenMember));
  return {
    ...(study as BibleStudy),
    members: list,
    activeCount: list.filter((m) => m.status === 'active').length,
  };
}

// Single study for the public per-study card. Returns null if it isn't a study
// a student should see (still pending setup, ended, etc.) unless it simply has
// no open seats — a full-but-real study still renders, just without a join.
export async function getPublicStudy(id: string): Promise<PublicStudy | null> {
  const s = await getStudyWithMembers(id);
  if (!s) return null;
  if (s.status === 'pending_setup' || s.status === 'ended' || !s.location) return null;
  return {
    id: s.id,
    day_of_week: s.day_of_week,
    start_time: s.start_time,
    location: s.location,
    capacity: s.capacity,
    status: s.status,
    spotsLeft: spotsLeft(s.capacity, s.activeCount),
    leader_name: s.leader_name,
  };
}

// Other studies where this person already holds an active seat — used to flag
// the admin alert on a new join, not to block it. Keyed on the contact now that
// the seat no longer stores a phone of its own.
export async function otherActiveStudiesForContact(
  contactId: string,
  exceptStudyId: string
): Promise<BibleStudy[]> {
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from('bible_study_members')
    .select('study_id, bible_studies(*)')
    .eq('status', 'active')
    .eq('contact_id', contactId)
    .neq('study_id', exceptStudyId);
  if (error) throw error;
  return (data ?? [])
    .map((r) => (r as unknown as { bible_studies: BibleStudy }).bible_studies)
    .filter(Boolean);
}

// ---------------------------------------------------------------------------
// Writes — student-facing
// ---------------------------------------------------------------------------

export interface JoinInput {
  studyId: string;
  name: string;
  phone: string;
  email: string;
  year?: string | null;
}

export interface JoinResult {
  study: StudyWithMembers;
  member: StudyMember;
  roster: RosterContact[];
  alsoInOtherStudies: BibleStudy[];
}

export async function joinStudy(input: JoinInput): Promise<JoinResult> {
  const db = getSupabaseAdmin();
  const study = await getStudyWithMembers(input.studyId);
  if (!study) throw new Error('That study no longer exists.');
  if (!isListable(study, study.activeCount)) {
    throw new Error('That study just filled — pick another open time or start one.');
  }
  const contact = await contactForStudent(input);
  if (study.members.some((m) => m.status === 'active' && m.contact_id === contact.id)) {
    throw new Error("You're already on that study's roster.");
  }

  const { data: member, error } = await db
    .from('bible_study_members')
    .insert({
      study_id: input.studyId,
      contact_id: contact.id,
    })
    .select(MEMBER_SELECT)
    .single();
  if (error) {
    // unique partial index → someone took the last seat / same person raced in
    if (error.code === '23505') {
      throw new Error('That study just filled — pick another open time or start one.');
    }
    throw error;
  }

  const fresh = (await getStudyWithMembers(input.studyId))!;
  // If four are now active and it was still forming, move it to full.
  if (fresh.status === 'forming' && fresh.activeCount >= fresh.capacity) {
    await db.from('bible_studies').update({ status: 'full' }).eq('id', input.studyId);
    fresh.status = 'full';
  }

  const seat = flattenMember(member as unknown as MemberRow);
  const roster = rosterContacts(fresh, seat.id);
  const alsoInOtherStudies = await otherActiveStudiesForContact(contact.id, input.studyId);
  return { study: fresh, member: seat, roster, alsoInOtherStudies };
}

// A student signing up for a Bible study becomes a contact, tagged ARK Iowa so
// they show up in campus segments. Subscribed is left OFF: they signed up for a
// study, not the newsletter — the one intake that doesn't default on.
async function contactForStudent(input: {
  name: string;
  phone: string;
  email: string;
  year?: string | null;
}) {
  const tag = await ensureTag('ARK Iowa', 'role');
  const contact = await findOrCreateContact({
    name: input.name,
    email: input.email,
    phone: input.phone,
    source: 'ARK Iowa Bible study',
    subscribed: false,
    tagIds: [tag.id],
  });
  await ensureCampusStudent(contact.id, input.year);
  return contact;
}

// Every student on a roster has a campus_students row. Year is only written
// when we're told one — a blank on a later signup must not erase what's there.
export async function ensureCampusStudent(
  contactId: string,
  year?: string | null
): Promise<void> {
  const db = getSupabaseAdmin();
  const { data: existing } = await db
    .from('campus_students')
    .select('contact_id, year')
    .eq('contact_id', contactId)
    .maybeSingle();

  const trimmed = year?.trim() || null;
  if (!existing) {
    const { error } = await db.from('campus_students').insert({ contact_id: contactId, year: trimmed });
    if (error) throw error;
    return;
  }
  if (trimmed && !existing.year) {
    await db
      .from('campus_students')
      .update({ year: trimmed, updated_at: new Date().toISOString() })
      .eq('contact_id', contactId);
  }
}

// Contacts a joining student is shown: the leader plus the other active members
// (optionally excluding one member id — the person who just joined).
export function rosterContacts(study: StudyWithMembers, excludeMemberId?: string): RosterContact[] {
  const contacts: RosterContact[] = [];
  if (study.leader_name && study.leader_phone) {
    contacts.push({ name: study.leader_name, phone: study.leader_phone, role: 'leader' });
  }
  for (const m of study.members) {
    if (m.status !== 'active' || m.id === excludeMemberId) continue;
    contacts.push({ name: m.name, phone: m.phone, role: 'member' });
  }
  return contacts;
}

export interface StartInput {
  day_of_week: number;
  start_time: string; // 'HH:MM'
  name: string;
  phone: string;
  email: string;
  year?: string | null;
  semester?: string;
}

export async function startStudy(
  input: StartInput
): Promise<{ study: BibleStudy; member: StudyMember }> {
  const db = getSupabaseAdmin();
  const { data: study, error } = await db
    .from('bible_studies')
    .insert({
      semester: input.semester || CURRENT_SEMESTER,
      day_of_week: input.day_of_week,
      start_time: input.start_time,
      status: 'pending_setup',
      location: null,
    })
    .select('*')
    .single();
  if (error) throw error;

  const contact = await contactForStudent(input);
  const { data: member, error: mErr } = await db
    .from('bible_study_members')
    .insert({
      study_id: study.id,
      contact_id: contact.id,
    })
    .select(MEMBER_SELECT)
    .single();
  if (mErr) throw mErr;

  return { study: study as BibleStudy, member: flattenMember(member as unknown as MemberRow) };
}

// ---------------------------------------------------------------------------
// Writes — admin
// ---------------------------------------------------------------------------

export interface CreateStudyInput {
  day_of_week: number;
  start_time: string;
  location: string;
  capacity?: number;
  leader_name?: string;
  leader_phone?: string;
  leader_email?: string;
  notes?: string;
  semester?: string;
  // When the leader is one of the four students (not Travis facilitating),
  // also seat them on the roster so the count is right.
  addLeaderAsMember?: boolean;
}

export async function createStudy(input: CreateStudyInput): Promise<BibleStudy> {
  const db = getSupabaseAdmin();
  const leaderName = input.leader_name?.trim() || null;
  const leaderPhone = input.leader_phone?.trim() || null;
  const leaderEmail = input.leader_email?.trim() || null;

  const { data, error } = await db
    .from('bible_studies')
    .insert({
      semester: input.semester || CURRENT_SEMESTER,
      day_of_week: input.day_of_week,
      start_time: input.start_time,
      location: input.location.trim(),
      capacity: input.capacity ?? 4,
      status: 'forming',
      leader_name: leaderName,
      leader_phone: leaderPhone,
      leader_email: leaderEmail,
      notes: input.notes?.trim() || null,
    })
    .select('*')
    .single();
  if (error) throw error;
  const study = data as BibleStudy;

  if (input.addLeaderAsMember && leaderName && leaderPhone && leaderEmail) {
    await addMember(study.id, { name: leaderName, phone: leaderPhone, email: leaderEmail });
  }
  return study;
}

const EDITABLE_FIELDS = [
  'day_of_week', 'start_time', 'location', 'capacity', 'status', 'accepting_signups',
  'leader_name', 'leader_phone', 'leader_email', 'notes', 'break_plan',
] as const;

export async function updateStudy(
  id: string,
  patch: Partial<Record<(typeof EDITABLE_FIELDS)[number], unknown>>
): Promise<BibleStudy> {
  const db = getSupabaseAdmin();
  const current = await db.from('bible_studies').select('*').eq('id', id).maybeSingle();
  if (current.error) throw current.error;
  if (!current.data) throw new Error('Study not found.');
  const before = current.data as BibleStudy;

  const update: Record<string, unknown> = {};
  for (const key of EDITABLE_FIELDS) {
    if (key in patch) update[key] = patch[key];
  }

  // Leaving pending_setup requires a real location.
  const nextStatus = (update.status as StudyStatus) ?? before.status;
  const nextLocation = (update.location as string | null) ?? before.location;
  if (before.status === 'pending_setup' && nextStatus !== 'pending_setup' && !nextLocation?.trim()) {
    throw new Error('Set a location before taking this study out of pending setup.');
  }
  if (update.status === 'activated' && !before.activated_at) {
    update.activated_at = new Date().toISOString();
  }
  if (typeof update.location === 'string') update.location = update.location.trim() || null;

  const { data, error } = await db
    .from('bible_studies')
    .update(update)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data as BibleStudy;
}

export interface AddMemberInput {
  name: string;
  phone: string;
  email: string;
  year?: string;
  source?: string;
  notes?: string;
}

export async function addMember(studyId: string, input: AddMemberInput): Promise<StudyMember> {
  const db = getSupabaseAdmin();
  const contact = await contactForStudent(input);
  const { data, error } = await db
    .from('bible_study_members')
    .insert({
      study_id: studyId,
      contact_id: contact.id,
      source: input.source?.trim() || null,
      notes: input.notes?.trim() || null,
    })
    .select(MEMBER_SELECT)
    .single();
  if (error) {
    if (error.code === '23505') throw new Error('They already hold an active seat here.');
    throw error;
  }
  return flattenMember(data as unknown as MemberRow);
}

// Move a student from one study to another. A move, not a delete-and-re-add:
// the seat keeps its id and its joined_at, so the roster history stays honest
// and nobody has to be re-entered. Capacity on the destination is enforced the
// same way a fresh join is.
export async function moveMember(memberId: string, toStudyId: string): Promise<StudyMember> {
  const db = getSupabaseAdmin();
  const { data: seat, error: seatErr } = await db
    .from('bible_study_members')
    .select('id, study_id, contact_id, status')
    .eq('id', memberId)
    .maybeSingle();
  if (seatErr) throw seatErr;
  if (!seat) throw new Error('That roster spot no longer exists.');
  if (seat.study_id === toStudyId) throw new Error('They are already in that study.');

  const target = await getStudyWithMembers(toStudyId);
  if (!target) throw new Error('That study no longer exists.');
  if (target.members.some((m) => m.status === 'active' && m.contact_id === seat.contact_id)) {
    throw new Error('They already hold a seat in that study.');
  }
  if (seat.status === 'active' && target.activeCount >= target.capacity) {
    throw new Error(`${formatSlotOf(target)} is full — drop someone there first, or raise its capacity.`);
  }

  const { data, error } = await db
    .from('bible_study_members')
    .update({ study_id: toStudyId })
    .eq('id', memberId)
    .select(MEMBER_SELECT)
    .single();
  if (error) {
    if (error.code === '23505') throw new Error('They already hold a seat in that study.');
    throw error;
  }

  // Leaving a study can un-fill it; arriving can fill one.
  await resyncFullness(seat.study_id);
  await resyncFullness(toStudyId);

  const [withYear] = await withCampus([flattenMember(data as unknown as MemberRow)]);
  return withYear;
}

function formatSlotOf(study: BibleStudy): string {
  return `${DAYS[study.day_of_week]} ${fmtTime(study.start_time)}`;
}

// A study is 'full' or 'forming' depending on the seat count; keep that honest
// after any move. Studies that are paused, ended or still pending setup are
// left alone — their status means something a head count can't override.
async function resyncFullness(studyId: string): Promise<void> {
  const db = getSupabaseAdmin();
  const study = await getStudyWithMembers(studyId);
  if (!study) return;
  if (study.status !== 'forming' && study.status !== 'full') return;

  const next = study.activeCount >= study.capacity ? 'full' : 'forming';
  if (next !== study.status) {
    await db.from('bible_studies').update({ status: next }).eq('id', studyId);
  }
}

export interface CampusStudent {
  contact_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  year: string | null;
  status: StudentStatus;
  notes: string | null;
  // Derived, never stored: the studies they currently hold an active seat in.
  // Empty means unplaced — met, but not in a study yet.
  studies: { id: string; label: string; member_id: string }[];
}

// Everyone tagged ARK Iowa, whether or not they're currently in a study. This
// is the campus view of the contacts table: same people, campus-specific facts.
export async function listCampusStudents(): Promise<CampusStudent[]> {
  const db = getSupabaseAdmin();

  const { data: tag } = await db.from('contact_tags').select('id').eq('slug', 'ark-iowa').maybeSingle();
  if (!tag) return [];

  const { data: links, error: lErr } = await db
    .from('contact_tag_links')
    .select('contact_id, contacts(id, name, phone, email)')
    .eq('tag_id', tag.id);
  if (lErr) throw lErr;

  const people = ((links ?? []) as unknown as {
    contact_id: string;
    contacts: { id: string; name: string; phone: string | null; email: string | null } | null;
  }[]).filter((r) => r.contacts);
  if (people.length === 0) return [];

  const ids = people.map((p) => p.contact_id);

  const [{ data: campus, error: cErr }, { data: seats, error: sErr }] = await Promise.all([
    db.from('campus_students').select('*').in('contact_id', ids),
    db
      .from('bible_study_members')
      .select('id, contact_id, study_id, bible_studies(id, day_of_week, start_time, location)')
      .eq('status', 'active')
      .in('contact_id', ids),
  ]);
  if (cErr) throw cErr;
  if (sErr) throw sErr;

  const campusByContact = new Map(
    ((campus ?? []) as { contact_id: string; year: string | null; status: StudentStatus; notes: string | null }[])
      .map((r) => [r.contact_id, r])
  );

  const seatsByContact = new Map<string, CampusStudent['studies']>();
  for (const row of (seats ?? []) as unknown as {
    id: string;
    contact_id: string;
    bible_studies: { id: string; day_of_week: number; start_time: string; location: string | null } | null;
  }[]) {
    if (!row.bible_studies) continue;
    const st = row.bible_studies;
    const list = seatsByContact.get(row.contact_id) ?? [];
    list.push({
      id: st.id,
      member_id: row.id,
      label: `${DAYS[st.day_of_week]} ${fmtTime(st.start_time)}${st.location ? ` · ${st.location}` : ''}`,
    });
    seatsByContact.set(row.contact_id, list);
  }

  return people
    .map((p) => {
      const c = campusByContact.get(p.contact_id);
      return {
        contact_id: p.contact_id,
        name: p.contacts!.name,
        phone: p.contacts!.phone,
        email: p.contacts!.email,
        year: c?.year ?? null,
        status: c?.status ?? ('active' as StudentStatus),
        notes: c?.notes ?? null,
        studies: seatsByContact.get(p.contact_id) ?? [],
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function updateCampusStudent(
  contactId: string,
  patch: { year?: string | null; status?: StudentStatus; notes?: string | null }
): Promise<void> {
  const db = getSupabaseAdmin();
  await ensureCampusStudent(contactId);

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if ('year' in patch) update.year = patch.year?.trim() || null;
  if ('status' in patch) update.status = patch.status;
  if ('notes' in patch) update.notes = patch.notes?.trim() || null;

  const { error } = await db.from('campus_students').update(update).eq('contact_id', contactId);
  if (error) throw error;
}

export async function setMemberStatus(
  memberId: string,
  status: MemberStatus
): Promise<StudyMember> {
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from('bible_study_members')
    .update({ status, left_at: status === 'dropped' ? new Date().toISOString() : null })
    .eq('id', memberId)
    .select(MEMBER_SELECT)
    .single();
  if (error) throw error;
  return flattenMember(data as unknown as MemberRow);
}
