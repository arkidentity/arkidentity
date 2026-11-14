-- 062: "In a study elsewhere" student status (Travis, 2026-11-13).
-- A student we met who found a Bible study with another group: good news, not a
-- placement job. The morning run only makes find-a-study / reconnect tasks for
-- Active and Needs a study, so this status stops those reminders.
-- If they later join one of our studies, they become Active like Needs a study does.

alter table campus_students drop constraint if exists campus_students_status_check;
alter table campus_students
  add constraint campus_students_status_check
  check (status in ('unplaced','active','dormant','elsewhere','graduated','transferred','left_school'));

create or replace function sync_campus_student_status() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  cid uuid;
  in_study boolean;
  last_reason text;
  cur text;
begin
  foreach cid in array array_remove(array[
    case when tg_op <> 'INSERT' then old.contact_id end,
    case when tg_op <> 'DELETE' then new.contact_id end
  ], null) loop
    select status into cur from campus_students where contact_id = cid;
    if cur is null then continue; end if;

    select exists (
      select 1 from bible_study_members
       where contact_id = cid and status = 'active'
    ) into in_study;

    if in_study and cur in ('unplaced','dormant','elsewhere') then
      update campus_students
         set status = 'active', dormant_at = null, dormant_reason = null, dormant_note = null, updated_at = now()
       where contact_id = cid;
      insert into campus_student_events (contact_id, from_status, to_status) values (cid, cur, 'active');
    elsif not in_study and cur = 'active' then
      select drop_reason into last_reason
        from bible_study_members
       where contact_id = cid and status = 'dropped'
       order by left_at desc nulls last
       limit 1;
      update campus_students
         set status = case when last_reason = 'left_school' then 'left_school' else 'unplaced' end,
             updated_at = now()
       where contact_id = cid;
      insert into campus_student_events (contact_id, from_status, to_status)
      values (cid, cur, case when last_reason = 'left_school' then 'left_school' else 'unplaced' end);
    end if;
  end loop;
  return null;
end $$;

