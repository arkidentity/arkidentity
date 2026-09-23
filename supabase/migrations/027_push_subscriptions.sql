-- ARK Iowa — web push subscriptions.
-- See docs/IOWA-CAMPUS-TASKS.md → "Push notifications".
--
-- One row per device (a phone, a laptop) that said yes to notifications. The
-- endpoint is that device's mailbox at Apple/Google; p256dh + auth are its
-- encryption keys. On iPhone this only works from the installed admin app
-- (026 → its own manifest), which is why that came first.
--
-- What gets sent is the same iowa_notifications rows the 6 PM digest emails.
--
-- Server-only like 006+: RLS on, no policies, no grants.

create table if not exists iowa_push_subscriptions (
  id           uuid primary key default gen_random_uuid(),
  staff_id     uuid not null references iowa_staff(id) on delete cascade,
  endpoint     text not null unique,     -- the push service URL for this device
  p256dh       text not null,
  auth         text not null,
  user_agent   text,                     -- 'iPhone', 'Chrome on Mac' — so a person can tell their devices apart
  created_at   timestamptz not null default now(),
  last_sent_at timestamptz
);
create index if not exists iowa_push_subscriptions_staff_idx on iowa_push_subscriptions (staff_id);

alter table iowa_push_subscriptions enable row level security;
