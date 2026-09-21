-- ARK Iowa — staff invites (accept / decline) + event RSVPs (head counts).
-- See docs/IOWA-CAMPUS-TASKS.md → "Invites and RSVPs".
--
-- Staff (Travis, Keilor, Kayla): putting someone on an event is now an invite
-- they accept or decline, once for the whole series of a repeating event, plus
-- "I can't make this one" for a single date ("missing is fine, disappearing is
-- not").
--
-- Everyone else (students, friends): an event can open a public RSVP link, or
-- send one person a private link for a one-on-one. Responses give a head count
-- per date and land the person in the shared contacts list.
--
-- Server-only like 006+: RLS on, no policies, no grants.

alter table iowa_event_staff
  add column if not exists response      text not null default 'pending'
                                           check (response in ('pending', 'accepted', 'declined')),
  add column if not exists note          text,
  add column if not exists invited_at    timestamptz not null default now(),
  add column if not exists responded_at  timestamptz;

-- Everyone already on an event was put there before invites existed: count
-- them as going.
update iowa_event_staff set response = 'accepted', responded_at = now() where response = 'pending';

-- A single date an accepted staff member can't make.
create table if not exists iowa_event_absences (
  event_id    uuid not null references iowa_events(id) on delete cascade,
  staff_id    uuid not null references iowa_staff(id) on delete cascade,
  occurrence  date not null,
  note        text,
  created_at  timestamptz not null default now(),
  primary key (event_id, staff_id, occurrence)
);

-- Public RSVP link for an event (null = RSVPs closed).
alter table iowa_events add column if not exists rsvp_token text;
create unique index if not exists iowa_events_rsvp_token_idx on iowa_events (rsvp_token);

-- One row per person per date. response 'invited' = a personal invite not yet
-- answered. personal_token is that person's private link.
create table if not exists iowa_event_rsvps (
  id              uuid primary key default gen_random_uuid(),
  event_id        uuid not null references iowa_events(id) on delete cascade,
  occurrence      date not null,
  contact_id      uuid references contacts(id) on delete set null,
  name            text not null,
  phone           text,
  email           text,
  response        text not null default 'invited' check (response in ('invited', 'yes', 'no')),
  guests          smallint not null default 0 check (guests between 0 and 10),
  note            text,
  personal_token  text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists iowa_event_rsvps_event_idx on iowa_event_rsvps (event_id, occurrence);
create unique index if not exists iowa_event_rsvps_token_idx on iowa_event_rsvps (personal_token);
-- One answer per contact per date (a re-submit updates it).
create unique index if not exists iowa_event_rsvps_contact_idx
  on iowa_event_rsvps (event_id, occurrence, contact_id) where contact_id is not null;

alter table iowa_event_absences enable row level security;
alter table iowa_event_rsvps    enable row level security;
