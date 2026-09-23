-- ARK Iowa — whose time a synced event actually blocks.
-- See docs/IOWA-CAMPUS-TASKS.md → "Free vs busy".
--
-- Everything the app pushes to the shared ARK Campus calendar defaulted to
-- BUSY in Google, so every Bible study blocked Travis's booking slots —
-- including the ones a student leads and he never attends.
--
-- Google's free/busy flag is a property of the event, not of the viewer, and
-- one shared calendar means one answer for everyone. So: name the person whose
-- calendar these events should block (Travis, the only one with a booking
-- link), and mark an event busy only when it's actually his.
--
-- Server-only like 006+: RLS on, no policies, no grants.

alter table iowa_calendar_sync
  add column if not exists busy_staff_id uuid references iowa_staff(id) on delete set null;
