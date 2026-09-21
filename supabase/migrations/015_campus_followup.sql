-- ARK Iowa — follow-up automation (Phase 2). See docs/IOWA-CAMPUS-TASKS.md.
--
-- Server-only like 006/011/013/014: RLS on, no policies, no grants.

-- Who met the student. First touch wins: a later signup never overwrites it,
-- though staff can correct it in the admin. Either a staff member, or one of
-- the non-staff answers on the signup form.
alter table campus_students
  add column if not exists met_by_staff_id uuid references iowa_staff(id) on delete set null,
  add column if not exists met_by_other text check (met_by_other in ('friend', 'self', 'other'));

-- "Did they make it to their first study?" — asked the morning after it.
-- null = not answered yet.
alter table bible_study_members
  add column if not exists first_showed boolean,
  add column if not exists first_show_asked_on date;

-- Tasks the app creates itself. auto_key makes each one idempotent (the daily
-- job can run twice without doubling anything), e.g.
--   welcome:<member_id>   confirm:<study_id>:<date>   missed:<member_id>
--   reconnect:<contact_id>:<semester>   place:<contact_id>:<semester>   reinvite:<contact_id>:<semester>
alter table iowa_tasks
  add column if not exists auto_kind text,
  add column if not exists auto_key text;
create unique index if not exists iowa_tasks_auto_key_idx on iowa_tasks (auto_key);
