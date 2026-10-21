-- Migration 045: a sign-up link on campus events (Travis 2026-10-21)
-- Sent to Daily DNA with "Show in Daily DNA" (Daily DNA Mig 319): students see a "Sign up" button that opens the
-- link inside the app, e.g. Trick or Truth → https://arkidentity.com/iowa/trick-or-truth
ALTER TABLE iowa_events ADD COLUMN IF NOT EXISTS signup_url TEXT;
