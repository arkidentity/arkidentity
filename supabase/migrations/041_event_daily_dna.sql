-- 041: "Show in Daily DNA" on campus events (Travis, 2026-10-07).
-- Checked events go to everyone at ARK Iowa on Daily DNA as a church event (Join card,
-- Remind me, live-now strip). Off by default. Works on Google-owned events too.
alter table iowa_events add column if not exists show_in_daily_dna boolean not null default false;
