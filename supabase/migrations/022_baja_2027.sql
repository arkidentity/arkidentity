-- ARK Identity — ARK Iowa: Baja Mission Trip 2027 on the campus calendar
--
-- A "Baja 2027" checklist that follows the fundraising schedule on /iowa/baja
-- (Sept 2026 → debrief), applied to one trip event. Every date is a PLACEHOLDER
-- until uReach confirms the week: move the trip event in the admin and every
-- open checklist task re-times itself (realignEvent).
--
-- Trip anchor: Sun 2027-06-13. Offsets below are days from that date.
-- Plus two gatherings: Interest Meeting (Thu 2026-10-15, 7 PM, placeholder)
-- and Commissioning Night (Sun 2027-06-06, 7 PM).
--
-- Tasks are made by the morning run (generateAllChecklists). Owner = first
-- staff on the event (Travis, if found by email). Events inserted here don't
-- reach Google until they're saved once in the admin.
-- Data only; no schema. Safe to re-run (guards on names/titles).

do $$
declare
  tpl        uuid;
  trip       uuid;
  meeting    uuid;
  send_off   uuid;
  travis     uuid;
  trip_type  uuid;
  gather     uuid;
begin
  select id into travis from iowa_staff where lower(email) = 'travis@arkidentity.com' and active limit 1;
  if travis is null then
    select id into travis from iowa_staff where active order by created_at limit 1;
  end if;
  select id into gather from iowa_item_types where kind = 'event' and lower(name) = 'gathering' limit 1;

  -- An event type for trips (Settings can rename it).
  select id into trip_type from iowa_item_types where kind = 'event' and lower(name) = 'mission trip' limit 1;
  if trip_type is null then
    insert into iowa_item_types (kind, name, sort) values ('event', 'Mission trip', 7) returning id into trip_type;
  end if;

  -- The checklist.
  select id into tpl from iowa_checklist_templates where name = 'Baja 2027' limit 1;
  if tpl is null then
    insert into iowa_checklist_templates (name) values ('Baja 2027') returning id into tpl;
    insert into iowa_checklist_items (template_id, title, description, offset_days, priority, sort) values
      (tpl, 'Send the Baja overview + video to students', 'Link: arkidentity.com/iowa/baja. Ask everyone to pray first.', -258, 'high', 1),
      (tpl, 'Confirm the trip week + payment deadlines with uReach', 'Then move the Baja event to the real date — every task re-times.', -250, 'high', 2),
      (tpl, 'Set up the interest meeting + invite the Baja 2027 list', 'Students page → tag "Baja 2027" is everyone who filled the form.', -244, 'high', 3),
      (tpl, 'Passport push: text everyone without one', 'Form email shows who answered No / Not sure.', -236, 'normal', 4),
      (tpl, 'Commitments + $100 deposits due; support letter workshop', 'Goal: $100 raised.', -210, 'high', 5),
      (tpl, 'Support letters sent before Christmas', 'Family and home churches. Goal: $300 raised.', -182, 'normal', 6),
      (tpl, 'Thank every giver + one prayer update', 'Goal: $500 raised.', -147, 'normal', 7),
      (tpl, 'Book flights to San Diego', 'Update the flight estimate on /iowa/baja.', -126, 'high', 8),
      (tpl, 'Team fundraiser', 'Goal: $750 raised.', -112, 'normal', 9),
      (tpl, 'Second round of asks (spring break follow-ups)', 'Goal: $1,000 raised.', -91, 'normal', 10),
      (tpl, 'uReach second payment', 'Placeholder — match to uReach''s real deadline. Goal: $1,250 raised.', -63, 'high', 11),
      (tpl, 'Final payment; goal fully raised', 'Goal: $1,500 raised.', -35, 'urgent', 12),
      (tpl, 'Team training + packing list', null, -21, 'normal', 13),
      (tpl, 'Medical/consent forms + emergency contacts in', null, -14, 'high', 14),
      (tpl, 'Debrief + thank-you notes to givers', null, 10, 'normal', 15);
  end if;

  -- The trip.
  select id into trip from iowa_events where title = 'Baja Mission Trip 2027' limit 1;
  if trip is null then
    insert into iowa_events (title, type_id, event_date, location, notes, checklist_template_id, created_by)
    values ('Baja Mission Trip 2027', trip_type, '2027-06-13', 'uReach base, San Quintín Valley, Baja California',
            'PLACEHOLDER DATE until uReach confirms the week. 8–9 days total with travel. Page: arkidentity.com/iowa/baja',
            tpl, travis)
    returning id into trip;
    if travis is not null then
      insert into iowa_event_staff (event_id, staff_id, response, responded_at) values (trip, travis, 'accepted', now());
    end if;
  end if;

  -- Interest meeting.
  select id into meeting from iowa_events where title = 'Baja Interest Meeting' limit 1;
  if meeting is null then
    insert into iowa_events (title, type_id, event_date, start_time, end_time, notes, created_by)
    values ('Baja Interest Meeting', gather, '2026-10-15', '19:00', '20:00',
            'PLACEHOLDER date/time/room. Invite everyone tagged Baja 2027. Cover: trip, costs, passports, how gifts are given.',
            travis)
    returning id into meeting;
    if travis is not null then
      insert into iowa_event_staff (event_id, staff_id, response, responded_at) values (meeting, travis, 'accepted', now());
    end if;
  end if;

  -- Commissioning night.
  select id into send_off from iowa_events where title = 'Baja Commissioning Night' limit 1;
  if send_off is null then
    insert into iowa_events (title, type_id, event_date, start_time, end_time, notes, created_by)
    values ('Baja Commissioning Night', gather, '2027-06-06', '19:00', '20:30',
            'PLACEHOLDER — the week before the trip. Pray over the team; invite families and givers.',
            travis)
    returning id into send_off;
    if travis is not null then
      insert into iowa_event_staff (event_id, staff_id, response, responded_at) values (send_off, travis, 'accepted', now());
    end if;
  end if;
end $$;
