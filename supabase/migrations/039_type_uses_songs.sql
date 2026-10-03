-- ARK Iowa — songs only on events that need them.
-- See docs/IOWA-CAMPUS-TASKS.md → "Songs".
--
-- The event popup offered "Songs" on everything, lunch with an intern
-- included. Now an event type says whether its events use a setlist (Settings
-- → Event types → "Songs"). Events of other types, or with no type, hide the
-- section — unless the event already has songs, which always show.

alter table iowa_item_types
  add column if not exists uses_songs boolean not null default false;

update iowa_item_types
  set uses_songs = true
  where kind = 'event'
    and (name ilike '%worship%' or name ilike '%prayer%' or name ilike 'gathering');
