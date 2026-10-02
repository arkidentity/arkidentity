-- ARK Iowa — remember when a student said they're free.
-- See docs/IOWA-CAMPUS-TASKS.md → "Free times at signup".
--
-- The public studies page has a "When are you free?" grid (day × morning /
-- afternoon / evening / late). It only filtered the list. Now whatever boxes
-- were ticked when the student joined, started a study, or asked us to reach
-- out are saved here, so whoever follows up can see their open times — and the
-- Studies page can show "3 students waiting for Tuesday afternoon".
--
-- Each slot is "<js day 0-6>-<block>", e.g. "2-afternoon". Empty = unknown.
-- Server-only like 006+: RLS already on campus_students, no new grants.

alter table campus_students
  add column if not exists free_slots text[] not null default '{}',
  add column if not exists free_slots_at timestamptz;
