-- ARK Iowa — a Bible study's team beyond the staff member on point.
-- See docs/IOWA-CAMPUS-TASKS.md → "Study team".
--
-- Travis stays on point (responsible); an intern joins as Shadowing (watch),
-- Assisting (take a piece), or Leading (facilitate) — the internship's path
-- from practice to leading a table. Either for one date ("just Wed Oct 7") or
-- every week (occurrence null). Joining is an invite they accept or decline,
-- like event invites (migration 020). Internal only: students never see it.
--
-- Server-only like 006+: RLS on, no policies, no grants.

create table if not exists iowa_study_staff (
  id            uuid primary key default gen_random_uuid(),
  study_id      uuid not null references bible_studies(id) on delete cascade,
  staff_id      uuid not null references iowa_staff(id) on delete cascade,
  role          text not null check (role in ('shadow', 'assist', 'lead')),
  occurrence    date,                                  -- null = every week
  response      text not null default 'pending' check (response in ('pending', 'accepted', 'declined')),
  note          text,
  invited_by    uuid references iowa_staff(id) on delete set null,
  invited_at    timestamptz not null default now(),
  responded_at  timestamptz
);
-- One role per person per study per date (or per "every week").
create unique index if not exists iowa_study_staff_one_idx
  on iowa_study_staff (study_id, staff_id, coalesce(occurrence, '1900-01-01'::date));
create index if not exists iowa_study_staff_staff_idx on iowa_study_staff (staff_id, response);

alter table iowa_study_staff enable row level security;
