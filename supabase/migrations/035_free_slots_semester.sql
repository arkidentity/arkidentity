-- ARK Iowa — free times belong to a semester.
-- See docs/IOWA-CAMPUS-TASKS.md → "Free times at signup".
--
-- "Free Tuesday afternoon" in September means nothing in January. Each saved
-- pick now records which semester it was for (the study they joined/started,
-- or the semester tab they were on), and "Who's waiting" only counts picks
-- for the semester being viewed — old answers drop off on their own.
--
-- Picks saved before this (Fall 2026 only) are stamped Fall 2026.

alter table campus_students
  add column if not exists free_slots_semester text;

update campus_students
  set free_slots_semester = 'Fall 2026'
  where free_slots_semester is null and cardinality(free_slots) > 0;
