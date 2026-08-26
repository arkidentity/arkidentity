# ARK Iowa — Bible Study System

**Spec. Written 2026-08-25** with Travis, over the session that started from
`ark-workspace/projects/ark-identity/messaging/iowa/HANDOFF.md`. Build lives in this repo
(`arkidentity/arkidentity`). Read the Iowa `HANDOFF.md` and `SOURCE-OF-TRUTH.md` for messaging context
before touching copy.

---

## 1. What this is

The operating system for ARK Iowa's campus ministry: a roster + live schedule for weekly student
**Bible studies**. Travis interviews students, invites them to an initial ~30-minute study, and fills
studies to four. When a study has four students who can run the DNA tools themselves it is
**activated** — it keeps meeting without Travis, and he starts another.

At any point there may be 40–100+ studies running across campus. This system tracks every one: day,
time, location, roster, status, and how it's doing — and it lets a student find an open study at a
time they're free, or start a new one.

### What this is NOT

- **Not DNA groups.** These studies use the DNA tools but are not DNA groups and are not records in
  the DNA app. A study may later "graduate" into a real DNA group in the DNA app (for students Travis
  disciples toward leading the pathway) — that is a separate system and a later concern. Nothing here
  needs to know about it. Don't hard-delete anything, so a graduated study's history survives.
- **Not the 1:1 booking.** Coaching / prayer / questions with Travis is a separate, irregular
  appointment booking — Google Appointment Schedule, not built here. See §14.

### Vocabulary

**"Bible study," never "table."** Travis's ruling 2026-08-25: "table" is insider language; students
don't parse it. The study happens at a table; we don't call it one. (The live `/iowa` landing page
still says "tables of four" in its own messaging — reconciling that copy is a Phase 2 item, §11.)
"Leader" and "member" are fine. A full, self-running study is **activated**.

---

## 2. Architecture

- Lives in this repo. New Supabase tables in the existing project (the ministry-feed database).
- **Server-only data access.** All reads/writes go through Next.js route handlers using
  `getSupabaseAdmin()` (service-role) — same pattern as the feed. No `anon` / `authenticated` grants.
  Public routes (student join, calendar file, pulse response) authorize with an **opaque token**
  (`gen_random_uuid()::text`), exactly like `partners` confirm/unsubscribe.
- Admin is gated by a single shared password, mirroring `lib/adminAuth.ts` — new
  `lib/iowaAdminAuth.ts`, env `IOWA_ADMIN_PASSWORD`, cookie `iowa_admin`. Independent of the feed
  admin so the two can't unlock each other.
- Migrations: plain numbered SQL, `create ... if not exists`, next free numbers (006+).

---

## 3. Data model

### `bible_studies`

| column | type | notes |
|---|---|---|
| `id` | uuid pk | `gen_random_uuid()` |
| `semester` | text not null | e.g. `"Fall 2026"`. Set at creation, used for archiving. |
| `day_of_week` | int not null | 0=Sun … 6=Sat |
| `start_time` | time not null | local, America/Chicago |
| `location` | text | nullable **only** while `pending_setup` (a student-started study before Travis sets the spot). Required to be listed. |
| `capacity` | int not null default 4 |
| `status` | text not null | see §4 |
| `accepting_signups` | boolean not null default true | explicit override — an activated study with a drop-out flips this true without changing status |
| `leader_name` | text | usually "Travis" early on, a student later |
| `leader_phone` | text | for the roster-visible contact card and the pulse |
| `leader_email` | text | pulse delivery |
| `notes` | text | Travis's private notes |
| `break_plan` | text | free text used while `paused` — "weekly on Meet" / "monthly" / "off until spring" |
| `parent_study_id` | uuid | fk → `bible_studies.id`, set when a study rolls forward to a new semester (lineage, like DNA `parent_group_id`) |
| `pulse_status` | text | latest monthly pulse: `green` / `yellow` / `red` / null |
| `pulse_note` | text | optional note from the latest pulse |
| `pulse_at` | timestamptz | when the latest pulse landed |
| `created_at` | timestamptz not null default now() |
| `activated_at` | timestamptz | set when status → `activated` |

