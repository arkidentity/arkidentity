-- Ministry Feed — Phase 4: partner subscriptions
--
-- Extends the `partners` table (created in 001) for two intake paths:
--  1. Existing partners you import/add yourself — trusted, confirmed = true.
--  2. Strangers who subscribe on the public feed — confirmed = false until they
--     click the confirmation link (double opt-in), protecting deliverability.
--
-- Tokens are opaque, single-purpose, and used in unauthenticated links, so they
-- must be unguessable (generated with gen_random_uuid()).

alter table partners
  add column if not exists confirmed boolean not null default false,
  add column if not exists confirm_token text,
  add column if not exists unsubscribe_token text not null default gen_random_uuid()::text,
  add column if not exists confirmed_at timestamptz;

create index if not exists partners_confirm_token_idx on partners (confirm_token);
create unique index if not exists partners_unsubscribe_token_key on partners (unsubscribe_token);

-- Only email/both partners need a unique email; text-only partners may share
-- null. Prevents duplicate public signups for the same address.
create unique index if not exists partners_email_key
  on partners (lower(email))
  where email is not null;

-- All partner reads/writes go through server routes using the service-role key
-- (admin behind the /admin proxy; public subscribe/confirm/unsubscribe routes
-- validate a token). No anon/authenticated grants are added.
