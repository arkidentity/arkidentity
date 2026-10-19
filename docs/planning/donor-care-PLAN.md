# Donor Care — Plan (draft 2026-10-19)

**Owner:** Kimberly (donor care). Travis = builder + second user.
**Where:** `ark-identity` `/admin`, built on the existing `contacts` table (Mig 007). One people list — a donor is a contact with giving history, never a separate list.

## What we have today
- `contacts` (+ tags, segments, events, invites), Quick Add, newsletter digest + `sends`, ministry feed.
- **Nothing about giving.** No gifts, no pledges, no donor status, no touch log, no automations beyond the digest.

## The idea in one line
Every morning Kimberly opens **Donor Care → Today** and sees a short list of people to thank, check on, or celebrate — with a suggested note ready to personalize. The system does the remembering; she does the caring.

---

## 1. The donor record (a contact, extended)
- Household: spouse name, kids, "Dear ___" greeting, mailing address.
- Dates: birthday(s), anniversary, first-gift date, "came to know ARK through…".
- Care notes: prayer requests, life events (new job, baby, illness, loss), **financial hardship flag** (private, gentle — pauses asks, keeps care going).
- Preferences: email / text / mail / call; how often they want updates; "do not ask."
- Assigned to: Kimberly / Travis.

## 2. Giving
- **Gifts:** date, amount, method (card, ACH, check, cash, stock, DAF), fund/designation, source platform, receipt sent.
- **Recurring plans:** amount, frequency, start, status (active / paused / ended / failed card).
- **Derived (never typed in):** lifetime, last 12 months, average gift, last gift date, frequency, trend (up / steady / down).
- **Donor stage, computed nightly:**
  `Prospect → First-time → Regular → Recurring → Major` and the care states
  `Lapsing (late vs. their own rhythm) · Paused (they told us) · Dormant (12+ months) · Hardship (flagged) · Lost`.
  "Late" is measured against *that person's* pattern — a monthly giver 45 days out is lapsing; a yearly December giver isn't.

## 3. Touches (the care log)
Every call, text, email, card, visit, meal, prayer — one tap to log, with a note. Emails the system sends log themselves. This powers "haven't heard from them in a while."

## 4. Kimberly's Today screen (the heart of it)
Ranked, short, done-able:
- 🎂 Birthdays / anniversaries this week
- 🙏 Thank-yous owed (new gift, first gift — within 48 hrs)
- ⚠️ Lapsing or failed card — check in, don't ask
- 🌱 First-time donors — welcome series step due
- 💬 No touch in 90+ days (tunable per stage)
- ❤️ Prayer follow-ups ("Ask how the surgery went")
Each item: **Done / Snooze / Skip**, plus a draft note she can edit. Weekly email to Kimberly: "You cared for 14 people this week. 6 waiting."