Indexes: `(semester, day_of_week, start_time)`, `(status)`, `(parent_study_id)`.

### `bible_study_members`

| column | type | notes |
|---|---|---|
| `id` | uuid pk |
| `study_id` | uuid not null | fk → `bible_studies.id` |
| `name` | text not null |
| `phone` | text not null |
| `email` | text not null |
| `year` | text | optional — "first-year" / "sophomore" / … |
| `status` | text not null default `'active'` | `active` / `dropped` |
| `source` | text | "org fair" / "referred by X" / "cold" — Travis fills later |
| `joined_at` | timestamptz not null default now() |
| `left_at` | timestamptz | set when status → `dropped` |
| `notes` | text |

Indexes: `(study_id, status)`, `(lower(phone))` for the duplicate guard, `(lower(email))`.

**Duplicate guard:** a phone already `active` in a given study can't take a second seat there. If a
phone is already `active` in *another* study, the join still succeeds but the confirmation to Travis
flags it ("already in Wed 8am").

### `study_pulse_tokens` (Phase 3)

Per-study, per-month one-tap token. `id`, `study_id`, `period` (`"2026-10"`), `token` unique,
`created_at`, `responded_at`. Response writes `pulse_*` back onto `bible_studies`.

---

## 4. Lifecycle / status

| status | listed to students? | meaning |
|---|---|---|
| `pending_setup` | no | student-started; waiting on Travis to set location + confirm |
| `forming` | yes, if `accepting_signups` and seats open | Travis-led, filling toward four |
| `full` | no | four members, still Travis-led, not yet self-running |
| `activated` | only if `accepting_signups` was flipped true (a seat opened) | self-running without Travis |
| `paused` | no | temporary break (finals, winter/summer) — `break_plan` set |
| `ended` | no | done; kept for history |

Status is set by Travis (or a leader, for `paused`/pulse). Nothing here is inferred from attendance —
see §8.

---

## 5. Student page — `/iowa/studies`

Its own slug, **off the header nav**. This is the page Travis opens in conversations and QRs on a
card — the primary surface. (The landing-page funnel is secondary; Phase 2, §11.)

### Filter-first — never a wall of 100

1. Student picks the **day(s) + rough time** they're free — reuse the `DAYS` / `BLOCKS` grid from
   `app/iowa/page-content.tsx`, but as a *filter*, not a submission.
2. Show only studies **open at those times** (`forming` or seat-open `activated`, `accepting_signups`,
   `members < capacity`). Typically 0–5 results. Group by day, then time.
3. Multiple studies at the same slot is normal and unlimited — differentiate by **location**:
   `Wed 8:00a · Catlett Hall lobby · 2 spots` / `Wed 8:00a · IMU 2nd floor · 1 spot`.
4. Nothing open at their time → **"No open Bible study then. Start one — you'll be first, and we'll
   help fill it."**

### Join (instant)

Fields: **name, phone, email** (all required) + **year** (optional, one tap). One honest line at the
button: *"Your name and number are shared with the others in your study so you can coordinate."*

On submit, if a seat is open: seat taken immediately (no waitlist, no approval). Then §6 fires.
If the study filled in the meantime: "That one just filled — here are other open times / start one."

### Start a new study

Student picks day + time (location unknown to them). Creates a `bible_studies` row `pending_setup`
with that student as member #1. **Not listed** until Travis sets the location and flips it to
`forming`. Student sees: *"You're first in a new Wed 8:00a study. Travis will text you the location,
and we'll help fill it."* Travis gets an email.

### Per-study link

`/iowa/studies/<id>` — a single study's card + join. For texting one specific study to a student.

### No waitlist — by design

Full study = closed. If a seat later opens, the study simply reappears in results. A student with no
open option is pushed to **start one**, not to queue for a closed group.

---

## 6. Confirmation, calendar, contact sharing

