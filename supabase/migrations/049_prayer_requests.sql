-- 049: Partner prayer requests (Travis, 2026-11-02).
-- "How can we pray for you?" link at the end of every update (email + feed).
-- From an email link we know who it is (contact_id via their unsubscribe token);
-- from the public feed they type a name and email. Travis and Kimberly see an
-- open list, tap Prayed (optionally emailing "we prayed for you"), and come back
-- later to ask how it went.

create table if not exists prayer_requests (
  id            uuid primary key default gen_random_uuid(),
  contact_id    uuid references contacts(id) on delete set null,
  name          text not null,
  email         text,
  request       text not null,
  ok_to_share   boolean not null default false,   -- OK to share with the ARK team
  wants_update  boolean not null default true,    -- let them know we prayed
  status        text not null default 'open' check (status in ('open', 'prayed', 'answered', 'archived')),
  prayed_at     timestamptz,
  prayed_note   text,                              -- what we sent them, if anything
  follow_up_on  date,                              -- nudge to ask "how did that go?"
  created_at    timestamptz not null default now()
);

create index if not exists prayer_requests_status_idx on prayer_requests (status, created_at desc);
create index if not exists prayer_requests_contact_idx on prayer_requests (contact_id);

alter table prayer_requests enable row level security;
grant all on prayer_requests to service_role;
