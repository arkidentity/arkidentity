-- ARK Identity — Contacts: segmentation, tagging, and invite tracking
--
-- One people table for the whole ministry. `partners` (the newsletter list from
-- 001/004) is RENAMED to `contacts` and extended rather than duplicated, and the
-- ARK Iowa Bible study roster stops storing its own copies of names and numbers
-- — a membership row now points at a contact. Rationale: a tag says what kind of
-- person someone is ("ARK Iowa", "worship night"); a membership says what they
-- are currently in (a seat in the Tuesday 7pm study, with capacity and join /
-- leave dates), which a tag cannot represent.
--
-- Access model matches 006: server-only. Every read and write goes through Next
-- route handlers using the service-role key (getSupabaseAdmin), which bypasses
-- RLS. No anon/authenticated GRANTs are added.
--
-- Subscription semantics after this migration:
--   subscribed  — is this person on the ministry update list? Default true;
--                 the campus join form is the one intake that sets it false.
--   confirmed   — legacy double opt-in flag. New signups are written confirmed
--                 straight away (no confirmation step), but rows that were left
--                 pending under the old flow stay unconfirmed and keep being
--                 skipped by the digest. They never opted in; don't mail them.
--   status      — 'active' / 'archived'. Contacts are archived, never deleted.

-- ---------------------------------------------------------------------------
-- partners -> contacts
-- ---------------------------------------------------------------------------
alter table partners rename to contacts;

-- `active` has always meant "on the newsletter" (unsubscribe sets it false).
-- Renaming it says so, and frees `status` to mean whether the contact is live.
alter table contacts rename column active to subscribed;

alter table sends rename column partner_id to contact_id;
alter index if exists sends_partner_idx rename to sends_contact_idx;
alter index if exists partners_confirm_token_idx rename to contacts_confirm_token_idx;
alter index if exists partners_unsubscribe_token_key rename to contacts_unsubscribe_token_key;
alter index if exists partners_email_key rename to contacts_email_key;

alter table contacts
  add column if not exists city               text,
  add column if not exists state              text,   -- 2-letter, stored upper
  add column if not exists region             text,   -- broader rollup, e.g. 'Midwest'
  add column if not exists relationship_notes text,   -- how you know them
  add column if not exists source             text,   -- how they got added
  add column if not exists status             text not null default 'active'
                                                check (status in ('active','archived')),
  add column if not exists updated_at         timestamptz not null default now();

-- Segment filters are state + tag; both need to be cheap.
create index if not exists contacts_state_idx on contacts (upper(state)) where status = 'active';
create index if not exists contacts_status_idx on contacts (status);
create index if not exists contacts_phone_idx on contacts (lower(phone)) where phone is not null;

-- ---------------------------------------------------------------------------
-- contact_tags — the vocabulary. `slug` is the sprawl guard: "Worship Night",
-- "worship night" and "Worship  Night" all collapse to worship-night, so the
-- same tag can't be created twice under different capitalisation.
-- ---------------------------------------------------------------------------
create table if not exists contact_tags (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text not null unique,
  category   text,                                    -- 'event-type' / 'role' / 'topic'
  created_at timestamptz not null default now()
);

create index if not exists contact_tags_category_idx on contact_tags (category);

create table if not exists contact_tag_links (
  contact_id uuid not null references contacts(id) on delete cascade,
  tag_id     uuid not null references contact_tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (contact_id, tag_id)
);

-- Segments filter by tag then collect contacts, so index that direction too.
create index if not exists contact_tag_links_tag_idx on contact_tag_links (tag_id, contact_id);

-- ---------------------------------------------------------------------------
-- contact_events — a thing you invite people to. Deliberately thin: RSVPs and
-- the invite itself live in Google Calendar. This table exists to answer "who
-- have I already asked?", which Calendar cannot answer across time.
-- ---------------------------------------------------------------------------
create table if not exists contact_events (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  event_date    date,
  location      text,
  calendar_link text,                                 -- pasted in once built in Calendar
  notes         text,
  status        text not null default 'planning'
                  check (status in ('planning','invites_sent','complete')),
  created_at    timestamptz not null default now()
);

