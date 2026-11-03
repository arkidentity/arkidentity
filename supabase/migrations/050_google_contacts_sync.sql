-- 050: Google Contacts two-way sync (Travis, 2026-11-03).
-- The thearkidentity Gmail's Google Contacts own the who (name, email, phone,
-- birthday); ARK owns the care. Google labels and ARK tags are one system and
-- sync both ways. See docs/planning/donor-care-PLAN.md.
--
-- Matching: a Google person is matched to an ARK contact by resource name,
-- then email, then phone digits. Unmatched Google people are added to ARK with
-- subscribed = false, so the sync never puts anyone on the newsletter.
--
-- Two-way labels use a snapshot: `google_labels_synced` is the set of tag slugs
-- both sides agreed on after the last sync. A label added (or removed) on
-- either side since then wins; nothing is decided by "who synced last".

alter table contacts
  add column if not exists google_resource_name text unique,   -- people/c123...
  add column if not exists google_etag          text,
  add column if not exists google_labels_synced text[],         -- tag slugs at last sync
  add column if not exists birthday             date,
  add column if not exists synced_at            timestamptz;

alter table contact_tags
  add column if not exists google_group_resource_name text unique;  -- contactGroups/abc...

-- One row: the connected Google account. Server-only (service role).
create table if not exists google_connection (
  id             int primary key default 1 check (id = 1),
  google_email   text,
  refresh_token  text not null,
  connected_at   timestamptz not null default now(),
  last_sync_at   timestamptz,
  last_sync_summary jsonb
);

-- What each sync changed, so nothing changes silently.
create table if not exists contact_sync_log (
  id          uuid primary key default gen_random_uuid(),
  run_at      timestamptz not null default now(),
  contact_id  uuid references contacts(id) on delete set null,
  action      text not null,   -- linked / imported / filled / label_added / label_removed / pushed / group_created
  detail      text
);

create index if not exists contact_sync_log_run_idx on contact_sync_log (run_at desc);

alter table google_connection enable row level security;
alter table contact_sync_log enable row level security;
grant all on google_connection to service_role;
grant all on contact_sync_log to service_role;
