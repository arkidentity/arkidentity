# ARK Iowa — Campus Tasks, Calendar + Dashboard

Designed with Travis 2026-09-21. Lives in the Iowa admin (`/iowa/admin`), next to the Bible study
system (`docs/IOWA-BIBLE-STUDY-SYSTEM.md`). Staff-only for now.

## Who

Travis + one intern. Every login (`iowa_staff`) has a `role` — `staff`, `intern`, `leader` — so more
interns and student leaders slot in later without a rebuild. **Phase 1: every role has full access.**
Student-leader logins (scoped to their own studies' students) are Phase 3.

## Decisions

- **Campus events are their own table** (`iowa_events`), NOT the ARK-wide `contact_events` in
  `/admin` — those are ministry admin (donors, worship-night invites). People stay in the one shared
  `contacts` table.
- **Types are an editable list** (`iowa_item_types`, kind = task | event), managed in Settings.
- **Four priorities**, colour-coded: Urgent (red, now) · High (amber, this week) · Normal (blue) ·
  Low (grey, whenever). Overdue gets a red tag regardless of priority.
- **One owner per task**, plus helpers ("I can help"). New tasks default to the creator. Unowned tasks
  are counted on the dashboard so nothing drifts.
- **Email only.** No SMS (A2P 10DLC deferred).
- **Events store local wall-clock** (`event_date` + `start_time`/`end_time`, America/Chicago), like
  studies, so weekly repeats don't shift an hour across DST.

## Phase 1 (this build)

- **Dashboard** (`/iowa/admin`): this week Mon–Sun — studies you're on point for, campus events you're
  going to, tasks due — toggle mine / everyone. My open tasks sorted overdue → priority → due. Counts:
  overdue, unowned, open per person.
- **Tasks** (`/iowa/admin/tasks`): filters (mine / all / unowned / overdue, type, person, status),
  create/edit, Take this, I can help, activity history. Optional links to a study, an event, a student.
- **Calendar** (`/iowa/admin/calendar`): week view with prev/next — studies, events, tasks due. Events:
  type, date, time, location, **meeting link** (paste a Meet link), notes, weekly repeat (+ until),
  who's going.
- **Studies** move to `/iowa/admin/studies`; each study shows its linked open tasks.
- **Drop reasons**: dropping a student asks why — unresponsive, schedule changed, not interested,
  graduated/left school, other (+ note). Stored on `bible_study_members`.
- **Emails**: instant — task assigned to you (by someone else), someone offered to help on your
  task. Everything else is **one morning email** (see Email rhythm below).

## Phase 1.5 — Google Calendar (built, migration 014)

Shared **ARK Campus** Google calendar (Gmail, not Workspace), accessed by a service account the
calendar is shared with ("Make changes to events"). Travis's personal calendar is never read.
Code: `lib/googleCalendar.ts` (auth + REST, no deps), `lib/calendarSync.ts` (all rules).

**One owner per item — how duplicates are prevented:**
- **Bible studies: admin → Google.** A study is on the calendar only while it's forming/full/activated
  AND has at least one active student. Weekly event titled `Bible study · Wed 8 PM · Travis`; the
  description holds the roster (name, phone, email, year), student leader, staff on point, notes.
  Pushed instantly on join / add / drop / move / study edit; removed when it pauses, ends or empties.
- **Admin-created events: admin → Google** (who's going + meeting link go in the description; the
  app can't mint Meet links or invite people on Gmail).
- **Google-created events: Google → admin**, read-only in the admin (edit in Google), everyone's
  (no attendee info). **"Manage it here instead"** (event popup) flips one to `source='app'`,
  keeping the same Google event id, and stamps it with `arkSource` so the importer skips it
  from then on (`takeOverGoogleEvent`). Plain weekly rules map to our weekly repeat; anything fancier imports as its
  first date with a note.
- Everything the app writes carries `extendedProperties.private.arkSource`; the importer skips it.
- **Held back:** a Google event on the same weekday + start time as a study (weekly, or "bible"/
  "study" in the title) isn't imported — it's listed on the Calendar page as "Looks like a duplicate"
  (Travis's pre-sync manual entries). Delete it in Google, or "import it" / "keep it out".

**When:** pushes are instant (`after()`); pulls happen when the dashboard/calendar opens (≤ every
2 min), on "Sync now", and in the daily cron (full both-way reconcile).

**Privacy:** descriptions contain student phone numbers + emails — the calendar must never be public.

Env: `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_SERVICE_ACCOUNT_KEY`, `IOWA_GOOGLE_CALENDAR_ID`. Without
them every sync is a no-op.

**Skipping one week (migration 016):** `iowa_events.skip_dates`. Admin events: click that week on
the Calendar → "Skip {date}" (Restore from the skipped list); pushed to Google as EXDATEs. Google
events: delete just that week in Google; the importer reads cancelled instances (`showDeleted`) and
EXDATE lines into `skip_dates`. Every expansion (`eventDatesInRange`) honors it: calendar, dashboard,
morning email.

## Phase 2 — Follow-up automation (built, migration 015)

Code: `lib/campusAutomation.ts`. Every auto task has an `auto_key`, so nothing ever doubles.

- **"Who did you meet?"** on both signup forms (optional): active staff + interns by first name, "a
  friend invited me", "found it on my own", "other". Stored on `campus_students`
  (`met_by_staff_id` / `met_by_other`), first answer wins; staff can fix it on the Students page.
  Shown on rosters, in the Google roster description ("met Taylor"), and in follow-up tasks.
- **Welcome** — a student's first seat ever → urgent task "Welcome text to {name}", due today, with
  a suggested text (study day/time/place). Owner: who met them → staff on point → unowned. Owner is
  emailed. Closed automatically if they drop.
- **Weekly confirm (Travis's rhythm)** — morning cron (~8 AM CT) two days before each study, while a
  staff member is on point and the study has **no student leader** (setting a leader hands follow-up
  off and stops it): one email per person with every student as a tap-to-text link (prefilled
  message), first-timers flagged NEW, plus a task per study due the day before. Confirm tasks
  auto-close once the study has met.
- **Did they make it?** — the morning after a student's first study, the same email asks Yes / No
  (one-tap links → `/iowa/admin/showed/<member>`, behind login). No → urgent "missed their first
  study" follow-up task. Result shows on the roster (✓ came / ✗ no-show).
- **Stale students** (morning cron, once per student per semester): dropped as unresponsive 30+
  days ago → reconnect; marked dormant → reconnect; met 14+ days ago and never placed → help find a
  study; dropped because their schedule changed, and it's a new semester → re-invite. Not
  interested / left school / graduated → nothing. Owner: who met them.
- **Reconnect ideas** — every reconnect / no-show task lists the next campus events (Taco Night,
  outings) in the coming 3 weeks and suggests a **prayer call from a student** ("You signed up for a
  Bible study; how can I pray for you?"), naming their old study's student leader when there is one.

## School calendar (migration 017)

`iowa_school_periods`, seeded from the U of Iowa registrar's General Catalog
(catalog.registrar.uiowa.edu/calendar, read 2026-09-21): Labor Day (heads-up only), Thanksgiving
break Nov 22–29, finals Dec 14–18, winter break Dec 19–Jan 18, spring break Mar 14–21, finals May
10–14, summer May 15–Aug 22 2027 (end estimated, since Fall 2027's start isn't published). Edited in
Settings → School calendar; add each new year when the registrar posts it.

- **Pausing periods** (`pauses_in_person`) switch off **in-person** studies on those dates: no
  student evening reminder, no confirm email/task, first-study date slides past the break, and the
  weeks are EXDATEd off the Google series. Week grids show the period on the day and the study
  struck through "paused".
- **Online studies** (`bible_studies.online`, "Meets on Google Meet") ignore breaks. That's the
  online community: breaks, summer programs, prayer calls.
- **Scheduling heads-up** on the event form: inside a period ("finals week, students are
  cramming" / "most students are gone") or the week before a pausing one. Weekly events get a
  one-click "Skip the N break weeks". Events with a Meet link and no location count as online and
  get no warnings. Events are never auto-skipped, only warned about.
- Changing the school calendar re-syncs every study to Google.
- **Public signup during a break stays open** (Travis: pausing meetings/reminders/tasks matters;
  blocking signup doesn't). `/iowa`, `/iowa/studies` and a study's page just show a note: which
  break, and the week studies meet again (back-to-back periods chain, so finals then winter break
  reads "Jan 19"). `currentBreak()` in `lib/bibleStudies.ts`.

## Semester turnover (migration 018)

`iowa_semesters` (classes start → last day of finals, + `signup_opens`) replaces the `IOWA_SEMESTER`
env string. Seeded: Fall 2026, Spring 2027 (opens **Nov 30**, the Monday after Thanksgiving; spring
early registration starts Nov 9 and runs ~3 weeks by class standing), Summer 2027, Fall 2027
(estimated). Edited in Settings → Semesters. Code: `lib/semesters.ts`, `lib/semesterPlan.ts`, rules in
`campusFormat.ts` (`studyMeetsOn`, `nextMeetingOnOrAfter`).

- **Which semester:** current = latest started (winter break still counts as Fall). "Open" =
  upcoming with signup open; `next` = the turnover target (Fall over Summer when both open in April).
  The app works with current + open studies (`listStudies()` default).
- **A study meets** only on its weekday, inside its semester, and (in person) not on a break. That one
  rule drives reminders, confirms, first-study dates, schedules, week grids, Google (series starts at
  the first real meeting, UNTIL = semester end) and student calendar invites.
- **Planning** (Travis: staff, intern, or the student leader can do it; multiplying is the point):
  per study, "continue as one group" / "multiply into 2–3" / "not continuing", each new group with
  day, time, place, online, student leader, staff on point (staff only), and which members go where.
  New studies get `parent_study_id`; placed members are seated and emailed ("You're in for Spring",
  calendar links); anyone left out gets a re-invite task and can sign up publicly.
- **Leader link** `/iowa/plan/<token>`: emailed automatically to every current study's student leader
  the first morning after `signup_opens` (once); copy/resend from the admin. Can't plan twice or touch
  staff on point. Studies without a leader: staff plan them in the admin.
- **Public signup** gets "This semester | Spring 2027" tabs from signup_opens; "start a study" works
  in either. Admin Studies page gets semester tabs; badges show "Spring planned / not planned".
- **Morning run:** ends past-semester studies (off Google), sends due plan links, and nudges staff about
  unplanned groups (in the daily email when it's going anyway; on its own only Mondays).
- Schedule-changed re-invites now fire when next semester opens, not when it starts.
- **Breaks don't block signup** (Travis): pages only note "on break, meets again the week of …".

## Event checklists (migration 019)

Code: `lib/eventChecklists.ts`. Templates (`iowa_checklist_templates` + `_items`) are reusable lists;
each item is due `offset_days` from the event (negative = before) with an optional default owner
(else the first staff member going) and priority. Seeded starters: Taco Night, Prayer & Worship Night,
Mission trip (examples; edit in Settings → Checklists).

- **Apply** a template on the Calendar's event panel → real tasks (type "Event prep", linked to the
  event) with `event_occurrence` + `offset_days`. Applied late → due today, noting the real date.
- **Custom tasks** on an event: "Book the vans · 30 days before · owner".
- **Moves:** editing the event's date/repeat/skipped weeks (admin or via Google sync) re-times open
  tasks (`realignEvent`); a skipped week's untouched checklist tasks are dropped.
- **Repeating events:** a fresh set per occurrence, made once its earliest task is due within 14 days
  (max 3 ahead) by the morning run.
- **By event type:** tie a template to a type and every new event of that type gets it.
- Removing a template deletes its not-started future tasks; started ones stay.
- Events repeat weekly only; a monthly Taco Night is one event per month (type-tied template helps).

## One screen (2026-09-21, Travis)

The Dashboard (`/iowa/admin`) is the working screen: count tiles → the week calendar (arrows, This
week, Mine/Everyone, + New event, Google sync bar, duplicate list, event panel with checklists) →
the full task list (filters, + New task) beside "Who's carrying what". The Calendar and Tasks nav
tabs are gone; `/iowa/admin/calendar` and `/iowa/admin/tasks` redirect to the dashboard keeping
`?week=` / `?task=` / `?new=` (emails already sent still work). Nav: Dashboard · Studies · Students
· Staff · Settings.

Layout + behavior refinements (same day, from Travis using it on his phone):
- **Opens on Everyone** (calendar and tasks); Mine is one tap away.
- **Calendar header** is the date range ("Sep 21 – 27") with + New event; ← This week → and
  Mine/Everyone share one row. Sync line shortened ("Google synced 3:05 PM · Sync now") to fit one
  phone line. + New task sits on the Tasks heading line.
- **Bigger detail text below the `md` breakpoint** (calendar item details, task sub-lines, opened task
  details/history); desktop sizes unchanged.
- **Tap-to-open cards** (`Modal` in `components/iowa/campus/ui.tsx`): tapping a study or event on the
  week grid opens a **centered floating card** on every screen size (85dvh max, scrolls inside; a bottom
  sheet felt cramped on phones). Closes on ✕, backdrop, or Escape.
  - **Study card** (`StudyCard.tsx`): when/where, count, student leader (call/text), on point, the
    week's **Team** (shadowing / assisting / leading), roster with call · text · email, year, met-by,
    first-study result, and **Move / Drop** per student (drop asks the reason) + Restore for dropped;
    "Edit in Studies →" for everything else.
  - **Event card**: when/where, Join button, Team invites + RSVPs, checklist; the edit form and
    skip-a-week tucked behind "Edit event ▾".
- **Tasks**: rows show everyone on the task ("Travis, with Kayla"). Opening a task shows a short summary
  (details, one meta line, ✓ Mark done / Take this / I can help); **Edit ▾** and **History ▾** open on
  demand. Save closes the editor with "Saved ✓" and shows any error beside the button ("Didn't save: …"),
  since errors used to land off-screen at the top of the list.
- **"Also on it"**: one accountable owner plus any number of staff via name chips in the task form
  (`helper_ids`, `setHelpers()` in `lib/campusTasks.ts`); newly added people are emailed and the task
  shows in their Mine. Only people with a staff login can be assigned (student-leader logins = Phase 3).

## Invites and RSVPs (migration 020)

Code: `lib/eventInvites.ts`. Built for the internship (Keilor, Sep 2026): Travis schedules things with an
intern, the intern can say yes or no.

- **Staff invites:** putting someone on an event (event form, or the name chips in the event panel's
  Team section — works on Google-owned events too) invites them: `iowa_event_staff.response` pending /
  accepted / declined (+ note). The creator is in automatically; everyone already on events before 020
  counts as accepted. Invite email has I'm in / Can't do it (`/iowa/admin/invite/<event>?r=`); the
  dashboard shows "Needs your answer"; the morning email lists pending invites. One answer covers a
  weekly series; "Can't make <date>" (`iowa_event_absences`) covers one week. Declines and absences
  email whoever made the event ("missing is fine, disappearing is not").
- **RSVPs:** an event can open a public link (`/iowa/rsvp/<token>`): name + phone or email, I'm in /
  Can't make it, + guests, per date for weekly events. Head count shows in the event panel and on the
  week grid. **Personal invites** (`/iowa/rsvp/p/<token>`): pick a student or type a name → their own
  link (emailed if there's an email, and copied to text). RSVPers are matched/added to the shared
  contacts list, tagged ARK Iowa (so new faces appear on Students). Not Google invites (Gmail can't).
- **Tap-to-open cards:** tapping an event or Bible study on the week grid opens a pop-up (bottom sheet on
  phones, centered on desktop). Study card: where/when, count, leader (call/text), on point, roster with
  call/text/email, year, met-by, first-study result, dropped list, "Edit in Studies". Event card:
  when/where, Join, Team + RSVPs, checklist, "Edit event ▾" (skip-a-week + form) collapsed.
- Deferred from the same conversation: per-person weekly schedule + conflict warnings (#1), and a
  light scheduled-ministry-hours view vs the 7/9 target (#4).

## Study team (migration 021)

Code: `lib/studyTeam.ts`, `teamOn()` in campusFormat. The staff member on point stays responsible; others
join a study as **Shadowing / Assisting / Leading** (the internship path: watch → take a piece →
facilitate), for **one date** (`occurrence`) or **every week** (null). A date row beats an every-week
row for the same person that week. Joining is an invite (email with I'm in / Can't do it →
`/iowa/admin/study-invite/<row>`, "Needs your answer", morning email); answers email whoever invited.
Managed from the Bible study pop-up's Team section on the calendar. Effects: shows on their week grid /
Mine / morning schedule with the role; whoever is **Leading** an accepted week also gets that study's
confirm email (tap-to-text). **Internal only** (Travis): students' reminders never mention it.

## Email rhythm (2026-09-21, Travis)

**One email per person per morning, Monday–Saturday, ~8 AM CT, skipped entirely when empty. No
Sunday email.** (`/api/cron/iowa-morning` → `runMorning()`.) It holds:
- **Confirm your studies**: two days out, tap-to-text links. **Saturday covers Monday + Tuesday**
  so skipping Sunday never leaves a study unconfirmed; a confirm task whose day-before lands on
  Sunday is due Saturday instead.
- **Did they make it?**: any first study in the last 3 days not yet asked (Monday catches
  Saturday's and Sunday's first-timers).
- **Tasks due today + overdue** (weekdays) / **all open tasks** (Monday).
- **Coming up**: campus events in the next two days (weekdays; studies are left out since the
  confirm section covers them) / **the whole week**, studies + events (Monday = the old weekly digest).

Retired: the separate Monday digest cron and the 6 PM "due tomorrow" email. Unchanged: the 6 PM
reminder to *students* about tomorrow's study. Event confirms ("text who you invited to Taco
Night") deferred, since they need per-event invite tracking.

## Check-in report (migration 023, 2026-09-22)

Students tab → **Check-in report** button (staff + interns only; hidden from
student leaders, and the APIs refuse them). Opens full-screen, built for a phone.
The point is care, not recruitment: sometimes the goal is just "how's school?"

- **Who's on it** is derived, never stored: anyone not graduated/transferred/left
  school who either never made it to their first study (`first_showed = false`),
  was dropped (latest dropped seat, not `left_school`), is marked dormant, or
  was never placed. Students in a study and showing up aren't listed.
- **Each row** shows the reason, the study (day/time/place) they joined or were
  dropped from, the drop or dormant reason + note, days quiet, and the last check-in.
- **Filters:** went quiet 30/60/90/any days · reason · not checked on in 30
  days (default) / never / everyone. CSV download of what's shown.
- **Log check-in:** Talked / Texted–replied / Texted–no reply + optional note
  (`campus_checkins`). Logging drops them off the default view for 30 days so
  two people don't text the same student the same week.
- **Dormant reason:** picking Dormant on the Students tab shows a "why?" select
  + note (`campus_students.dormant_reason/_note/_at`). Leaving dormant clears them.
- **Invite to…:** select students → pick an upcoming event (Social/Gathering
  types listed first, ★) → personal RSVP links via `invitePerson` (emailed when
  there's an email; Text button pre-fills the link). New event type: **Social**.

- **Closes follow-up tasks:** logging a check-in marks that student's open
  automation tasks (reconnect / place / re-invite / missed first study) done.

### Task list layout (2026-09-22)
Open tasks are sectioned by when they're due: Overdue · This week · Next 2 weeks
· Later (collapsed) · No due date (collapsed); priority orders within a section.
Urgent with no date counts as This week. The automation's per-student tasks
collapse into one card per kind ("Reconnect with 6 students"), and welcome texts
into one card per study, with a link to the check-in report. A group of one
shows as a normal task. Done view is a flat list.

### Calendar popups (2026-09-22)
Everything on the week calendar opens in a popup, no page loads. Study popup has **Edit details**
(status, on point, student leader, day/time, location, capacity, online, taking signups, notes). The
Studies page is for creating studies + the all-semesters list. Tasks (and grouped task lines) open
in a task popup with Mark done / Take this / Edit.

## Task comments (migration 024, 2026-09-22)

`iowa_task_activity.kind` splits the timeline: `'log'` is the app ("marked done"), `'comment'` is a
person writing. Comments answer "I picked the songs — here they are" without overwriting the
description.

- **Notes box** on every task (task list + task popup). Posting emails the owner and everyone
  helping, minus the writer (`notifyTaskComment` → `sendTaskComment`).
- **Mark done asks "Anything to pass along?"** — optional; sent as a comment with the same PATCH
  (`{ status: 'done', comment }`).
- **On the event:** the event panel shows the comments from that date's prep tasks. A repeating
  event's tasks carry `event_occurrence`, so this Thursday's songs don't mix with next Thursday's.
  Clicking a note opens its task.
- History (the `log` rows) stays behind its own toggle.

## Songs (migration 025, 2026-09-22)

`iowa_event_songs` = a setlist on ONE date of an event (`event_id` + `occurrence`), like checklist
tasks. Any event can have songs; the section is quiet until the first one is added. Code:
`lib/eventSongs.ts`, route `POST /api/iowa/admin/events/:id/songs`.

- Title + key + link, ordered (↑ ↓). Added whenever they're picked, not at event creation.
- **Copy from {last date}** (same event) and **Copy these to…** (any event date in the next 30 days —
  practice Thursday → service Sunday).
- **Rides to Google:** the description carries the next date's set, so the team sees it on their
  phones without logging in (`songLines`; queued by the route, not `eventSongs`, to avoid an import
  cycle with `calendarSync`).
- Deliberately NOT a song library: no usage history, CCLI, arrangements or SongSelect. These rows
  are the history if that's ever wanted.

## Phase 3 — Student leaders

Leader logins; see only their own studies' students; claim/update own tasks, offer help.
