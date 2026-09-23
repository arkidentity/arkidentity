-- ARK Iowa — one inbox for everything that would have been an instant email.
-- See docs/IOWA-CAMPUS-TASKS.md → "Email rhythm".
--
-- Before this, each thing emailed on its own: a signup sent an admin alert AND
-- the welcome task's assignment email; every task assignment, helper add, help
-- offer and comment sent its own. Now they all write a row here, and how a
-- person hears about it is their setting: instantly, in the 6 PM digest
-- (default), or not at all. The same rows are what push notifications will
-- send later.
--
-- Server-only like 006+: RLS on, no policies, no grants.

alter table iowa_staff
  add column if not exists notify_mode text not null default 'digest'
    check (notify_mode in ('instant', 'digest', 'off'));

create table if not exists iowa_notifications (
  id          uuid primary key default gen_random_uuid(),
  staff_id    uuid not null references iowa_staff(id) on delete cascade,
  kind        text not null check (kind in ('task_assigned', 'helper_added', 'help_offered', 'task_comment', 'signup')),
  title       text not null,                 -- 'Keilor commented on: Pick songs'
  body        text,                          -- the comment, the student's details
  link        text,                          -- where to go in the admin
  task_id     uuid references iowa_tasks(id) on delete cascade,
  created_at  timestamptz not null default now(),
  -- Null = still owed to this person. Set when emailed instantly, in a digest,
  -- or straight away for 'off' so it never queues up.
  emailed_at  timestamptz
);
create index if not exists iowa_notifications_pending_idx
  on iowa_notifications (staff_id, created_at)
  where emailed_at is null;

alter table iowa_notifications enable row level security;
