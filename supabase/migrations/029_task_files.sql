-- ARK Iowa — files on a task.
-- See docs/IOWA-CAMPUS-TASKS.md → "Task files".
--
-- "Pick songs for practice" wants a chord chart; a retreat task wants the
-- permission form. Tasks held text only, so those lived in a text thread
-- somewhere else.
--
-- The file itself sits in the private `iowa-task-files` storage bucket (create
-- it in the Supabase dashboard); this table is the index. Downloads go through
-- the admin, which mints a short-lived signed URL — the bucket is private so a
-- leaked link stops working, not because the contents are secret.
--
-- Server-only like 006+: RLS on, no policies, no grants.

create table if not exists iowa_task_files (
  id           uuid primary key default gen_random_uuid(),
  task_id      uuid not null references iowa_tasks(id) on delete cascade,
  name         text not null,              -- what it was called on their machine
  path         text not null,              -- object path in the bucket
  content_type text,
  size_bytes   integer,
  uploaded_by  uuid references iowa_staff(id) on delete set null,
  created_at   timestamptz not null default now()
);
create index if not exists iowa_task_files_task_idx on iowa_task_files (task_id, created_at);

alter table iowa_task_files enable row level security;
