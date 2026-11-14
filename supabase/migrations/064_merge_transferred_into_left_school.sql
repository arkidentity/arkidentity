-- 064: merge "Transferred" into "Left school", shown as "Left Iowa" (Travis, 2026-11-13).
-- Both meant "not on campus anymore" and worked the same everywhere. Where they went
-- can go in a history note. Old history lines keep their words; the admin shows both
-- as "Left Iowa". Needs 062 and 063 first.

update campus_students set status = 'left_school', updated_at = now() where status = 'transferred';

alter table campus_students drop constraint if exists campus_students_status_check;
alter table campus_students
  add constraint campus_students_status_check
  check (status in ('unplaced','active','dormant','elsewhere','not_interested','graduated','left_school'));
