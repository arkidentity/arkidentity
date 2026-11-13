-- 057: "Needs a study" student status (Travis, 2026-11-13).
-- Active now means "in a Bible study". Someone we met who isn't in one (never joined, or
-- dropped) is unplaced, shown as "Needs a study". The database keeps status in step with
-- the roster whenever a seat changes, so no code path can drift:
--   * gaining an active seat: Needs a study or Dormant -> Active
--   * losing the last active seat: Active -> Needs a study,
--     or Left school when that drop's reason was "left school"
-- Graduated, transferred and left school are never changed by joining a study.

alter table campus_students drop constraint if exists campus_students_status_check;
alter table campus_students
  add constraint campus_students_status_check
  check (status in ('unplaced','active','dormant','graduated','transferred','left_school'));
alter table campus_students alter column status set default 'unplaced';

-- Backfill: "active" students with no active seat today need a study.
update campus_students cs
   set status = 'unplaced', updated_at = now()
 where cs.status = 'active'
   and not exists (
     select 1 from bible_study_members m
      where m.contact_id = cs.contact_id and m.status = 'active');

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

    if in_study and cur in ('unplaced','dormant') then
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

drop trigger if exists bible_study_members_sync_status on bible_study_members;
create trigger bible_study_members_sync_status
  after insert or update of status, contact_id or delete on bible_study_members
  for each row execute function sync_campus_student_status();

-- A campus_students row is often created right after the seat (joinStudy inserts the
-- seat, then ensureCampusStudent runs). Start that row at the right status too.
create or replace function campus_student_initial_status() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status in ('unplaced','active') then
    new.status := case when exists (
      select 1 from bible_study_members
       where contact_id = new.contact_id and status = 'active'
    ) then 'active' else 'unplaced' end;
  end if;
  return new;
end $$;

drop trigger if exists campus_students_initial_status on campus_students;
create trigger campus_students_initial_status
  before insert on campus_students
  for each row execute function campus_student_initial_status();
