import { NextResponse } from 'next/server';
import { currentStaff, type IowaStaff, type StaffRole } from '@/lib/iowaStaff';

// What each role may do. Until now every role had full access (migration 013
// said so out loud), which was fine while the only logins were Travis and an
// intern — and a privacy problem the day a student leader gets one.
//
// The rules, in plain terms:
//   staff   — everything.
//   intern  — the daily work: studies, students, tasks, events, check-ins.
//             Not staff accounts, not the shared settings lists, and nothing
//             that deletes a study.
//   leader  — a student leading one table. Their own study and their own
//             tasks. No student directory, no other groups, no settings.
//
// Every check lives here so a screen and its API can't disagree, and the API
// is what actually enforces it — hiding a button is a courtesy, not a rule.

export type Permission =
  | 'manageStaff' // create/edit staff, set passwords, turn logins off
  | 'manageSettings' // task+event types, checklist templates, semesters, school calendar
  | 'deleteStudy'
  | 'viewAllStudies' // the Studies page and every group on the calendar
  | 'viewStudents' // the student directory, check-in report, bulk invites
  | 'manageEvents' // create/edit campus events, checklists on them, Google takeover
  | 'manageTasks'; // make and assign tasks to other people

const RULES: Record<StaffRole, Permission[]> = {
  staff: ['manageStaff', 'manageSettings', 'deleteStudy', 'viewAllStudies', 'viewStudents', 'manageEvents', 'manageTasks'],
  intern: ['viewAllStudies', 'viewStudents', 'manageEvents', 'manageTasks'],
  leader: [],
};

export function can(person: IowaStaff | null, permission: Permission): boolean {
  return !!person?.active && RULES[person.role].includes(permission);
}

export const isLeader = (person: IowaStaff | null): boolean => person?.role === 'leader';

// Route guard: `const me = await require('viewStudents'); if (me instanceof NextResponse) return me;`
// A 401 when signed out, a 403 when signed in without the permission — the
// proxy has already rejected an invalid session, so 401 here is rare.
export async function requirePermission(
  permission: Permission
): Promise<IowaStaff | NextResponse> {
  const me = await currentStaff();
  if (!me) return NextResponse.json({ error: 'Sign in again.' }, { status: 401 });
  if (!can(me, permission)) {
    return NextResponse.json({ error: DENIED[permission] }, { status: 403 });
  }
  return me;
}

// Said the way the person reading it would say it, not "Forbidden".
const DENIED: Record<Permission, string> = {
  manageStaff: 'Only staff can manage logins.',
  manageSettings: 'Only staff can change these shared lists.',
  deleteStudy: 'Only staff can delete a study.',
  viewAllStudies: 'You can only see your own study.',
  viewStudents: 'Only staff and interns can see the student directory.',
  manageEvents: 'Only staff and interns can change campus events.',
  manageTasks: 'Only staff and interns can assign tasks.',
};

// Which studies this person may see. Staff and interns: all of them. A student
// leader: the ones they lead — matched on the email their study lists, plus any
// study they're on the team of. (Study leaders are contact details on the
// study, not staff rows, so email is the join.)
export function visibleStudyIds<T extends { id: string; leader_email: string | null }>(
  person: IowaStaff | null,
  studies: T[],
  teamStudyIds: string[] = []
): string[] | 'all' {
  if (can(person, 'viewAllStudies')) return 'all';
  if (!person) return [];
  const email = person.email.trim().toLowerCase();
  const mine = studies.filter((s) => (s.leader_email ?? '').trim().toLowerCase() === email).map((s) => s.id);
  return [...new Set([...mine, ...teamStudyIds])];
}

export function filterStudies<T extends { id: string; leader_email: string | null }>(
  person: IowaStaff | null,
  studies: T[],
  teamStudyIds: string[] = []
): T[] {
  const ids = visibleStudyIds(person, studies, teamStudyIds);
  return ids === 'all' ? studies : studies.filter((s) => ids.includes(s.id));
}
