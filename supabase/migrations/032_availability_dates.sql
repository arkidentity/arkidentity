-- ARK Iowa — busy blocks that only run part of a semester.
-- See docs/IOWA-CAMPUS-TASKS.md → "Who's free?".
--
-- A block was "every Tuesday 10-11 for the whole semester". A half-semester
-- class, or a job that starts in October, needs a date range. Both null keeps
-- the old meaning (the whole semester), so nothing existing changes.
--
-- Server-only like 006+: RLS on, no policies, no grants.

alter table iowa_availability
  add column if not exists starts_on date,
  add column if not exists ends_on date;
