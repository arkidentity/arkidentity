-- ARK Iowa — deleting an app-made task should stick.
-- See docs/IOWA-CAMPUS-TASKS.md → "Deleted tasks stay deleted".
--
-- App-made tasks (event checklists, follow-ups) are idempotent by auto_key:
-- the generator inserts and skips duplicates. Deleting the row freed the key,
-- so the next run made the task again (Travis deleted "Book venue" twice).
-- Deleting now records the key here and the generators skip it.
--
-- Server-only like 006+: RLS on, no policies, no grants.

create table if not exists iowa_dismissed_auto_keys (
  auto_key text primary key,
  dismissed_at timestamptz not null default now()
);

alter table iowa_dismissed_auto_keys enable row level security;
