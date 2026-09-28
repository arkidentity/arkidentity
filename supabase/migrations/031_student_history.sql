-- ARK Iowa — a student's history: dated notes + a status-change log.
-- See docs/IOWA-CAMPUS-TASKS.md.
--
-- Most of a student's story is already recorded: seats (joined / left / why,
-- per semester), dormant date + reason, and every check-in. Two things weren't:
--   * notes — only one undated text field, never shown in the admin
--   * coming and going — active → dormant → active left no trace
-- This adds a dated, authored notes log and a status-change log so the
-- Students page can show one timeline.
--
-- Server-only like 006+: RLS on, no policies, no grants.

create table if not exists campus_student_notes (
  id          uuid primary key default gen_random_uuid(),
  contact_id  uuid not null references contacts(id) on delete cascade,
  staff_id    uuid references iowa_staff(id) on delete set null,
  body        text not null,
  created_at  timestamptz not null default now()
);
create index if not exists campus_student_notes_contact_idx on campus_student_notes (contact_id, created_at desc);
alter table campus_student_notes enable row level security;

create table if not exists campus_student_events (
  id           uuid primary key default gen_random_uuid(),
  contact_id   uuid not null references contacts(id) on delete cascade,
  staff_id     uuid references iowa_staff(id) on delete set null,
  from_status  text,
  to_status    text not null,
  created_at   timestamptz not null default now()
);
create index if not exists campus_student_events_contact_idx on campus_student_events (contact_id, created_at desc);
alter table campus_student_events enable row level security;

-- Carry over any note that was already on a student, as their first entry.
insert into campus_student_notes (contact_id, body, created_at)
select contact_id, btrim(notes), coalesce(updated_at, created_at)
  from campus_students
 where notes is not null and btrim(notes) <> ''
   and not exists (select 1 from campus_student_notes n where n.contact_id = campus_students.contact_id);

-- Follow-up tasks used to carry a baked-in "Ways to reconnect" block (event
-- list, prayer-call idea). It's gone from new tasks; strip it from open ones.
update iowa_tasks
   set description = btrim(split_part(description, 'Ways to reconnect', 1))
 where auto_kind in ('reconnect', 'place', 'reinvite', 'missed')
   and status <> 'done'
   and description like '%Ways to reconnect%';
