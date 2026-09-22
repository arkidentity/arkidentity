-- ARK Iowa — check-in report (students who've gone quiet).
-- See docs/IOWA-CAMPUS-TASKS.md → "Check-in report".
--
-- Staff and interns pull a list of students who've drifted (never showed,
-- dropped, gone dormant, never placed) and reach out — not always to get them
-- back in a study, just to see how they're doing. Logging a check-in keeps two
-- people from texting the same student the same week, and tells whoever
-- follows up next what's already been done.
--
-- Server-only like 006+: RLS on, no policies, no grants.

-- Why someone went dormant, and when. Dropping from a study already records a
-- reason (013); this covers students who drift without a seat to drop.
alter table campus_students
  add column if not exists dormant_reason text
    check (dormant_reason in ('unresponsive', 'schedule_changed', 'not_interested', 'lost_touch', 'hard_season', 'other')),
  add column if not exists dormant_note text,
  add column if not exists dormant_at timestamptz;

-- Anyone already dormant: best guess is the last time the row changed.
update campus_students set dormant_at = updated_at where status = 'dormant' and dormant_at is null;

-- One row per reach-out. Kept deliberately thin: outcome + optional note.
create table if not exists campus_checkins (
  id          uuid primary key default gen_random_uuid(),
  contact_id  uuid not null references contacts(id) on delete cascade,
  staff_id    uuid references iowa_staff(id) on delete set null,
  outcome     text not null check (outcome in ('talked', 'replied', 'no_reply')),
  note        text,
  created_at  timestamptz not null default now()
);
create index if not exists campus_checkins_contact_idx on campus_checkins (contact_id, created_at desc);

alter table campus_checkins enable row level security;

-- Outings and hangouts: a lower-pressure invite than a Bible study.
insert into iowa_item_types (kind, name, sort)
select 'event', 'Social', 7
 where not exists (select 1 from iowa_item_types where kind = 'event' and lower(name) = 'social');
