-- ARK Iowa — reminder lists for events.
-- See docs/IOWA-CAMPUS-TASKS.md → "Reminder lists".
--
-- Students say "yes" to Friday Fill Up or the Tuesday prayer call in person,
-- not on a form. Staff keep that list on the event (yes / maybe / no). A few
-- days before each date (default 2), the morning run makes an unowned task:
-- "Text the <event> list", with a Text button per person. One list per event:
-- a weekly event's list carries over every week.
--
-- Server-only like 006+: RLS on, no policies, no grants.

create table if not exists iowa_event_reminder_people (
  event_id    uuid not null references iowa_events(id) on delete cascade,
  contact_id  uuid not null references contacts(id) on delete cascade,
  response    text not null default 'yes' check (response in ('yes', 'maybe', 'no')),
  note        text,
  added_by    uuid references iowa_staff(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  primary key (event_id, contact_id)
);
alter table iowa_event_reminder_people enable row level security;

-- Days before each date the "text them" task appears.
alter table iowa_events
  add column if not exists reminder_days_before smallint not null default 2
    check (reminder_days_before between 0 and 14);