**To the joining student, immediately (Resend, via `lib/email.ts` pattern):**
- Which study, day, time, location, leader's name.
- *"Someone from the study will text you this week."*
- **`.ics` attachment** for the recurring weekly meeting (`RRULE:FREQ=WEEKLY`) — universal, covers
  "my school calendar" / "a different calendar." Generated in-app, no dependency. Plus a one-tap
  "Add to Google Calendar" link.
- The group's contact card: other **active** members' names + numbers, and the leader's. *"Here's
  your study — reach out."*

**To the existing roster + leader, on a new join:**
- Members: *"[Name] just joined your Wed 8:00a study — here's their number, say hi."*
- Leader gets a distinct nudge with the new member's name + number and a prompt to send a welcome
  text. Leaders are trained to actually do this; the system just makes it the obvious next step.

**To Travis, on every join and every start-new:** the signup detail (reuse the
`sendTableSignupEmail` shape), with the duplicate-guard flag when relevant.

---

## 7. Admin — `/iowa/admin`

Shared-password gate (`IOWA_ADMIN_PASSWORD`, cookie `iowa_admin`, `lib/iowaAdminAuth.ts` mirroring
`lib/adminAuth.ts`). Middleware protects `/iowa/admin` and `/api/iowa/admin/*`.

### Views

- **All studies, current semester** — filterable table: day/time, location, status, `X/4`, leader,
  last roster change, `pulse_status`, notes. Sort/filter by day, status, below-capacity.
- **Pending setup** — student-started studies awaiting location + confirm.
- **Needs attention** — derived, no manual input: `members < capacity` on a `full`/`activated`
  study (lost someone), OR `forming` for 3+ weeks (never filled), OR `pulse_status = red` / no pulse
  for 2 months.

### Actions

- Create a study (day, time, location, capacity, leader fields, semester).
- Confirm a `pending_setup` study (add location → `forming`).
- Edit roster: add member manually, mark `dropped`, edit contact/notes.
- Change status; toggle `accepting_signups`.
- Edit `notes`, `break_plan`, leader fields.
- **Roll to next semester** (§9).

---

## 8. Tracking — the deliberate minimum

Weekly attendance is **not** tracked. It won't survive past ~20 studies and leaders won't reliably
post it. The system tracks only what's structural and self-maintaining:

- **Roster size** — known from `bible_study_members`. `3/4` flags itself.
- **Status** — changes rarely, set by hand.
- **Last roster change** — automatic (`joined_at` / `left_at`).
- **Monthly leader pulse** — §10. Not attendance: one tap, 🟢/🟡/🔴 + optional note, once a month.

"Needs attention" (§7) is derived entirely from the above.

---

## 9. Semester-to-semester retention

Designed in from the start — the messy part of campus ministry.

- **Nothing hard-deleted.** Member history keeps `joined_at` / `left_at`. `parent_study_id` links a
  new-semester study back to its origin.
- **End of term:** batch email to every `active`/`full`/`activated` study — *"Check your spring
  schedules and find a time you can all keep."*
- **Rolls forward:** admin "Roll to next semester" creates a new `bible_studies` row, new `semester`,
  `parent_study_id` = old id, roster copied as `active` members, prompts for new day/time/location.
- **Can't agree on a time:** members are not rolled; they re-enter the pool as individuals and use
  the normal find-a-time / start-one flow. Their prior-study history stays on record.
- **Breaks (winter/summer):** study → `paused`, `break_plan` set. Encouragement copy: *"Over winter
  break, stay connected once a week over Meet."*
- **Retention metrics** (later analytics pass): % of studies continuing term-over-term; % of students
  in *a* study term-over-term.

---

## 10. Monthly leader pulse — delivery matters

Travis's point 2026-08-25: a leader will **not** visit a website to check in. The pulse must come to
them and answer in one tap.

