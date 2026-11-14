import type { StudentStatus } from '@/lib/bibleStudies';

// One place for how a student's status reads and looks (Students tab, the
// student panel in tasks and popups).
export const STATUS_LABEL: Record<StudentStatus, string> = {
  unplaced: 'Needs a study',
  active: 'Active',
  dormant: 'Dormant',
  elsewhere: 'In a study elsewhere',
  graduated: 'Graduated',
  transferred: 'Transferred',
  left_school: 'Left school',
};

export const STATUS_COLOR: Record<StudentStatus, string> = {
  unplaced: '#c2410c',
  active: '#15803d',
  dormant: '#9d855a',
  elsewhere: '#2f6f5e',
  graduated: '#143348',
  transferred: '#2563eb',
  left_school: '#8a8378',
};

export const YEARS = ['first-year', 'sophomore', 'junior', 'senior', 'grad', 'other'];

// Active vs Needs a study comes from the roster, so only the true one is offered.
export function statusChoices(inStudy: boolean): StudentStatus[] {
  return (Object.keys(STATUS_LABEL) as StudentStatus[]).filter((st) =>
    st === 'active' ? inStudy : st === 'unplaced' ? !inStudy : true
  );
}
