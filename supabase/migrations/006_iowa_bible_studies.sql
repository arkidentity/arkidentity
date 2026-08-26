-- ARK Iowa — Bible Study System (Phase 1)
-- Roster + live schedule for weekly campus Bible studies. See
-- docs/IOWA-BIBLE-STUDY-SYSTEM.md.
--
-- Access model: server-only. Every read and write goes through Next.js route
-- handlers using the service-role key (getSupabaseAdmin), which bypasses RLS.
-- Public routes (student join / start / .ics / per-study card) are plain server
-- routes — no anon key touches these tables — so no anon/authenticated GRANTs
-- are needed. RLS is enabled with no policies as defense in depth.
--
-- status / member.status are text + CHECK rather than Postgres enums on
-- purpose: the campus ministry model is still moving, and a CHECK is far easier
-- to widen later than `alter type ... add value`.

-- ---------------------------------------------------------------------------
-- bible_studies — one weekly study (a day, a time, a place, up to four)
-- ---------------------------------------------------------------------------
create table if not exists bible_studies (
  id                 uuid primary key default gen_random_uuid(),
  semester           text not null,                       -- e.g. 'Fall 2026'
  day_of_week        smallint not null check (day_of_week between 0 and 6),  -- 0=Sun .. 6=Sat
  start_time         time not null,                       -- local, America/Chicago
  location           text,                                -- required to be listed; null only while pending_setup
  capacity           smallint not null default 4 check (capacity between 1 and 12),
  status             text not null default 'forming'
                       check (status in ('pending_setup','forming','full','activated','paused','ended')),
  accepting_signups  boolean not null default true,       -- explicit override; a seat can open on an activated study
  leader_name        text,
  leader_phone       text,
  leader_email       text,
  notes              text,                                -- Travis's private notes
  break_plan         text,                                -- used while paused
  parent_study_id    uuid references bible_studies(id) on delete set null,  -- lineage when a study rolls to a new semester
  pulse_status       text check (pulse_status in ('green','yellow','red')),
  pulse_note         text,
  pulse_at           timestamptz,
  activated_at       timestamptz,
  created_at         timestamptz not null default now()
);

create index if not exists bible_studies_semester_slot_idx
  on bible_studies (semester, day_of_week, start_time);
create index if not exists bible_studies_status_idx on bible_studies (status);
create index if not exists bible_studies_parent_idx on bible_studies (parent_study_id);

-- ---------------------------------------------------------------------------
-- bible_study_members — a student in a study. History is kept, never deleted.
-- ---------------------------------------------------------------------------
create table if not exists bible_study_members (
  id          uuid primary key default gen_random_uuid(),
  study_id    uuid not null references bible_studies(id) on delete cascade,
  name        text not null,
  phone       text not null,
  email       text not null,
  year        text,                                       -- optional: 'first-year' etc.
  status      text not null default 'active' check (status in ('active','dropped')),
  source      text,                                       -- 'org fair' / 'referred by X' / 'cold' — filled later
  notes       text,
  joined_at   timestamptz not null default now(),
  left_at     timestamptz
);

create index if not exists bible_study_members_study_idx on bible_study_members (study_id, status);
-- duplicate guard: one active seat per phone per study
create unique index if not exists bible_study_members_one_seat_idx
  on bible_study_members (study_id, lower(phone))
  where status = 'active';
create index if not exists bible_study_members_phone_idx on bible_study_members (lower(phone));
create index if not exists bible_study_members_email_idx on bible_study_members (lower(email));

-- ---------------------------------------------------------------------------
-- RLS on, no policies — all access is service-role via server routes.
-- ---------------------------------------------------------------------------
alter table bible_studies        enable row level security;
alter table bible_study_members  enable row level security;
