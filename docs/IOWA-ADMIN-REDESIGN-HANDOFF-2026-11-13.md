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
| afbb2c4 | `/iowa/lab/studies` mock |
| c4e6155 | Studies tab: Waiting for a study (Place → Put in, `WaitingList.tsx`), seat dots, filters, study opens full screen, + New study button |
| c06fa76 | Events with sign-ups: list rows, Baja board tap-a-person (checks, raised, Not going), no browser prompts |
| d225aa4 | Staff + Settings: ‹ More back link, tighter phone header |
| 26b1543 | Study's Add a student offers waiting students who fit (free at that time first); task-list buckets count only their own tasks (Overdue bug fixed) |
| 04a541b / 2b57144 | Today: Do now shows 5 rows then Show more; >2 weeks overdue under a closed "Old" section; same-kind auto tasks fold into one line |
| aca85c1 | Look pass: fields 16px on phones (no iPhone zoom, rule in admin layout), bigger btnSmall, no all-caps labels |
| 149fedf | Students tab (was People): search + status chips, More filters, Add student in its own screen |
| 4c7dfc2 / 5dfb99c / 8b19896 | Calendar arrows bigger, New event + New task open full screen; Tasks view chips + More filters; global + hidden where a page has its own New button |
| 5207c7a / bf4af1c | Study screen: students + tasks first, settings under Edit study; roster rows as cards with bigger buttons |
| 0abef20 / ce8b74f | `/iowa/lab/look`: the approved look (navy = where you are / what you picked / what's next; white = lists; gold = do this) |
| 3dbafc9 | Look live: `ScreenHeader` + `NavyChips` in ui.tsx on Today/Studies/Students/Tasks/Calendar/More (numbers top-right, filters in header, semester tabs in Studies kicker); Next up card on Today; Modal header navy; btnSmall navy outline |
| abe8e29 | Speed: profile loads one student (`listCampusStudents(id)`), `app/iowa/admin/loading.tsx`, page queries start together, `currentStaff` + `semesterContext` cached per request |

## Waiting on Travis
- **Run migration 062** (`supabase/migrations/062_student_status_elsewhere.sql`). Until then picking
  "In a study elsewhere" errors.
- Tell us if it's still slow after abe8e29. Next suspect: Vercel region (default iad1) vs the
  Supabase region; set `preferredRegion` to match.

## Next, in order
1. Welcome-text task on placement already exists (`onStudentSeated` in lib/campusAutomation.ts); nothing to build.
2. Look not yet applied: Events, Baja board, Trick or Truth, Staff, Settings (still plain light headers); the green/purple left bars on Today/Studies rows from the mock.
3. Not yet reviewed closely: task detail popup, event screen, StudyCard (Today/Calendar study popup), Settings disclosures.

## Rules Travis gave
- Mock in `/iowa/lab/...` first for new layouts; he taps it on his phone, then build.
- Buttons bottom-right; information on top; rare fields under "More options".
- Interns and student leaders see the same screens with only their own work.
- Couldn't sign in locally: verify with `npx tsc`, `npx eslint`, `npx next build`; Travis checks on his phone.
