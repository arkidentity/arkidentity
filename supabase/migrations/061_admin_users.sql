-- ARK Admin (/admin) — named logins.
--
-- Replaces the single shared FEED_ADMIN_PASSWORD with one login per person
-- (Travis, Kimberly), the same way 011 did for ARK Iowa. Everyone has full
-- /admin access for now; the account exists so the app knows WHO is signed in
-- and so one person's access can be turned off without changing anyone else's.
--
-- First run: while this table is empty, the old shared password plus your
-- email creates the first account. After that, only named logins work, and new
-- people are added from /admin/users.
--
-- Server-only: service-role access through route handlers, RLS on with no
-- policies, so no anon/authenticated GRANTs.

create table if not exists admin_users (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  email          text not null,
  password_hash  text not null,                 -- 'pbkdf2$<iterations>$<salt hex>$<hash hex>'
  active         boolean not null default true,  -- false = can't sign in; history kept
  created_at     timestamptz not null default now()
);

create unique index if not exists admin_users_email_idx on admin_users (lower(email));

alter table admin_users enable row level security;
