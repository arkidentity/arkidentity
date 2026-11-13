-- 059: Extra jobs on a student leader's login (2026-11-13).
-- A student leader leads their own study and nothing else in the admin. Most of
-- what they do moves to Daily DNA; the admin is for an extra job someone takes
-- on: keeping the calendar, welcoming and placing new students, handing out
-- tasks. Each job is switched on per person by staff (Staff page → Edit).
-- Keys match lib/iowaJobs.ts: 'calendar', 'welcome', 'tasks'.
-- Staff and interns already have every job through their role.

alter table iowa_staff
  add column if not exists jobs text[] not null default '{}';
