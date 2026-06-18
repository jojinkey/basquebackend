-- ============================================================================
-- BASQUE MANAGER OS — ADMIN FUNCTIONS
-- Run once in: Supabase Dashboard → SQL Editor → New query → Paste → Run
-- ============================================================================

-- ─── clear_all_data() ───────────────────────────────────────────────────────
-- Wipes ALL operational data (orders, sessions, waitlist, service requests,
-- reservations, audit logs) and resets every table to "available".
-- SECURITY DEFINER lets it bypass RLS so the dashboard button can call it.

CREATE OR REPLACE FUNCTION clear_all_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM order_items WHERE id IS NOT NULL;
  DELETE FROM orders WHERE id IS NOT NULL;
  DELETE FROM service_requests WHERE id IS NOT NULL;
  DELETE FROM waitlist_entries WHERE id IS NOT NULL;
  DELETE FROM reservation_stage_history WHERE id IS NOT NULL;
  DELETE FROM table_sessions WHERE id IS NOT NULL;
  DELETE FROM audit_logs WHERE id IS NOT NULL;
  DELETE FROM reservations WHERE id IS NOT NULL;
  UPDATE tables SET status = 'available', current_session = NULL WHERE id IS NOT NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION clear_all_data() TO anon, authenticated;


-- ─── Ensure reset_demo_data() also bypasses RLS reliably ────────────────────
ALTER FUNCTION reset_demo_data() SECURITY DEFINER;
GRANT EXECUTE ON FUNCTION reset_demo_data() TO anon, authenticated;
