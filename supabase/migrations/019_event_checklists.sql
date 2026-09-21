-- ARK Iowa — event checklists: tasks timed relative to an event.
-- See docs/IOWA-CAMPUS-TASKS.md → "Event checklists".
--
-- A template is a reusable list ("Mission trip", "Taco Night"): each item is a
-- task due N days before (negative) or after (positive) the event. Applying a
-- template to an event makes real tasks in iowa_tasks. Repeating events get a
-- fresh set per occurrence, generated a couple of weeks ahead by the morning
-- run. Tasks remember offset_days + event_occurrence, so when the event moves
-- their due dates move with it. A template tied to an event type is applied
-- automatically to new events of that type.
--
-- Server-only like 006+: RLS on, no policies, no grants.

create table if not exists iowa_checklist_templates (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  event_type_id  uuid references iowa_item_types(id) on delete set null,  -- auto-apply to new events of this type
  created_at     timestamptz not null default now()
);

create table if not exists iowa_checklist_items (
  id                uuid primary key default gen_random_uuid(),
  template_id       uuid not null references iowa_checklist_templates(id) on delete cascade,
  title             text not null,
  description       text,
  offset_days       integer not null default 0,   -- -56 = 8 weeks before, 1 = day after
  default_owner_id  uuid references iowa_staff(id) on delete set null,
  priority          text not null default 'normal' check (priority in ('urgent', 'high', 'normal', 'low')),
  sort              smallint not null default 0
);
create index if not exists iowa_checklist_items_template_idx on iowa_checklist_items (template_id, sort);

alter table iowa_events
  add column if not exists checklist_template_id uuid references iowa_checklist_templates(id) on delete set null;

alter table iowa_tasks
  add column if not exists event_occurrence date,       -- which date of the event this task is for
  add column if not exists offset_days integer,         -- due = event_occurrence + offset_days
  add column if not exists checklist_item_id uuid references iowa_checklist_items(id) on delete set null;
create index if not exists iowa_tasks_event_occurrence_idx on iowa_tasks (event_id, event_occurrence);

alter table iowa_checklist_templates enable row level security;
alter table iowa_checklist_items     enable row level security;

-- Starters. Travis edits these in Settings → Checklists; they're examples, not doctrine.
with t as (
  insert into iowa_checklist_templates (name) values ('Taco Night') returning id
)
insert into iowa_checklist_items (template_id, title, offset_days, priority, sort)
select id, v.title, v.off, v.pri, v.srt from t, (values
  ('Confirm the host home / space',            -21, 'high',   1),
  ('Invite students (text your studies)',       -10, 'high',   2),
  ('Food plan + shopping list',                 -5,  'normal', 3),
  ('Reminder text to everyone invited',         -1,  'high',   4),
  ('Follow up with first-timers',                1,  'normal', 5)
) as v(title, off, pri, srt);

with t as (
  insert into iowa_checklist_templates (name) values ('Prayer & Worship Night') returning id
)
insert into iowa_checklist_items (template_id, title, offset_days, priority, sort)
select id, v.title, v.off, v.pri, v.srt from t, (values
  ('Book the room',                              -21, 'high',   1),
  ('Set the worship team + song list',           -10, 'normal', 2),
  ('Invite students',                            -7,  'high',   3),
  ('Rehearsal',                                  -2,  'normal', 4),
  ('Reminder text to everyone invited',          -1,  'high',   5)
) as v(title, off, pri, srt);

with t as (
  insert into iowa_checklist_templates (name) values ('Mission trip') returning id
)
insert into iowa_checklist_items (template_id, title, offset_days, priority, sort)
select id, v.title, v.off, v.pri, v.srt from t, (values
  ('Confirm dates, host partner and budget',    -120, 'high',   1),
  ('Open sign-ups + info meeting',              -90,  'high',   2),
  ('Collect deposits',                          -70,  'normal', 3),
  ('Passports / ID + medical forms in',         -56,  'high',   4),
  ('Book travel and lodging',                   -45,  'high',   5),
  ('Team training session',                     -21,  'normal', 6),
  ('Final payments + packing list',             -14,  'normal', 7),
  ('Prayer send-off',                           -2,   'normal', 8),
  ('Debrief + thank-you notes',                  7,   'normal', 9)
) as v(title, off, pri, srt);
