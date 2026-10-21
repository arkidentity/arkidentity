-- Migration 046: a description for Daily DNA on campus events (Travis 2026-10-21)
-- "Notes" stay for the team. This is what students read about the event in Daily DNA (sent as the event's description).
ALTER TABLE iowa_events ADD COLUMN IF NOT EXISTS daily_dna_description TEXT;
