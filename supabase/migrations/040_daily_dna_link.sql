-- 040: Link a campus student to their Daily DNA account (plan: docs/IOWA-DAILY-DNA-LINK.md).
-- Staff link once ("Link Daily DNA" on the student). From then on, every study the student is
-- in syncs to Daily DNA as a Bible study table + its weekly meetings (lib/dailyDnaLink.ts).
alter table campus_students
  add column if not exists daily_dna_account_id uuid,          -- disciple_app_accounts.id in the Daily DNA project
  add column if not exists daily_dna_name       text,          -- what the account was called when linked
  add column if not exists daily_dna_linked_at  timestamptz;

create unique index if not exists campus_students_daily_dna_idx
  on campus_students (daily_dna_account_id) where daily_dna_account_id is not null;
