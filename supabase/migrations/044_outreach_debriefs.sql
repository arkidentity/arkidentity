-- 044: Outreach debriefs (Travis, 2026-10-20).
-- The "mission survey" texted to volunteers each evening of Trick or Truth.
-- Counts are rough guesses from the volunteer; stories feed the host kit and the book.
create table if not exists iowa_outreach_debriefs (
  id             uuid primary key default gen_random_uuid(),
  outreach       text not null,
  name           text not null,
  slot           text,
  location       text,
  conversations  int,
  read_verse     int,
  signed_up      int,
  prayed         int,
  story          text,
  learned        text,
  again          text check (again in ('yes', 'maybe', 'no')),
  ok_to_share    boolean not null default false,
  created_at     timestamptz not null default now()
);

create index if not exists iowa_outreach_debriefs_outreach_idx on iowa_outreach_debriefs (outreach, created_at);

alter table iowa_outreach_debriefs enable row level security;
grant all on iowa_outreach_debriefs to service_role;
