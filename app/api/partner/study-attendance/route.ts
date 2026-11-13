import { NextResponse } from 'next/server';
import { getStudyWithMembers, type StudyWithMembers } from '@/lib/bibleStudies';
import { addDays, chicagoToday, isValidDate, studyMeetsOn } from '@/lib/campusFormat';
import { semesterContext } from '@/lib/semesters';
import { listAttendance, saveAttendance } from '@/lib/studyAttendance';
import { listCheckins, saveCheckin, type CheckinMet } from '@/lib/studyCheckins';
import { leaderAccountId } from '@/lib/studyLeader';

export const dynamic = 'force-dynamic';

// /api/partner/study-attendance — "How'd it go?" on a Bible study table in Daily DNA.
// Auth: Bearer PARTNER_SYNC_SECRET (same value in both apps), plus the Daily DNA account
// asking. Only the study's own student leader (their linked Daily DNA account, the one
// the roster sync sends as leaderAccountId) gets in; Daily DNA also checks they're the
// table's host before calling.
//
// GET  ?study=<bible_studies.id>&account=<Daily DNA account id>
//      → { dates (newest first), roster: [{ contact_id, name }],
//          checkins: [{ occurrence, met, headcount, note }], marks: [{ occurrence, contact_id, present }] }
// POST { study, account, occurrence,
//        checkin?: { met: yes|no|cancelled, headcount?, note? },   — the weekly check-in (migration 060)
//        marks?: [{ contact_id, present }] }                       — optional: who came, by name (037)
//      → same as GET
//
// The roster is the admin's, not the table's: students who never linked Daily DNA can
// still be ticked. Only the last few meetings can be changed, so a leader fixes last
// week but can't rewrite the semester. Didn't meet or a note → task for the staff on point.
const RECENT = 4;
const MET: CheckinMet[] = ['yes', 'no', 'cancelled'];

function authorized(req: Request) {
  const secret = process.env.PARTNER_SYNC_SECRET;
  return !!secret && req.headers.get('authorization') === `Bearer ${secret}`;
}

/** The study, if this account leads it. */
async function studyFor(studyId: string | null | undefined, account: string | null | undefined) {
  if (!studyId || !account) return null;
  const s = await getStudyWithMembers(studyId).catch(() => null);
  if (!s || !['forming', 'full', 'activated', 'paused'].includes(s.status)) return null;
  return (await leaderAccountId(s)) === account ? s : null;
}

/** Meeting dates that have happened (today included), newest first. */
async function recentMeetings(s: StudyWithMembers): Promise<string[]> {
  const { periods, semesters } = await semesterContext();
  const today = chicagoToday();
  const out: string[] = [];
  for (let i = 0; i < 7 * 12 && out.length < RECENT; i++) {
    const d = addDays(today, -i);
    if (studyMeetsOn(s, d, periods, semesters)) out.push(d);
  }
  return out;
}

async function view(s: StudyWithMembers) {
  const dates = await recentMeetings(s);
  const roster = s.members
    .filter((m) => m.status === 'active')
    .map((m) => ({ contact_id: m.contact_id, name: m.name }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const [rows, checkins] = await Promise.all([listAttendance([s.id]), listCheckins([s.id])]);
  return {
    dates,
    roster,
    checkins: checkins
      .filter((c) => dates.includes(c.occurrence))
      .map((c) => ({ occurrence: c.occurrence, met: c.met, headcount: c.headcount, note: c.note })),
    marks: rows
      .filter((r) => dates.includes(r.occurrence))
      .map((r) => ({ occurrence: r.occurrence, contact_id: r.contact_id, present: r.present })),
  };
}

export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const url = new URL(req.url);
  const s = await studyFor(url.searchParams.get('study'), url.searchParams.get('account'));
  if (!s) return NextResponse.json({ error: 'not_leader' }, { status: 403 });
  return NextResponse.json(await view(s));
}

export async function POST(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const b = (await req.json().catch(() => ({}))) as {
    study?: string;
    account?: string;
    occurrence?: string;
    checkin?: { met?: unknown; headcount?: unknown; note?: unknown };
    marks?: { contact_id?: unknown; present?: unknown }[];
  };
  const s = await studyFor(b.study, b.account);
  if (!s) return NextResponse.json({ error: 'not_leader' }, { status: 403 });
  if (!b.occurrence || !isValidDate(b.occurrence) || !(await recentMeetings(s)).includes(b.occurrence)) {
    return NextResponse.json({ error: 'That isn’t one of the last few meetings.' }, { status: 400 });
  }
  const active = s.members.filter((m) => m.status === 'active');
  try {
    // Names first, so a check-in with no headcount can use the count.
    let ticked: number | null = null;
    if (Array.isArray(b.marks)) {
      // Everyone on the roster gets a mark (unticked = didn't come), so a re-save is a clean fix.
      const here = new Set(b.marks.filter((m) => m.present === true).map((m) => String(m.contact_id)));
      const marks = active.map((m) => ({ contact_id: m.contact_id, present: here.has(m.contact_id) }));
      await saveAttendance(s.id, b.occurrence, marks, null); // recorded_by null = from Daily DNA
      ticked = marks.filter((m) => m.present).length;
    }
    if (b.checkin) {
      const met = MET.find((m) => m === b.checkin!.met);
      if (!met) return NextResponse.json({ error: 'Did you meet?' }, { status: 400 });
      const raw = b.checkin.headcount;
      const n = raw === null || raw === undefined || raw === '' ? NaN : Number(raw); // Number(null) is 0, not "not given"
      const headcount = Number.isFinite(n) && n >= 0 ? Math.min(200, Math.round(n)) : ticked;
      const note = typeof b.checkin.note === 'string' ? b.checkin.note : null;
      await saveCheckin(s, b.occurrence, { met, headcount, note });
    }
    return NextResponse.json(await view(s));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
