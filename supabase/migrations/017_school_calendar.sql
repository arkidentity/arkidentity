-- ARK Iowa — the University of Iowa school calendar (breaks, finals, summer).
-- See docs/IOWA-CAMPUS-TASKS.md → "School calendar".
--
-- A period with pauses_in_person = true pauses every in-person Bible study on
-- those dates: no student reminder, no confirm email, no first-study check,
-- and the week comes off Google Calendar. Online studies keep meeting — that's
-- the point of them (breaks, summer, the online community). Every period also
-- drives the "heads up, that's finals week" warnings when scheduling.
--
-- Server-only like 006+: RLS on, no policies, no grants.

create table if not exists iowa_school_periods (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  kind              text not null default 'break'
                      check (kind in ('break', 'finals', 'holiday', 'between_semesters', 'other')),
  starts_on         date not null,
  ends_on           date not null,
  pauses_in_person  boolean not null default true,
  note              text,
  created_at        timestamptz not null default now(),
  check (ends_on >= starts_on)
);
create index if not exists iowa_school_periods_dates_idx on iowa_school_periods (starts_on, ends_on);
alter table iowa_school_periods enable row level security;

-- Online studies (Google Meet) keep going through breaks and summer.
alter table bible_studies add column if not exists online boolean not null default false;

-- Seed: University of Iowa 2026–27, from the registrar's General Catalog
-- (catalog.registrar.uiowa.edu/calendar, read 2026-09-21).
insert into iowa_school_periods (name, kind, starts_on, ends_on, pauses_in_person, note) values
  ('Labor Day',              'holiday',           '2026-09-07', '2026-09-07', false, 'No classes. Studies still meet unless you skip them.'),
  ('Thanksgiving break',     'break',             '2026-11-22', '2026-11-29', true,  'Fall break per the registrar. Classes resume Nov 30.'),
  ('Finals week',            'finals',            '2026-12-14', '2026-12-18', true,  'Last day of classes Dec 11.'),
  ('Winter break',           'between_semesters', '2026-12-19', '2027-01-18', true,  'Students gone. Spring classes start Jan 19 (Jan 18 is MLK Day).'),
  ('Spring break',           'break',             '2027-03-14', '2027-03-21', true,  'Classes resume March 22.'),
  ('Finals week',            'finals',            '2027-05-10', '2027-05-14', true,  'Last day of classes May 7.'),
  ('Summer',                 'between_semesters', '2027-05-15', '2027-08-22', true,  'Most students gone; summer sub-sessions run May 17 to Aug 6. Fall 2027 start date not published yet, so adjust the end date when it is.');
