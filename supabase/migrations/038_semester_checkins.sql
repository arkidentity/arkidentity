-- ARK Iowa — returning students' check-in for next semester.
-- See docs/IOWA-CAMPUS-TASKS.md → "Semester check-in".
--
-- When next semester's signup opens (Spring: Nov 30), every active student in
-- a current group gets a personal link: "In for Spring? When are you free?"
-- Their free times save to campus_students.free_slots for that semester (034/
-- 035), so the group planner sees who can make the new time, and anyone not
-- placed shows in "Who's waiting". One reminder a week later to non-answerers.
--
-- Server-only like 006+: RLS on, no policies, no grants.

create table if not exists iowa_semester_checkins (
  id           uuid primary key default gen_random_uuid(),
  token        text not null unique,
  contact_id   uuid not null references contacts(id) on delete cascade,
  semester     text not null,
  response     text check (response in ('yes', 'no', 'unsure')),
  note         text,
  sent_at      timestamptz,
  reminded_at  timestamptz,
  answered_at  timestamptz,
  created_at   timestamptz not null default now(),
  unique (contact_id, semester)
);
alter table iowa_semester_checkins enable row level security;
