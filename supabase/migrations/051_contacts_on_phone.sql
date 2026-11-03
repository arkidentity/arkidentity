-- 051: "On my phone" switch (Travis, 2026-11-03).
-- ARK holds everyone; Google (Travis's phone) holds the people he chooses.
-- A contact with on_phone = true and no google_resource_name is added to
-- Google at the next sync. Anyone already linked to Google stays synced.

alter table contacts
  add column if not exists on_phone boolean not null default false;

update contacts set on_phone = true where google_resource_name is not null;
