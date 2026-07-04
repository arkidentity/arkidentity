-- Ministry Feed — Phase 1 schema
-- Public chronological feed of ministry updates (posts), ministry partners
-- (subscribers), and a log of digest sends. See docs/ministry-feed-build-plan.md.
--
-- NOTE (Supabase grants): auto-grants for anon/authenticated are being removed
-- (Oct 30 2026 deadline), so every table below explicitly GRANTs. The public
-- feed is read via the anon key from a Server Component, so anon needs SELECT on
-- published posts only. All writes go through /admin server routes using the
-- service-role key, which bypasses RLS/grants.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type post_status  as enum ('draft', 'approved', 'published');
create type media_type   as enum ('photo', 'audio', 'video');
create type partner_channel as enum ('email', 'text', 'both');
create type send_channel  as enum ('email', 'text');
create type send_status   as enum ('sent', 'failed');
create type digest_freq   as enum ('weekly', 'monthly');

-- ---------------------------------------------------------------------------
-- posts
-- ---------------------------------------------------------------------------
create table posts (
  id                uuid primary key default gen_random_uuid(),
  status            post_status not null default 'draft',
  raw_media_url     text,
  media_type        media_type,
  transcript        text,
  draft_text        text,
  final_text        text,
  display_media_url text,
  created_at        timestamptz not null default now(),
  approved_at       timestamptz,
  published_at      timestamptz
);

-- Feed query: published posts, newest first.
create index posts_published_idx
  on posts (published_at desc)
  where status = 'published';

-- ---------------------------------------------------------------------------
-- partners (subscribers)
-- ---------------------------------------------------------------------------
create table partners (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text,
  phone      text,
  channel    partner_channel not null default 'email',
  frequency  digest_freq not null default 'monthly',
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- sends (digest delivery log)
-- ---------------------------------------------------------------------------
create table sends (
  id         uuid primary key default gen_random_uuid(),
  partner_id uuid not null references partners (id) on delete cascade,
  post_ids   uuid[] not null default '{}',
  channel    send_channel not null,
  sent_at    timestamptz not null default now(),
  status     send_status not null default 'sent'
);

create index sends_partner_idx on sends (partner_id, sent_at desc);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- Reads via anon key are limited to published posts. Everything else is
-- service-role only (no policies = no anon/authenticated access).
-- ---------------------------------------------------------------------------
alter table posts    enable row level security;
alter table partners enable row level security;
alter table sends    enable row level security;

create policy posts_public_read on posts
  for select
  to anon, authenticated
  using (status = 'published');

-- ---------------------------------------------------------------------------
-- Grants (auto-grants removed Oct 30 2026 — must be explicit)
-- ---------------------------------------------------------------------------
grant select on posts to anon, authenticated;
-- partners/sends: no anon/authenticated grants — service-role only.
