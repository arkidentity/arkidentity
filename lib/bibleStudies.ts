import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

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

export interface StudyMember {
  id: string;
  study_id: string;
  name: string;
  phone: string;
  email: string;
  year: string | null;
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

export interface Contact {
  name: string;
  phone: string;
  role: 'leader' | 'member';
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
    .select('*')
    .in('study_id', ids)
    .order('joined_at', { ascending: true });
  if (mErr) throw mErr;
  for (const m of (members ?? []) as StudyMember[]) {
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
    .select('*')
    .eq('study_id', id)
    .order('joined_at', { ascending: true });
  if (mErr) throw mErr;

  const list = (members ?? []) as StudyMember[];
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

// Other studies where this phone already holds an active seat — used to flag
// the admin alert on a new join, not to block it.
export async function otherActiveStudiesForPhone(
  phone: string,
  exceptStudyId: string
): Promise<BibleStudy[]> {
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from('bible_study_members')
    .select('study_id, bible_studies(*)')
    .eq('status', 'active')
    .ilike('phone', phone.trim())
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
  roster: Contact[];
  alsoInOtherStudies: BibleStudy[];
}

export async function joinStudy(input: JoinInput): Promise<JoinResult> {
  const db = getSupabaseAdmin();
  const study = await getStudyWithMembers(input.studyId);
  if (!study) throw new Error('That study no longer exists.');
  if (!isListable(study, study.activeCount)) {
    throw new Error('That study just filled — pick another open time or start one.');
  }
  if (
    study.members.some(
      (m) => m.status === 'active' && m.phone.trim().toLowerCase() === input.phone.trim().toLowerCase()
    )
  ) {
    throw new Error("You're already on that study's roster.");
  }

  const { data: member, error } = await db
    .from('bible_study_members')
    .insert({
      study_id: input.studyId,
      name: input.name.trim(),
      phone: input.phone.trim(),
      email: input.email.trim(),
      year: input.year?.trim() || null,
    })
    .select('*')
    .single();
  if (error) {
    // unique partial index → someone took the last seat / same phone raced in
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

  const roster = rosterContacts(fresh, member.id);
  const alsoInOtherStudies = await otherActiveStudiesForPhone(input.phone, input.studyId);
  return { study: fresh, member: member as StudyMember, roster, alsoInOtherStudies };
}

// Contacts a joining student is shown: the leader plus the other active members
// (optionally excluding one member id — the person who just joined).
export function rosterContacts(study: StudyWithMembers, excludeMemberId?: string): Contact[] {
  const contacts: Contact[] = [];
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

  const { data: member, error: mErr } = await db
    .from('bible_study_members')
    .insert({
      study_id: study.id,
      name: input.name.trim(),
      phone: input.phone.trim(),
      email: input.email.trim(),
      year: input.year?.trim() || null,
    })
    .select('*')
    .single();
  if (mErr) throw mErr;

  return { study: study as BibleStudy, member: member as StudyMember };
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
  const { data, error } = await db
    .from('bible_study_members')
    .insert({
      study_id: studyId,
      name: input.name.trim(),
      phone: input.phone.trim(),
      email: input.email.trim(),
      year: input.year?.trim() || null,
      source: input.source?.trim() || null,
      notes: input.notes?.trim() || null,
    })
    .select('*')
    .single();
  if (error) {
    if (error.code === '23505') throw new Error('That phone already holds an active seat here.');
    throw error;
  }
  return data as StudyMember;
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
    .select('*')
    .single();
  if (error) throw error;
  return data as StudyMember;
}
