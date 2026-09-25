-- ARK Iowa — when someone can't meet.
-- See docs/IOWA-CAMPUS-TASKS.md → "Who's free?".
--
-- Not a calendar: a weekly pattern per semester. Class, gym, work, practice,
-- church — whatever makes a person unavailable at the same time most weeks.
-- Semester-scoped because a schedule is only true until the term changes, and
-- a stale schedule is worse than none (it would hand someone a study they
-- can't make).
--
-- Times are local wall-clock like bible_studies. Null start/end = all day
-- (Saturday home games, a day someone is simply out).
--
-- Server-only like 006+: RLS on, no policies, no grants.

create table if not exists iowa_availability (
  id          uuid primary key default gen_random_uuid(),
  staff_id    uuid not null references iowa_staff(id) on delete cascade,
  semester    text not null,                 -- matches iowa_semesters.name
  day_of_week smallint not null check (day_of_week between 0 and 6),
  starts_at   time,                          -- null = all day
  ends_at     time,
  label       text,                          -- 'Class', 'Gym', 'Soccer' — so a clash reads as a reason
  created_at  timestamptz not null default now()
);
create index if not exists iowa_availability_staff_idx on iowa_availability (staff_id, semester, day_of_week);

-- One private link per person per semester, like the plan links in 018: they
-- fill in their own schedule without a login, and it has to be renewed each
-- term — a schedule nobody re-confirmed is a schedule nobody should trust.
create table if not exists iowa_availability_links (
  id           uuid primary key default gen_random_uuid(),
  staff_id     uuid not null references iowa_staff(id) on delete cascade,
  semester     text not null,
  token        text not null unique,
  sent_at      timestamptz,
  submitted_at timestamptz,               -- null = still owed
  created_at   timestamptz not null default now()
);
create unique index if not exists iowa_availability_links_one_idx
  on iowa_availability_links (staff_id, semester);

alter table iowa_availability enable row level security;
alter table iowa_availability_links enable row level security;
