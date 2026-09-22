-- ARK Iowa — comments on tasks.
-- See docs/IOWA-CAMPUS-TASKS.md → "Task comments".
--
-- "Pick songs for practice" is already tied to one date (event_occurrence), but
-- there was no way to say WHICH songs. Editing the description overwrites and
-- says nothing; marking done says nothing either. So: comments, on the same
-- timeline as the automatic activity ("marked done", "took this task"), and
-- shown on the event for that date — the songs live with that practice.
--
-- Server-only like 006+: RLS on, no policies, no grants.

alter table iowa_task_activity
  -- 'log' = the app describing what happened; 'comment' = a person writing.
  add column if not exists kind text not null default 'log' check (kind in ('log', 'comment'));

create index if not exists iowa_task_activity_comment_idx
  on iowa_task_activity (task_id, created_at)
  where kind = 'comment';
