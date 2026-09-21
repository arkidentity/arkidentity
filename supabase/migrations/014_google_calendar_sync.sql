-- ARK Iowa — two-way sync with the shared "ARK Campus" Google calendar.
-- See docs/IOWA-CAMPUS-TASKS.md (Phase 1.5).
--
-- One owner per item, so nothing ever echoes back as a duplicate:
--   bible studies   admin -> Google (weekly event, roster in the description)
--   admin events    admin -> Google
--   Google events   Google -> admin (read-only here; edit them in Google)
-- Everything the app writes to Google carries a private extendedProperty
-- (arkSource), and the importer skips anything carrying it.
--
-- Server-only like 006/011/013: RLS on, no policies, no grants.

-- The Google event a study is mirrored to (null = not on the calendar: no
-- students yet, paused, ended).
alter table bible_studies add column if not exists google_event_id text;

-- Where an event came from. 'google' rows are owned by Google Calendar: the
-- importer rewrites them and the admin shows them read-only.
alter table iowa_events
  add column if not exists source text not null default 'app' check (source in ('app', 'google')),
  add column if not exists google_html_link text;
create unique index if not exists iowa_events_google_idx
  on iowa_events (google_event_id) where google_event_id is not null;

-- Google events held back because they look like a Bible study the admin
-- already owns (same weekday + start time). Travis deletes them in Google, or
-- decides: 'import' (not a duplicate) or 'ignore' (keep in Google, never import).
create table if not exists iowa_calendar_held (
  google_event_id   text primary key,
  summary           text,
  starts_label      text,                                -- e.g. 'Wed 8 PM, weekly'
  matched_study_id  uuid references bible_studies(id) on delete set null,
  decision          text check (decision in ('import', 'ignore')),  -- null = still waiting
  created_at        timestamptz not null default now()
);

-- Single-row bookkeeping for the pull throttle.
create table if not exists iowa_calendar_sync (
  id              smallint primary key default 1 check (id = 1),
  last_pulled_at  timestamptz,
  last_error      text
);
insert into iowa_calendar_sync (id) values (1) on conflict do nothing;

alter table iowa_calendar_held enable row level security;
alter table iowa_calendar_sync enable row level security;
