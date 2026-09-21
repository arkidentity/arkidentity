-- ARK Iowa — skip one week of a weekly campus event (finals week, a week off).
--
-- skip_dates are local (America/Chicago) dates the series doesn't happen on.
-- Admin-owned events: set in the admin, pushed to Google as EXDATEs.
-- Google-owned events: filled by the importer from instances cancelled in
-- Google (and any EXDATE on the series).

alter table iowa_events
  add column if not exists skip_dates date[] not null default '{}';
