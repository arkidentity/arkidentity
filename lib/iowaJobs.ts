import type { Permission } from '@/lib/iowaPerms';

// Extra jobs a student leader can take on in the admin (migration 059).
// Client-safe: the Staff page shows these as checkboxes. A job is a bundle of
// permissions on top of the leader role; staff and interns have them already.
//
// What each one opens up, and why it's a risk worth switching on per person:
//   calendar — make and edit campus events, RSVPs, Google sync. The Google
//              calendar holds every study's roster with phone numbers.
//   welcome  — the student directory and every study, to place students who
//              are waiting. Classmates' phones, notes and drop reasons.
//   tasks    — make tasks and hand them to anyone on the team.

export type JobKey = 'calendar' | 'welcome' | 'tasks';

export const JOBS: { key: JobKey; label: string; hint: string; grants: Permission[] }[] = [
  {
    key: 'calendar',
    label: 'Calendar & events',
    hint: 'Make and edit events, RSVPs, checklists',
    grants: ['manageEvents'],
  },
  {
    key: 'welcome',
    label: 'Welcome team',
    hint: 'See all students and studies; place new students',
    grants: ['viewStudents', 'viewAllStudies'],
  },
  {
    key: 'tasks',
    label: 'Hand out tasks',
    hint: 'Make tasks and assign them to anyone',
    grants: ['manageTasks'],
  },
];

export const JOB_KEYS = JOBS.map((j) => j.key);

export function jobGrants(jobs: readonly string[] | null | undefined): Permission[] {
  return JOBS.filter((j) => jobs?.includes(j.key)).flatMap((j) => j.grants);
}
