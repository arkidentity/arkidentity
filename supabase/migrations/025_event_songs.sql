-- ARK Iowa — songs on an event (a setlist per date).
-- See docs/IOWA-CAMPUS-TASKS.md → "Songs".
--
-- Like checklist tasks (019), songs belong to ONE date of an event, not the
-- series: this Thursday's practice and next Thursday's are different sets.
-- Deliberately not a song library — no usage history, no CCLI, no SongSelect.
-- If "when did we last play this?" is ever wanted, these rows are that history.
--
-- Server-only like 006+: RLS on, no policies, no grants.

create table if not exists iowa_event_songs (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references iowa_events(id) on delete cascade,
  occurrence  date not null,                 -- which date of the event
  title       text not null,
  song_key    text,                          -- 'G', 'Bb' — free text, it's a human note
  link        text,                          -- YouTube, a chart, wherever
  sort        smallint not null default 0,   -- the order they're played in
  added_by    uuid references iowa_staff(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists iowa_event_songs_event_idx on iowa_event_songs (event_id, occurrence, sort);

alter table iowa_event_songs enable row level security;
