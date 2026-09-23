import { digitsOf } from '@/lib/contacts';
import type { CampusStudent } from '@/lib/bibleStudies';

// "These two look like the same person." Matching on the way in (email, then
// phone) stops most duplicates being created; this catches the ones already
// there, and the ones nothing could have caught — a student who signed up with
// a new email AND a new number, spotted by name.
//
// Pure: it reads the student list the page already loaded, no extra queries.
// It flags, it never merges — a real merge has to move rosters, tasks,
// check-ins and RSVPs, and that's a decision, not a guess.

export interface DupeGroup {
  reason: 'phone' | 'name';
  students: CampusStudent[];
}

// "sam lee jr." and "Sam  Lee Jr" are the same name.
function normName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function findStudentDupes(students: CampusStudent[]): DupeGroup[] {
  const byPhone = new Map<string, CampusStudent[]>();
  const byName = new Map<string, CampusStudent[]>();

  for (const s of students) {
    const digits = digitsOf(s.phone ?? '').slice(-10);
    if (digits.length === 10) byPhone.set(digits, [...(byPhone.get(digits) ?? []), s]);
    const name = normName(s.name);
    if (name) byName.set(name, [...(byName.get(name) ?? []), s]);
  }

  const groups: DupeGroup[] = [];
  const flagged = new Set<string>();

  // Phone first: two records, one number is about as sure as this gets.
  for (const list of byPhone.values()) {
    if (list.length < 2) continue;
    groups.push({ reason: 'phone', students: list });
    for (const s of list) flagged.add(s.contact_id);
  }

  // Then same name, different everything — weaker, so it only counts when the
  // pair isn't already flagged by phone.
  for (const list of byName.values()) {
    if (list.length < 2) continue;
    if (list.every((s) => flagged.has(s.contact_id))) continue;
    groups.push({ reason: 'name', students: list });
    for (const s of list) flagged.add(s.contact_id);
  }

  return groups;
}
