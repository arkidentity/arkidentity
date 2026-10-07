-- 042: Link staff to Daily DNA (Travis, 2026-10-07).
-- Staff, interns and student leaders on an event's team (and whoever made it) see a guest-list
-- event in Daily DNA next to the guests. A student who is also staff can point both records at the
-- same Daily DNA account (no unique index here, unlike campus_students).
alter table iowa_staff
  add column if not exists daily_dna_account_id uuid,
  add column if not exists daily_dna_name       text,
  add column if not exists daily_dna_linked_at  timestamptz;
