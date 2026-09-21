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
- **Emails**: task assigned to you (by someone else) · someone offered to help on your task · due
  tomorrow (nightly cron) · Monday digest of your week (studies, events, open tasks).

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
  (no attendee info). Plain weekly rules map to our weekly repeat; anything fancier imports as its
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

## Phase 2 — Automation

New-student follow-up sequence · drop → follow-up, and next-semester re-invite list driven by drop
reason (schedule changed = first to re-invite; not interested = leave alone) · new-study setup
checklist · monthly templates (Taco Night, Prayer & Worship Night) · dropped-students list.

## Phase 3 — Student leaders

Leader logins; see only their own studies' students; claim/update own tasks, offer help.
