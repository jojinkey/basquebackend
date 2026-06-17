-- ═══════════════════════════════════════════════════════════════════
--  BASQUE EVENTS CMS — Add Custom Styling Support
--  Run this in: Supabase Dashboard → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE events ADD COLUMN IF NOT EXISTS custom_styles jsonb NOT NULL DEFAULT '{}'::jsonb;

SELECT 'Events CMS styling migration complete ✓' AS status;