**v1 (Phase 3): email with one-tap response links.**
- Monthly cron generates a `study_pulse_tokens` row per active study.
- Email to `leader_email`: *"You lead the Wed 8:00a Bible study. How's it going?"* — three big
  buttons linking to `/iowa/pulse/<token>?v=green|yellow|red`.
- The link lands on a tiny "Got it — thanks" page with an optional note field. No login. Token is
  single-period.
- Response writes `pulse_status` / `pulse_note` / `pulse_at` onto the study.
- No response = "no check-in this month," itself a mild signal in the Needs-attention view.

**Later: SMS delivery.** Higher open rate, but needs Twilio + A2P 10DLC carrier registration (weeks,
recurring cost). The token mechanism is identical, so moving delivery from email to text later is a
swap, not a rebuild. Defer until there's a broader texting need.

---

## 11. Landing-page swap (Phase 2)

Today `app/iowa/page-content.tsx` has the availability grid → `/api/iowa-signup` → email Travis.
Replace that section with a compact version of the `/iowa/studies` module (open studies at a picked
time, or start one). Knock-on:
- `/api/iowa-signup` (grid email) is superseded by join / start-new. Keep the honeypot + validation
  approach in the new routes.
- `REQUESTED` (fake social proof, currently empty) → **real** counts: "14 Bible studies running · 4
  open this week."
- Landing copy still says "tables of four" — light pass to "Bible study," within the
  `SOURCE-OF-TRUTH.md` voice. Confirm with Travis before editing that copy.

Kept for Phase 2 deliberately: the standalone `/iowa/studies` page ships and gets proven in real
conversations first, before the live funnel is touched.

---

## 12. Google Calendar sync (Phase 3)

For Travis's own tracking, not core.
- A dedicated **"ARK Iowa Bible Studies"** calendar, separate from his personal one.
- Each study with a set day/time → one recurring event; study `id` in the event's extended
  properties as the key. Patch on roster/status change; delete on `ended`.
- Event summary e.g. `ARK Iowa · Wed 8:00a · Catlett (activated)`, roster in the description.
- **Critical:** this calendar must be left OUT of the conflict-check list on Travis's 1:1
  Appointment Schedule, so activated studies he's no longer attending never mark him busy. That's a
  config choice in Google, no code.
- Auth: a Google service account (domain-wide delegation) so the server can write.

---

## 13. Reminders (Phase 2)

One reminder, the **evening before**. Vercel cron (add to `vercel.json` `crons`), ~6pm CT:
find studies meeting tomorrow, email active members. Copy in the `booking-copy.md` voice: *"Tomorrow,
8:00a. Catlett Hall lobby. Text the group if anything's changed."*

Volume: ~50 studies × 4 ≈ 200/week, spread across weekdays (~30–40/day) — inside Resend limits even
before the $20 tier. No morning-of. Real SMS reminders are the Twilio project from §10, deferred.

---

## 14. 1:1 booking (external — not built here)

Coaching / prayer / Bible questions with Travis. Irregular, one person, meet at the space.
- **Google Appointment Schedule** — Travis sets his hours; it checks his *personal* calendar for
  conflicts and sends confirmations. Zero build.
- Add `/iowa/meet` in this app as a redirect (302) to that booking URL, so there's a short link to
  text or print.
- Regenerate **one** QR → `arkidentity.com/iowa/meet`. **Delete** the stale `qr-study` / `qr-connect`
  in `messaging/iowa/booking/` — they point at routes that never existed.
- Not in the header nav. A private link Travis sends to students he's already met.

---

## 15. Env vars

| var | where | note |
|---|---|---|
| `IOWA_ADMIN_PASSWORD` | Vercel | new; gates `/iowa/admin` |
| `RESEND_API_KEY` | Vercel | already set (feed). Confirm it's in this project's prod env. |
| `EMAIL_FROM` | Vercel | already set (feed) — verified sending identity |
| `IOWA_INBOX` | — | not needed; `sendTableSignupEmail` already falls back to `travis@arkidentity.com`. Safe to delete the `||` in `lib/email.ts`. |
| `GOOGLE_*` (service account) | Vercel | Phase 3, calendar sync only |

