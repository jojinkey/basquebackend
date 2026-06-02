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
  DELETE FROM order_items;
  DELETE FROM orders;
  DELETE FROM service_requests;
  DELETE FROM waitlist_entries;
  DELETE FROM reservation_stage_history;
  DELETE FROM table_sessions;
  DELETE FROM audit_logs;
  DELETE FROM reservations;
  UPDATE tables SET status = 'available', current_session = NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION clear_all_data() TO anon, authenticated;


-- ─── Ensure reset_demo_data() also bypasses RLS reliably ────────────────────
ALTER FUNCTION reset_demo_data() SECURITY DEFINER;
GRANT EXECUTE ON FUNCTION reset_demo_data() TO anon, authenticated;
