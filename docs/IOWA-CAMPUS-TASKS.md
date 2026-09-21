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

## Phase 1.5 — Google Calendar

A dedicated shared **"ARK Campus"** Google calendar (Travis is on Gmail, not Workspace). Shared with a
service account; two-way sync — events put on it in Google (with Meet links) appear in the admin,
events created in the admin appear in Google. Personal calendar never touched. The app can't mint
Meet links on Gmail — create them in Google, they flow in. `iowa_events.google_event_id` reserved.

## Phase 2 — Automation

New-student follow-up sequence · drop → follow-up, and next-semester re-invite list driven by drop
reason (schedule changed = first to re-invite; not interested = leave alone) · new-study setup
checklist · monthly templates (Taco Night, Prayer & Worship Night) · dropped-students list.

## Phase 3 — Student leaders

Leader logins; see only their own studies' students; claim/update own tasks, offer help.
