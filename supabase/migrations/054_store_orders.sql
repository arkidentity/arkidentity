-- 054: ARK store orders (Travis, 2026-11-03).
-- One order list for every ARK product and every front door (creedcards.com
-- now, outreachinabox.app and arkidentity.com/store later). All checkouts run
-- on the LLC's one Stripe account; its webhook (/api/store/stripe-webhook)
-- writes one row per paid Checkout Session. Packing + shipping happen in
-- /admin/orders. Plan: ark-workspace/projects/ark-identity/ark-store/PLAN.md.
--
-- Buyers are customers, not donors: nothing here touches the contacts list.

create table if not exists store_orders (
  id                 uuid primary key default gen_random_uuid(),
  stripe_session_id  text not null unique,      -- cs_... (webhook retries are no-ops)
  stripe_payment_intent text,
  brand              text not null default 'cc', -- cc / oib / ark
  created_at         timestamptz not null default now(),
  paid_at            timestamptz,

  email              text,
  name               text,
  phone              text,
  ship_name          text,
  ship_address       jsonb,                      -- { line1, line2, city, state, postal_code, country }
  shipping_rate      text,                       -- "Standard" / "Priority"

  -- From the Payment Link's custom fields.
  gift_recipient     text,                       -- free-text name + address (Keep One, Give One)
  gift_note          text,
  wall_name          text,                       -- Founders wall, opt-in
  group_name         text,                       -- Bulk: church or group

  items              jsonb not null default '[]', -- [{ sku, name, quantity, amount_cents }]
  decks              int not null default 0,     -- paid decks
  bonus_decks        int not null default 0,     -- Bulk: 1 free per 10
  journals           int not null default 0,     -- add-on + 25+ bonus
  bonus_note         text,                       -- "Group guide", "DNA Journal", "Call with Travis"

  subtotal_cents     int,
  shipping_cents     int,
  tax_cents          int,
  total_cents        int,

  status             text not null default 'paid'
                     check (status in ('paid', 'packed', 'shipped', 'refunded', 'canceled')),
  tracking_number    text,
  shipped_at         timestamptz,
  notes              text
);

create index if not exists store_orders_status_idx on store_orders (status, created_at);
create index if not exists store_orders_brand_idx on store_orders (brand, created_at desc);

alter table store_orders enable row level security;
grant all on store_orders to service_role;
