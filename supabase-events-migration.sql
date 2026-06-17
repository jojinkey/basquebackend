-- ═══════════════════════════════════════════════════════════════════
--  BASQUE EVENTS CMS — Supabase Migration
--  Run this in: Supabase Dashboard → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════════════

-- ─── 1. EVENTS TABLE ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS events (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title                text        NOT NULL,
  tagline              text,
  event_date           text,
  background_image_url text,
  is_published         bool        NOT NULL DEFAULT false,
  upi_id               text,
  qr_image_url         text,
  vip_whatsapp         text,
  max_tickets          int         NOT NULL DEFAULT 20,
  ticket_types         jsonb       NOT NULL DEFAULT '[]',
  vip_packages         jsonb       NOT NULL DEFAULT '[]',
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

-- ─── 2. TICKET BOOKINGS TABLE ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS ticket_bookings (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id     uuid        REFERENCES events(id) ON DELETE SET NULL,
  name         text        NOT NULL,
  email        text,
  phone        text,
  ticket_type  text,
  quantity     int         NOT NULL DEFAULT 1,
  total_amount int         NOT NULL DEFAULT 0,
  booking_ref  text,
  status       text        NOT NULL DEFAULT 'pending'
                           CHECK (status IN ('pending', 'confirmed', 'rejected')),
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ─── 3. ROW LEVEL SECURITY ──────────────────────────────────────────
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_bookings ENABLE ROW LEVEL SECURITY;

-- Allow full public access (restrict via service role on backend if needed)
DROP POLICY IF EXISTS "events_all"           ON events;
DROP POLICY IF EXISTS "ticket_bookings_all"  ON ticket_bookings;

CREATE POLICY "events_all"
  ON events FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "ticket_bookings_all"
  ON ticket_bookings FOR ALL USING (true) WITH CHECK (true);

-- ─── 4. SEED EXAMPLE EVENT (optional — delete if not needed) ────────
-- Uncomment to pre-seed Arabian Night event:
/*
INSERT INTO events (title, tagline, event_date, is_published, upi_id, qr_image_url, vip_whatsapp, max_tickets, ticket_types, vip_packages)
VALUES (
  'Arabian Night',
  'An unforgettable evening of mystique, music & indulgence',
  'Saturday, June 2026',
  true,
  '88094180@idfcbank',
  '/qr-arabian-night.png',
  '919821199832',
  20,
  '[
    {"id":"girls",   "label":"Girls",   "price":549},
    {"id":"boys",    "label":"Boys",    "price":649},
    {"id":"couples", "label":"Couples", "price":1199}
  ]'::jsonb,
  '[
    {"id":"platinum","name":"VIP Platinum","price":35000,"pax":9,"features":["Unlimited food","2 Bottles + 1 Pitcher","Rooftop VIP access","Bottle service"]},
    {"id":"gold",    "name":"VIP Gold",    "price":25000,"pax":4,"features":["Unlimited food","2 Bottles","Premium table","Bottle service"]}
  ]'::jsonb
);
*/

-- ─── DONE ────────────────────────────────────────────────────────────
SELECT 'Events CMS migration complete ✓' AS status;
