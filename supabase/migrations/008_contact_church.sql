-- ARK Identity — contacts.church
--
-- Where a contact attends (or the church that connects them to us). A field,
-- not a tag, for the same reason city/state are fields: free-text tags sprawl
-- ("Cornerstone" / "cornerstone" / "Cornerstone Church") and segment tags are
-- ANDed, so the variants would never match each other.
--
-- Split out of 007 because that migration had already been applied.

alter table contacts
  add column if not exists church text;

create index if not exists contacts_church_idx on contacts (church) where church is not null;
