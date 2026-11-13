-- 060: "How'd it go?" — the student leader's weekly check-in from Daily DNA (2026-11-13).
-- One row per study per meeting date: did it meet, about how many came, and an
-- optional note for staff. Lighter than name-by-name attendance (037), which stays
-- optional. When a study didn't meet or the leader left a note, the staff member
-- on point gets a task (task_id, so a re-save doesn't make a second one).
--
-- Server-only like 006+: RLS on, no policies, no grants.

create table if not exists iowa_study_checkins (
  study_id    uuid not null references bible_studies(id) on delete cascade,
  occurrence  date not null,
  met         text not null check (met in ('yes', 'no', 'cancelled')),
  headcount   int check (headcount between 0 and 200),
  note        text,
  task_id     uuid references iowa_tasks(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  primary key (study_id, occurrence)
);
alter table iowa_study_checkins enable row level security;
