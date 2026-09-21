-- ARK Iowa — campus tasks, campus events, drop reasons.
-- See docs/IOWA-CAMPUS-TASKS.md.
--
-- Server-only like 006/011: every read and write goes through route handlers
-- with the service-role key. RLS on, no policies, no anon/authenticated grants.

-- ---------------------------------------------------------------------------
-- Staff roles. Everyone has full access in Phase 1; the column exists so
-- interns and student leaders can be told apart when permissions arrive.
-- ---------------------------------------------------------------------------
alter table iowa_staff
  add column if not exists role text not null default 'staff'
    check (role in ('staff', 'intern', 'leader'));

-- ---------------------------------------------------------------------------
-- Editable type lists for tasks and events.
-- ---------------------------------------------------------------------------
create table if not exists iowa_item_types (
  id          uuid primary key default gen_random_uuid(),
  kind        text not null check (kind in ('task', 'event')),
  name        text not null,
  sort        smallint not null default 0,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);
create unique index if not exists iowa_item_types_name_idx on iowa_item_types (kind, lower(name));

insert into iowa_item_types (kind, name, sort) values
  ('event', 'Evangelism', 1),
  ('event', 'Check-in', 2),
  ('event', 'Worship rehearsal', 3),
  ('event', 'Training', 4),
  ('event', 'Gathering', 5),
  ('event', 'Meeting', 6),
  ('event', 'Other', 99),
  ('task', 'Follow-up', 1),
  ('task', 'Bible study', 2),
  ('task', 'Event prep', 3),
  ('task', 'Admin', 4),
  ('task', 'Other', 99)
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Campus events. Separate from ARK-wide contact_events on purpose.
-- Local wall-clock (America/Chicago) like bible_studies, so a weekly repeat
-- stays at 7 PM across DST.
-- ---------------------------------------------------------------------------
create table if not exists iowa_events (
  id               uuid primary key default gen_random_uuid(),
  title            text not null,
  type_id          uuid references iowa_item_types(id) on delete set null,
  event_date       date not null,
  start_time       time,                                  -- null = all day
  end_time         time,
  location         text,
  meeting_link     text,                                  -- pasted Google Meet / Zoom link
  notes            text,
  repeat_weekly    boolean not null default false,
  repeat_until     date,                                  -- null = until turned off
  google_event_id  text,                                  -- reserved for Phase 1.5 sync
  created_by       uuid references iowa_staff(id) on delete set null,
  created_at       timestamptz not null default now()
);
create index if not exists iowa_events_date_idx on iowa_events (event_date);

create table if not exists iowa_event_staff (
  event_id  uuid not null references iowa_events(id) on delete cascade,
  staff_id  uuid not null references iowa_staff(id) on delete cascade,
  primary key (event_id, staff_id)
);

-- ---------------------------------------------------------------------------
-- Tasks. One owner; helpers are extras.
-- ---------------------------------------------------------------------------
create table if not exists iowa_tasks (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  description   text,
  type_id       uuid references iowa_item_types(id) on delete set null,
  status        text not null default 'open'
                  check (status in ('open', 'in_progress', 'blocked', 'done')),
  priority      text not null default 'normal'
                  check (priority in ('urgent', 'high', 'normal', 'low')),
  due_date      date,
  owner_id      uuid references iowa_staff(id) on delete set null,
  study_id      uuid references bible_studies(id) on delete set null,
  event_id      uuid references iowa_events(id) on delete set null,
  contact_id    uuid references contacts(id) on delete set null,
  created_by    uuid references iowa_staff(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  completed_at  timestamptz
);
create index if not exists iowa_tasks_owner_idx on iowa_tasks (owner_id, status);
create index if not exists iowa_tasks_due_idx on iowa_tasks (due_date) where status <> 'done';
create index if not exists iowa_tasks_study_idx on iowa_tasks (study_id);
create index if not exists iowa_tasks_event_idx on iowa_tasks (event_id);
create index if not exists iowa_tasks_contact_idx on iowa_tasks (contact_id);

create table if not exists iowa_task_helpers (
  task_id     uuid not null references iowa_tasks(id) on delete cascade,
  staff_id    uuid not null references iowa_staff(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (task_id, staff_id)
);

create table if not exists iowa_task_activity (
  id          uuid primary key default gen_random_uuid(),
  task_id     uuid not null references iowa_tasks(id) on delete cascade,
  staff_id    uuid references iowa_staff(id) on delete set null,
  action      text not null,                              -- human-readable: 'marked done', 'assigned to Sam'
  created_at  timestamptz not null default now()
);
create index if not exists iowa_task_activity_task_idx on iowa_task_activity (task_id, created_at);

-- ---------------------------------------------------------------------------
-- Why a student was dropped — feeds re-invites and follow-ups in Phase 2.
-- ---------------------------------------------------------------------------
alter table bible_study_members
  add column if not exists drop_reason text
    check (drop_reason in ('unresponsive', 'schedule_changed', 'not_interested', 'left_school', 'other')),
  add column if not exists drop_note text;

alter table iowa_item_types     enable row level security;
alter table iowa_events         enable row level security;
alter table iowa_event_staff    enable row level security;
alter table iowa_tasks          enable row level security;
alter table iowa_task_helpers   enable row level security;
alter table iowa_task_activity  enable row level security;
