-- ============================================================
-- Migration 047: trip registrations (Travis 2026-10-24) — Baja 2027 first
-- The interest form tags a contact "Baja 2027" (Interested). Registering ("I'm in") or a staff "Move to Going"
-- adds a row here (Going). Staff tick each person's checks in Admin → Events → Baja 2027.
-- Plan: ark-workspace/projects/ark-identity/baja-2027/PLAN.md
-- ============================================================

CREATE TABLE IF NOT EXISTS iowa_trip_registrations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip              TEXT NOT NULL,                 -- 'baja-2027'
  contact_id        UUID REFERENCES contacts(id) ON DELETE SET NULL,
  name              TEXT NOT NULL,
  email             TEXT,
  phone             TEXT,
  school            TEXT,
  year              TEXT,
  birthday          DATE,
  passport          TEXT,                          -- 'have' | 'applied' | 'need'
  passport_expires  DATE,
  emergency_name    TEXT,
  emergency_phone   TEXT,
  medical           TEXT,                          -- allergies, medical notes, diet
  shirt             TEXT,
  note              TEXT,
  checks            JSONB NOT NULL DEFAULT '{}',   -- { deposit, passport, forms, flight, paid } = true when done
  raised            NUMERIC(10,2) NOT NULL DEFAULT 0,
  status            TEXT NOT NULL DEFAULT 'going', -- 'going' | 'withdrawn'
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS iowa_trip_registrations_trip_contact ON iowa_trip_registrations (trip, contact_id) WHERE contact_id IS NOT NULL;
ALTER TABLE iowa_trip_registrations ENABLE ROW LEVEL SECURITY; -- server only (service role)
GRANT ALL ON iowa_trip_registrations TO service_role;
