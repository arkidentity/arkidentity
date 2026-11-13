-- 057: "New" student status (Travis, 2026-11-13).
-- Active now means "in a Bible study". Someone we met who hasn't joined one is New.
-- The database keeps the two in step whenever a seat changes, so no code path can drift:
--   * gaining an active seat: New -> Active
--   * losing the last active seat: Active -> New
-- Dormant, graduated, transferred and left school are staff calls and are never touched.

alter table campus_students drop constraint if exists campus_students_status_check;
alter table campus_students
  add constraint campus_students_status_check
  check (status in ('new','active','dormant','graduated','transferred','left_school'));
alter table campus_students alter column status set default 'new';

-- Backfill: "active" students with no active seat today become New.
update campus_students cs
   set status = 'new', updated_at = now()
 where cs.status = 'active'
   and not exists (
     select 1 from bible_study_members m
      where m.contact_id = cs.contact_id and m.status = 'active');

-- And anyone New who already holds a seat is Active.
update campus_students cs
   set status = 'active', updated_at = now()
 where cs.status = 'new'
   and exists (
     select 1 from bible_study_members m
      where m.contact_id = cs.contact_id and m.status = 'active');

create or replace function sync_campus_student_status() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  cid uuid;
  in_study boolean;
begin
  foreach cid in array array_remove(array[
    case when tg_op <> 'INSERT' then old.contact_id end,
    case when tg_op <> 'DELETE' then new.contact_id end
  ], null) loop
    select exists (
      select 1 from bible_study_members
       where contact_id = cid and status = 'active'
    ) into in_study;

    if in_study then
      update campus_students set status = 'active', updated_at = now()
       where contact_id = cid and status = 'new';
    else
      update campus_students set status = 'new', updated_at = now()
       where contact_id = cid and status = 'active';
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
  if new.status in ('new','active') then
    new.status := case when exists (
      select 1 from bible_study_members
       where contact_id = new.contact_id and status = 'active'
    ) then 'active' else 'new' end;
  end if;
  return new;
end $$;

drop trigger if exists campus_students_initial_status on campus_students;
create trigger campus_students_initial_status
  before insert on campus_students
  for each row execute function campus_student_initial_status();
