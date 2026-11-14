# ARK Iowa admin redesign: handoff (2026-11-13)

Travis wants the admin simple for staff and interns on a phone: what's on you first, one
tap to act, and every task, study, event and student editable from wherever you tap it.

## Done (all live on main)

| Commit | What |
|---|---|
| 9199b79 / d084760 / 65ebd8a | `/iowa/lab/today`: the approved mock (sample data, no site chrome) |
| 7e2072a | Today home, bottom tab bar (Today, Calendar, Studies, People, More), gold + (task / student / event / study), Calendar, Tasks, More screens. `lib/iowaAdminScreen.ts` loads data for all three |
| b87f1a4 | `StudentPanel` (editable student: status, year, study put-in/move/drop, contact, history + note) inside tasks and every student-name popup. Done asks "What happened?"; the note also goes on the student's history. New status **In a study elsewhere** (mig 062) |
| 81b5e0d | A task's "For …" line opens its study or event in place (`useOpenItem`, `CampusCalendar openRequest`) |
| d03212a | `Modal` is full screen on phones; task actions in a bottom bar (Done / Next week / Take it / I can help); People = tap-to-open list using `StudentPanel` (+ who met them, Daily DNA link) |
| abe8e29 | Speed: profile loads one student (`listCampusStudents(id)`), `app/iowa/admin/loading.tsx`, page queries start together, `currentStaff` + `semesterContext` cached per request |

## Waiting on Travis
- **Run migration 062** (`supabase/migrations/062_student_status_elsewhere.sql`). Until then picking
  "In a study elsewhere" errors.
- Tell us if it's still slow after abe8e29. Next suspect: Vercel region (default iad1) vs the
  Supabase region; set `preferredRegion` to match.

## Next, in order
1. **Studies tab** (`app/iowa/admin/studies`, `components/iowa/IowaAdmin.tsx`, 1300 lines): one row
   per study (time, place, X of 5, who leads, staff on point), "Who's waiting" on top, tap opens the
   study screen (reuse `StudyCard`). Keep + New study (`?new=1`).
2. **Events with sign-ups** (Trick or Truth, Baja board, Outreach) in the same style.
3. **Staff / My account** and **Settings**: keep plain, just phone-friendly.
4. Known gap: "Add a student" inside a study card still uses its old inline form.
5. Old bug (now hidden from Today): the task list's Overdue bucket counted whole groups
   (`bucketize` uses the group's first task), so "Overdue (36)" vs "Overdue (23)".

## Rules Travis gave
- Mock in `/iowa/lab/...` first for new layouts; he taps it on his phone, then build.
- Buttons bottom-right; information on top; rare fields under "More options".
- Interns and student leaders see the same screens with only their own work.
- Couldn't sign in locally: verify with `npx tsc`, `npx eslint`, `npx next build`; Travis checks on his phone.
