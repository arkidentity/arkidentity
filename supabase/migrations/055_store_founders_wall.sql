-- 055: Founders wall (Travis, 2026-11-03).
-- Crowdfunding-style list of who reserved decks, on creedcards.com. After
-- paying, the buyer lands on /thanks?session_id=cs_... and can add a display
-- name, city and short message, or stay anonymous. Anonymous orders still show
-- ("A founder · 2 decks"), so the crowd is real either way.
--
-- Names and messages show right away (Travis 11/3); Travis can hide a message
-- in /admin/orders. The Checkout Session id (long, random, only in the buyer's
-- redirect) is what lets the buyer edit their own entry.

alter table store_orders
  add column if not exists wall_public       boolean not null default false, -- show name/city (else "A founder")
  add column if not exists wall_city         text,
  add column if not exists wall_message      text,
  add column if not exists wall_message_ok   boolean not null default true,  -- false = Travis hid the message
  add column if not exists wall_updated_at   timestamptz;
