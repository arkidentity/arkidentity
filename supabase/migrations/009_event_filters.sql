-- ARK Identity — an event remembers who it's for
--
-- Before this, an event only knew who had already been invited; working out who
-- was still left meant re-running a segment by hand and remembering the filters.
-- Storing the filter set on the event turns that into a standing question the
-- event answers itself: "who matches this, minus everyone already invited".
--
-- jsonb rather than columns because the shape is the SegmentFilters object in
-- lib/contacts.ts (state / region / church / tag arrays), and it will grow.
-- Nothing queries inside it — it is read whole, handed to runSegment, and the
-- filtering happens against contacts.

alter table contact_events
  add column if not exists filters jsonb;
