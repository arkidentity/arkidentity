-- 056: gift recipients per order (Travis, 2026-11-07).
-- One Deck can send any of its decks to other people, and Keep One, Give One can add more gift decks;
-- each recipient is its own package. Shop checkout passes them in Stripe metadata (lib/shopCheckout.ts) and the
-- webhook saves them here (lib/store.ts). gift_recipient / gift_note stay as the readable summary (old orders,
-- Payment Links, GHL notes).
--
-- gifts:     [{ name, line1, line2, city, state, zip, note, decks }]  (one deck each for now)
-- own_decks: decks for the buyer's own address (null = old orders: total decks minus gift decks)

alter table store_orders add column if not exists gifts jsonb not null default '[]';
alter table store_orders add column if not exists own_decks int;
