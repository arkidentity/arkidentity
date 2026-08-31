-- ARK Identity — ARK Iowa: the student behind the seat
--
-- 007 split the person (contacts) from the seat (bible_study_members). This
-- adds the third thing: what is true about someone *as a campus student* —
-- their year, and where they are in the ministry's life cycle. Neither belongs
-- on the seat (a student's year doesn't change when they switch studies) nor on
-- contacts (a partner in Denver has no year).
--
-- Deliberately NOT stored here: whether they're currently in a study. That is
-- derived from an active bible_study_members row, so it can't drift out of sync
-- with the actual roster. `status` covers only what the roster can't tell you.

create table if not exists campus_students (
  contact_id uuid primary key references contacts(id) on delete cascade,
  year       text,                                    -- 'first-year', 'sophomore', ...
  status     text not null default 'active'
               check (status in ('active','dormant','graduated','transferred','left_school')),
  notes      text,                                    -- Travis's private notes
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists campus_students_status_idx on campus_students (status);
create index if not exists campus_students_year_idx on campus_students (year);

-- Everyone already tagged ARK Iowa becomes a student record, carrying over the
-- year from their most recent seat.
insert into campus_students (contact_id, year)
select l.contact_id,
       (select m.year
          from bible_study_members m
         where m.contact_id = l.contact_id and m.year is not null
         order by m.joined_at desc
         limit 1)
  from contact_tag_links l
  join contact_tags t on t.id = l.tag_id
 where t.slug = 'ark-iowa'
on conflict (contact_id) do nothing;

-- Year now lives on the student, not the seat.
alter table bible_study_members drop column if exists year;

alter table campus_students enable row level security;