## 5. Sending (batch + personal)
- Segment builder (exists) gains giving filters: stage, lifetime range, method, last gift, hardship-excluded.
- Templates with merge fields + a personal line: newsletter, ministry update, prayer request, Christmas/Easter/Thanksgiving, year-end giving statement, birthday, anniversary, thank-you, welcome series.
- Optional AI draft per person using their notes (same pattern as the feed's AI partner updates), always reviewed before send.
- Sends from Kimberly's name where it fits.

## 6. Automations (all reviewable, nothing silent)
- Birthday / anniversary emails — auto, or queued for her approval (her choice per template).
- Gift received → thank-you task (auto email for small recurring; personal card for first/large).
- First gift → 3-step welcome over 30 days.
- Recurring card fails → gentle task, not an auto-dun.
- Lapsing → care task at 1.5× their usual gap.

## 7. Reports for Travis
Monthly giving, recurring base (MRR-style), retention %, new vs. lost donors, at-risk dollars, care activity. One page.

---

## Build in phases
See **Revised phases** below.

Lab first: `/admin/lab/donor-today` with mock donors so Kimberly can tap through it before we build.

## Decisions (Travis, 2026-10-19)
1. **Four ways people give:**
   | Source | Who it goes to | Tax-deductible | How gifts get into our system |
   |---|---|---|---|
   | Square | ARK Identity LLC | No | **Automatic** — Square API (payments + customers), pulled nightly |
   | Global Service Associates (DonorView) | Nonprofit covering | Yes | Monthly CSV export from DonorView, upload + match (check whether GSA can give API access later) |
   | Zelle | Direct | No | Kimberly logs it (one quick form) |
   | Check | Varies | Depends who it's made out to | Kimberly logs it |
   Each gift records its **route** (LLC / GSA / direct) so reports never mix deductible and non-deductible money.
   **GSA has two accounts (clarified 10/19):** *Travis personal support* and *ARK ministry* (used mostly for ministry expenses and reimbursements). Every GSA gift records which account it went to (`gsa_account`: personal / ark). Donor care counts both as that person's giving; the report shows them split, so you can see support vs. ministry-expense money. Expenses and reimbursements stay out of this system — it tracks money in, not money out.
2. **We send no receipts or tax statements.** GSA does that for its donors. Our thank-yous are personal notes. (Year-end statements dropped from the plan.)
3. **~60–65 donors.** Small enough to be personal: the Today screen matters more than dashboards. Reports stay to one page.
4. **Kimberly gets her own login.** Admin moves from one shared password to named users (Travis, Kimberly). Kimberly sees Donor Care + Contacts; not the feed (for now). Hardship notes are visible only to the two of them.
5. **Birthday/holiday emails: undecided.** Build them as "queued for approval" first; switch any template to automatic later once Kimberly trusts it.
6. **Kimberly holds every donor.** She can hand someone to Travis: **"Travis should reach out"** creates a task on Travis's own Today list with her note. Travis can still log touches on anyone.
7. **Travis's monthly check moves into the system.** The "who's late / who dropped off" review is what the nightly status does; a monthly email to both of them shows changes.

## Google Contacts as the one source (reverses the 2026-08-31 "no Google sync" ruling)
**Yes, it's possible.** Google's People API reads (and can write) contacts, including birthdays, anniversaries ("events"), addresses, phones, emails, and labels. It gives a "what changed since last time" token, so a nightly sync only pulls edits.

**How it would work:**
- **Google owns the who:** name, phones, emails, address, birthday, anniversary, spouse. Edit them in Google (phone, Gmail); ARK picks it up overnight. In ARK those fields show as read-only with "edit in Google."
- **ARK owns the care:** gifts, status, touches, prayer notes, hardship, preferences, tags/segments. These never go to Google.
- **Each ARK contact stores its Google ID**, so a matched person stays matched even if their name or phone changes.
- **Not everyone in Google comes in.** Only contacts with a chosen Google label (e.g. `ARK`) sync — your phone has plumbers and dentists too. Adding the label in Google adds them to ARK.
- **Later (optional):** ARK's Quick Add writes new people back into Google, so the lobby flow still ends up on your phone.

**The one-time cleanup (the hard part, done once):**
1. Pull every labeled Google contact.
2. ARK proposes matches against existing ARK contacts by email, then phone, then name. You see three piles: **Matched** (confirm in bulk), **Maybe** (pick), **Only in one place** (link, add to Google, or archive).
3. Where both have a value and they differ, you pick the winner once; after that Google wins.
Expect an hour or two of tapping for a few hundred people.

**Table changes needed:** `contacts` gets `google_resource_name`, `birthday`, `anniversary`, `spouse_name`, `street`/`postal_code` (city/state already exist), `synced_at`. A `contact_sync_log` table records what changed so nothing changes silently.

## Revised phases
1. **Google sync + cleanup screen + named logins** (foundation — everything else hangs on clean people).
2. **Donor record + gifts (Zelle/check form, DonorView CSV upload) + touches.**
3. **Square auto-import + nightly status + Kimberly's Today screen + "Travis should reach out."**
4. **Templates + birthday/holiday emails (approval queue) + giving filters in segments.**
5. **AI-drafted personal notes + one-page report.**

## Decisions (Travis, 2026-10-19, round 2)
- **Source of truth = the `thearkidentity` Gmail's Google Contacts.** All contacts, not only donors. It's a small list, so sync **every** contact (no "belongs in ARK" label needed); archive in ARK anyone who isn't ministry.
- **Google labels = ARK tags, one system.** Each ARK tag maps to a Google label of the same name, and tags sync **both ways** (label someone on the phone → tagged in ARK; tag in ARK → labeled in Google). Part of the cleanup: Claude proposes a clean label set from both sides (merge duplicates, drop dead ones), Travis approves, then we relabel. Location stays in fields, not labels (2026-08-31 ruling).
- **The Google Sheet donor pipeline is retired** once its data is imported. ARK becomes the pipeline: `Referred → Prospect → Met / shared vision → Asked → First gift → donor stages`. Each prospect stores who referred them, next step, and next-step date (shows on Today).
- **Yearly referral ask.** Once a year (pick a month), each donor gets a personal note: "Who are two or three people we should meet and share the vision with?" A simple reply form adds them as Referred, linked to the referrer; replies show on Today, and the referrer gets a thank-you.
- **DonorView export is available from GSA** and donor emails are already on file, so gift matching is by email.

## Next month: unify (phase 1 work)
1. Travis shares: Google Sheet pipeline (export or link), current Google label list, one DonorView export, one Square sample month.
2. Claude maps the sheet columns + DonorView columns to the new tables and proposes the unified tag/label set.
3. Build Google sync (read first, then two-way labels) + the matching screen.
4. Travis/Kimberly work the matching piles and relabel; Claude imports the pipeline sheet.
5. Sheet goes read-only; ARK is the one place.

## The current Google Sheet (read 2026-10-19) → how it maps
Three tabs. No names or amounts copied here; this is the shape only.

**Summary** — "Secured Monthly" total ($6,505) and "Accepted Monthly." → becomes a live number on the report page (sum of active monthly gifts), never typed.

**Donor_Pipeline** (~108 people): Partners · Email · Stage · Giving · Frequency · Method · Last Contact · Next Follow-up · Date First Gift · Notes
- **Stage values in use:** Secured (46), Paused (19), Accepted (11), Pitching (11), Not now (8), Prospect (7), a few others. These are your real words, so ARK keeps them:
  `Prospect → Pitching → Accepted (said yes, not started) → Secured (giving)`, plus `Paused` and `Not now`. ARK adds the computed care flags on top (Lapsing / Dormant) for Secured people whose gifts stop arriving.
- **Frequency:** Monthly (77), Periodically (13), Weekly (1) → recurring plan frequency; "Periodically" = no fixed rhythm, so lapsing uses a 12-month window.
- **Method:** GSA (31 — sheet doesn't say which GSA account; import marks them "unknown" and Kimberly sets each once, or the DonorView export tells us), ARK (18 = Square), Zelle (9), Check (2), "GSA ARK" (2 = gives both ways → two plans).
- **Giving** = pledged amount → recurring plan amount, until real gifts arrive from Square/DonorView and replace guesswork with actuals.
- **Last Contact, Next Follow-up, Date First Gift, Notes are all empty.** That's the gap the system fills: the touch log and the Today screen create these instead of asking anyone to type them.
- **Partners is a couple's name** ("X and Y Lastname"); one Email cell sometimes holds a name + email. → Import splits into a household with spouse name; Claude flags odd rows for a quick look.

**Referrals_Prospects** (~66 people): Date Added · Stage · Name · Phone · Email · Referral Source · Last Contact · Next Follow-up · Notes
- **Referral Source is filled for 47** — a real referral network (top referrers gave 3–5 names each). → becomes `referred_by` linking two contacts, so each donor's page shows who they've introduced and the yearly ask can thank them.
- Stage mostly blank → import as `Referred`.

**Import order:** Google Contacts sync first (people), then this sheet attaches stage/plan/referrer to the matched person by email, then phone, then name.

## Our tables (designed for us, not copied from the sheet)
| Table | Holds |
|---|---|
| `contacts` (extended) | the person: Google-synced identity, household/spouse, birthday, anniversary, preferences, hardship flag (private), `referred_by` |
| `donor_profiles` | one per giver: pipeline stage (Prospect/Pitching/Accepted/Secured/Paused/Not now), computed care flag, owner (Kimberly/Travis), "do not ask" |
| `giving_plans` | what they said they'd give: amount, frequency, route (Square/GSA/Zelle/check), GSA account (personal/ark), status |
| `gifts` | what actually arrived: date, amount, route, GSA account, source row id (so re-imports never double count) |
| `touches` | every call/text/card/visit/email + note, who did it |
| `care_tasks` | Today items: type, due date, assigned to, done/snoozed; includes "Travis should reach out" |
| `life_notes` | prayer requests + life events with a follow-up date |
| `gift_imports` | each uploaded DonorView/Square file + what it matched, for undo |
| `contact_sync_log` | what Google sync changed |
| `message_templates` + `message_queue` | birthday/holiday/thank-you/referral-ask drafts waiting for approval |

## What to ask GSA for (DonorView export)
A **gift/transaction export** (not just a donor list), CSV or Excel, covering both accounts, with: donor name, email, gift date, amount, **fund/account designation**, payment method, recurring yes/no, and the DonorView gift ID. One full year back is ideal for the first import, then monthly.

## Labels vs. ARK-only (proposal 2026-10-19)
Rule: **a Google label = something you'd want to see or filter on your phone.** Everything that changes often, or only matters for donor care, stays in ARK only.

**Google labels (two-way with ARK tags):**
| Label | Who | Today |
|---|---|---|
| Financial Partner | gives (any stage from Accepted on, incl. Paused) | exists ("Financial partners" → rename) |
| Prayer Partner | prays for ARK, may not give | exists |
| Prospect | in the pipeline: referred, pitching, not now | new |
| Worship Night | wants worship-night invites | new (ARK tag exists) |
| ARK Iowa | students, leaders, parents | new (ARK tag exists) |
| Ministry Partner | pastors/churches/leaders you work with | new (ARK tag exists) |
| ARK Info | **? — Travis to identify.** If it means "gets the newsletter," it's dropped as a label: ARK already has a subscribed switch. | exists |
| ~~Life Church~~ | deleting | exists |

**ARK only (never labels):** pipeline stage (Secured/Paused/Accepted…), care flags (lapsing, dormant, hardship), giving amounts/method, who's been invited to which event (`contact_invites` already tracks this), location (fields: city/state/region), newsletter subscribed.

## Two-way sync (decided possible, 2026-10-19)
Yes. Google's People API can write, so: edit a phone, address, birthday, or label in ARK → it's in Google within minutes; edit on your phone → ARK picks it up on the next sync (nightly + a "Sync now" button).
- **Fields that go both ways:** name, phones, emails, address, birthday, anniversary, spouse, labels.
- **Same field changed in both places between syncs** → ARK doesn't guess; it shows it on a "Check these" list with both values.
- **Deleting:** deleting in Google archives in ARK (gift history is never lost). Archiving in ARK does not delete from Google.
- **Every change is logged** (`contact_sync_log`), with undo.
- **Setup once:** Travis signs in to Google from ARK admin and allows contact access. Gotcha: Google expires access every 7 days for apps left in "testing" mode, so the Google Cloud app gets published (it will show an "unverified app" screen to Travis only — fine for our own account).

## Merging what's already in ARK admin
ARK admin already has contacts (32 as of 2026-08-31, some imported partners). The cleanup screen handles duplicates: every Google contact is matched to an ARK contact by email → phone → name; matches merge into one row (ARK keeps its tags, invites, history; Google's values fill in the details), "Maybe" pairs wait for a tap, and ARK-only people get pushed into Google with their labels. Nothing is deleted.
