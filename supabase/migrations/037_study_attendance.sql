-- ARK Iowa — attendance while a Bible study launches, and a health level.
-- See docs/IOWA-CAMPUS-TASKS.md → "Group health".
--
-- Staff and interns check off who came for a new group's first weeks (the
-- calendar's study popup prompts for the first 6 meetings, or until it's
-- solid). From the last 4 recorded meetings the group gets a level: flaky
-- (<50% of the roster shows), mid (50–79%), solid (80%+). It answers "if we
-- add a student here, will they find a group that actually meets?" Not meant
-- as long-term upkeep; once a group is solid, attendance is optional.
--
-- Server-only like 006+: RLS on, no policies, no grants.

create table if not exists iowa_study_attendance (
  study_id     uuid not null references bible_studies(id) on delete cascade,
  occurrence   date not null,
  contact_id   uuid not null references contacts(id) on delete cascade,
  present      boolean not null,
  recorded_by  uuid references iowa_staff(id) on delete set null,
  recorded_at  timestamptz not null default now(),
  primary key (study_id, occurrence, contact_id)
);
create index if not exists iowa_study_attendance_study_idx on iowa_study_attendance (study_id, occurrence);
alter table iowa_study_attendance enable row level security;