---

## 16. Build phases

**Phase 1 — the system** — CODE COMPLETE 2026-08-25 (build + typecheck green; not yet run against a live DB)
- [x] Migration `supabase/migrations/006_iowa_bible_studies.sql` — `bible_studies`, `bible_study_members`, indexes, duplicate-guard partial unique index, RLS on / no policies
- [x] `lib/iowaAdminAuth.ts` + `proxy.ts` gate for `/iowa/admin` and `/api/iowa/admin/*` (own password `IOWA_ADMIN_PASSWORD`, cookie `iowa_admin`); `/iowa/admin/login` page + `/api/iowa/admin/login`
- [x] `lib/bibleStudies.ts` (server data layer) + `lib/bibleStudyFormat.ts` (pure helpers, client-safe) + `lib/ics.ts` (.ics + Google Calendar URL)
- [x] `/iowa/studies` — filter-first browse (`components/iowa/StudiesBrowser.tsx`), instant join (`JoinForm.tsx`), start-new → `pending_setup`
- [x] `/iowa/studies/<id>` — per-study card + join
- [x] Join / start APIs — capacity check, duplicate guard (partial unique index + explicit check), honeypot, loose validation; `GET /api/iowa/studies` for post-join refresh
- [x] `GET /api/iowa/studies/<id>/ics` — recurring VEVENT, no PII, unauthenticated
- [x] Emails in `lib/email.ts`: `sendStudyConfirmation` (with .ics + gcal links), `sendStudyRosterAlerts` (existing members + sharper leader nudge), `sendStudyAdminAlert` (join + start, with duplicate-phone flag) — all fired `void` so a slow send can't fail the join
- [x] `/iowa/admin` (`components/iowa/IowaAdmin.tsx`) — pending-setup / needs-attention / all-by-day, per-study editor (location, status, accepting, capacity, leader, notes, break_plan), roster add / drop / restore, new-study form; rendered bare (BrochureShell excludes `/iowa/admin`)
- [ ] **Travis / deploy:** run migration 006 on the ministry-feed Supabase; set `IOWA_ADMIN_PASSWORD` (and confirm `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `EMAIL_FROM`, `NEXT_PUBLIC_SITE_URL`) in Vercel prod; optional `IOWA_SEMESTER` (defaults to "Fall 2026")
- [ ] One durable QR → `arkidentity.com/iowa/studies` (any generator; not built here)
- [ ] Live smoke test once the migration is applied

**Phase 2 — funnel + reminders**
- [ ] Evening-before reminder cron (`vercel.json`)
- [ ] Swap landing-page grid for the studies module; `REQUESTED` → real counts
- [ ] Landing copy "table" → "Bible study" pass (confirm with Travis)
- [ ] Retire `/api/iowa-signup`

**Phase 3 — calendar, pulse, retention**
- [ ] Google Calendar sync (separate calendar, service account)
- [ ] Monthly leader pulse (`study_pulse_tokens`, one-tap email, `/iowa/pulse/<token>`)
- [ ] Roll-to-next-semester tooling; retention metrics
- [ ] Revisit SMS delivery for pulse + reminders (Twilio / A2P 10DLC)

**Travis, in parallel (this week)**
- [ ] Stand up Google Appointment Schedule for 1:1s; send the booking URL
- [ ] Then: `/iowa/meet` redirect + regenerate that one QR; delete `qr-study` / `qr-connect`
- [ ] Confirm `RESEND_API_KEY` + `EMAIL_FROM` in this project's prod env; submit one real
      `/iowa` signup and confirm it lands

---

## 17. Deferred / open

- Campus **map view** of studies (pins by location) — nice, not v1.
- Retention analytics dashboard.
- SMS (pulse + reminders) — Twilio + carrier registration.
- Graduation path: a study → DNA group in the DNA app. Separate system, later, Travis-initiated.
- Landing-page copy reconcile beyond the "table" → "Bible study" swap.
