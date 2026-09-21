-- ARK Iowa — semesters + next-semester planning (turnover).
-- See docs/IOWA-CAMPUS-TASKS.md → "Semester turnover".
--
-- Replaces the IOWA_SEMESTER env string: which semester it is now comes from
-- these dates. A study only meets between its semester's starts_on and
-- ends_on (and not on school breaks, migration 017). Next semester's studies
-- can be planned and signed up for from signup_opens — a group continues or
-- multiplies into it, planned by staff in the admin or by the student leader
-- through a private link that's emailed automatically when signup opens.
-- Past-semester studies are ended automatically.
--
-- Server-only like 006+: RLS on, no policies, no grants.

create table if not exists iowa_semesters (
  name          text primary key,              -- matches bible_studies.semester
  starts_on     date not null,                 -- first day of classes
  ends_on       date not null,                 -- last day of finals
  signup_opens  date not null,                 -- next-semester planning + public signup open
  note          text,
  check (ends_on > starts_on)
);
alter table iowa_semesters enable row level security;

-- U of Iowa registrar (catalog.registrar.uiowa.edu/calendar, read 2026-09-21).
-- Spring signup opens the Monday after Thanksgiving: spring early registration
-- starts Nov 9 and runs ~3 weeks by class standing, so by then students know
-- their schedules. Fall 2027's first day isn't published yet (estimated).
insert into iowa_semesters (name, starts_on, ends_on, signup_opens, note) values
  ('Fall 2026',   '2026-08-24', '2026-12-18', '2026-04-27', null),
  ('Spring 2027', '2027-01-19', '2027-05-14', '2026-11-30', 'Opens the Monday after Thanksgiving; spring registration runs from Nov 9.'),
  ('Summer 2027', '2027-05-17', '2027-08-06', '2027-04-26', 'Summer sub-sessions. Mostly online studies.'),
  ('Fall 2027',   '2027-08-23', '2027-12-17', '2027-04-26', 'Dates estimated. Update when the registrar publishes Fall 2027.')
on conflict (name) do nothing;

alter table bible_studies
  add column if not exists plan_token    text,          -- the student leader's private "plan next semester" link
  add column if not exists plan_sent_at  timestamptz,   -- link emailed
  add column if not exists planned_at    timestamptz,   -- next semester settled (continued, multiplied, or not continuing)
  add column if not exists plan_note     text;          -- e.g. 'Not continuing'
create unique index if not exists bible_studies_plan_token_idx on bible_studies (plan_token);