create index if not exists contact_events_date_idx on contact_events (event_date desc);

create table if not exists contact_invites (
  event_id   uuid not null references contact_events(id) on delete cascade,
  contact_id uuid not null references contacts(id) on delete cascade,
  status     text not null default 'invited'
               check (status in ('invited','confirmed','declined','no_response')),
  invited_at timestamptz not null default now(),
  notes      text,
  primary key (event_id, contact_id)
);

-- "Exclude everyone already invited to X" — the filter that makes the segment
-- builder worth building — reads this index.
create index if not exists contact_invites_contact_idx on contact_invites (contact_id);
create index if not exists contact_invites_event_status_idx on contact_invites (event_id, status);

-- ---------------------------------------------------------------------------
-- ARK Iowa roster -> contacts
--
-- bible_study_members keeps what is true about the SEAT (year, source, notes,
-- joined/left, status) and gives up what is true about the PERSON (name, phone,
-- email) to contacts.
-- ---------------------------------------------------------------------------
alter table bible_study_members
  add column if not exists contact_id uuid references contacts(id) on delete cascade;

-- 1. Students whose email is already a contact (they were on the partner list).
update bible_study_members m
   set contact_id = c.id
  from contacts c
 where m.contact_id is null
   and c.email is not null
   and lower(c.email) = lower(m.email);

-- 2. Everyone else becomes a contact. distinct on collapses a student who sits
--    in two studies into one person. Campus signups default subscribed = false.
insert into contacts (name, email, phone, channel, frequency, subscribed, confirmed, confirmed_at, source, status)
select distinct on (lower(m.email))
       m.name,
       lower(m.email),
       m.phone,
       'email'::partner_channel,
       'monthly'::digest_freq,
       false,
       true,
       now(),
       coalesce(m.source, 'ARK Iowa Bible study'),
       'active'
  from bible_study_members m
 where m.contact_id is null
   and m.email is not null
   and length(trim(m.email)) > 0
 order by lower(m.email), m.joined_at;

-- 3. Link the ones just created.
update bible_study_members m
   set contact_id = c.id
  from contacts c
 where m.contact_id is null
   and c.email is not null
   and lower(c.email) = lower(m.email);

-- Fails loudly rather than silently orphaning a roster row (e.g. a member with
-- a blank email). Fix the offending row and re-run if this trips.
alter table bible_study_members alter column contact_id set not null;

-- Tag every migrated student so "everyone connected to campus ministry" is a
-- one-click segment.
insert into contact_tags (name, slug, category)
values ('ARK Iowa', 'ark-iowa', 'role')
on conflict (slug) do nothing;

insert into contact_tag_links (contact_id, tag_id)
select distinct m.contact_id, t.id
  from bible_study_members m
  cross join contact_tags t
 where t.slug = 'ark-iowa'
on conflict do nothing;

-- The person now lives in contacts; drop the duplicated copies.
drop index if exists bible_study_members_one_seat_idx;
drop index if exists bible_study_members_phone_idx;
drop index if exists bible_study_members_email_idx;

alter table bible_study_members
  drop column if exists name,
  drop column if exists phone,
  drop column if exists email;

-- One active seat per person per study (was keyed on phone).
create unique index if not exists bible_study_members_one_seat_idx
  on bible_study_members (study_id, contact_id)
  where status = 'active';
create index if not exists bible_study_members_contact_idx on bible_study_members (contact_id);

-- ---------------------------------------------------------------------------
-- RLS on, no policies — service-role only, same as 006.
-- ---------------------------------------------------------------------------
alter table contact_tags      enable row level security;
alter table contact_tag_links enable row level security;
alter table contact_events    enable row level security;
alter table contact_invites   enable row level security;
