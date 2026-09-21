-- ARK Iowa — staff logins + "staff on point" per study.
--
-- Replaces the single shared IOWA_ADMIN_PASSWORD with one login per staff
-- member (Travis, interns). Every staff member has full admin access; the
-- account exists so the app knows WHO is signed in (for "my studies") and so an
-- intern's access can be turned off without changing anyone else's password.
--
-- point_staff_id = the staff member who has to physically be at a study — the
-- one or two students that haven't got a student leader yet. Distinct from
-- leader_name/phone/email, which is the student who leads it.
--
-- Server-only like 006: service-role access through route handlers, RLS on with
-- no policies, so no anon/authenticated GRANTs.

create table if not exists iowa_staff (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  email          text not null,
  phone          text,
  password_hash  text not null,                 -- 'pbkdf2$<iterations>$<salt hex>$<hash hex>'
  active         boolean not null default true,  -- false = can't sign in; history kept
  created_at     timestamptz not null default now()
);

create unique index if not exists iowa_staff_email_idx on iowa_staff (lower(email));

alter table iowa_staff enable row level security;

alter table bible_studies
  add column if not exists point_staff_id uuid references iowa_staff(id) on delete set null;

create index if not exists bible_studies_point_staff_idx on bible_studies (point_staff_id);
