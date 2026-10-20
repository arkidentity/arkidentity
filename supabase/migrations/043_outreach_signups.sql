-- 043: Outreach volunteer sign-ups (Travis, 2026-10-20).
-- First use: Trick or Truth, Oct 29-31. One row per person per sign-up; `slots`
-- holds the 2-hour slot keys they picked (see lib/outreach.ts). Locations are
-- assigned later by text, so there's no location column yet.
create table if not exists iowa_outreach_signups (
  id          uuid primary key default gen_random_uuid(),
  outreach    text not null,
  name        text not null,
  phone       text not null,
  email       text not null,
  slots       text[] not null default '{}',
  bringing    int  not null default 0,
  under_18    boolean not null default false,
  experience  text check (experience in ('new', 'some', 'lead')),
  note        text,
  created_at  timestamptz not null default now()
);

create index if not exists iowa_outreach_signups_outreach_idx on iowa_outreach_signups (outreach, created_at);

alter table iowa_outreach_signups enable row level security;
grant all on iowa_outreach_signups to service_role;
