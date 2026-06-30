-- ============================================================================
-- BASQUE MANAGER OS — OPERATIONS & MANAGEMENT UPGRADES
-- Run in: Supabase Dashboard → SQL Editor → New query → Paste → Run
-- ============================================================================

-- 1. Add is_active column to sections (defaults to true)
ALTER TABLE public.sections ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- 2. Update existing rows to ensure they are set to true
UPDATE public.sections SET is_active = true WHERE is_active IS NULL;

-- 3. Enable UPDATE policy on sections so dashboard users can toggle them
DROP POLICY IF EXISTS "Anyone can update sections" ON public.sections;
CREATE POLICY "Anyone can update sections" ON public.sections FOR UPDATE USING (true) WITH CHECK (true);

-- 4. Add allowed_pages column to users (defaults to NULL)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS allowed_pages text[] DEFAULT NULL;

