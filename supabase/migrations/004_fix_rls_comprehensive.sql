-- ============================================================
-- Comprehensive RLS fixes applied during chat testing
-- Fixes: SECURITY DEFINER helpers, conversations policies,
--        profiles policies, message_reads policies
-- ============================================================

-- Step 1: Make is_team_member and is_team_admin SECURITY DEFINER
-- This prevents infinite recursion when RLS policies call these functions
CREATE OR REPLACE FUNCTION public.is_team_member(p_team_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = p_team_id AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_team_admin(p_team_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = p_team_id AND user_id = auth.uid() AND role = 'admin'
  );
$$;

-- Step 2: Fix conversations SELECT policy
-- Allow creator to see their own conversations immediately after creation
-- (before conversation_members rows exist)
DROP POLICY IF EXISTS conversations_select ON public.conversations;
CREATE POLICY conversations_select ON public.conversations FOR SELECT TO authenticated USING (
  created_by = auth.uid() OR public.is_conversation_member(id)
);

-- Step 3: Fix conversations INSERT policy with proper TO clause
DROP POLICY IF EXISTS conversations_insert ON public.conversations;
CREATE POLICY conversations_insert ON public.conversations FOR INSERT TO authenticated WITH CHECK (
  created_by = auth.uid() AND public.is_team_member(team_id)
);

-- Step 4: Add profiles policies
-- RLS was enabled but had no policies, blocking all authenticated access
DROP POLICY IF EXISTS profiles_select ON public.profiles;
CREATE POLICY profiles_select ON public.profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS profiles_update ON public.profiles;
CREATE POLICY profiles_update ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());

-- Step 5: Add message_reads policies
-- RLS was enabled but had no policies
DROP POLICY IF EXISTS message_reads_select ON public.message_reads;
CREATE POLICY message_reads_select ON public.message_reads FOR SELECT TO authenticated USING (
  user_id = auth.uid()
);

DROP POLICY IF EXISTS message_reads_insert ON public.message_reads;
CREATE POLICY message_reads_insert ON public.message_reads FOR INSERT TO authenticated WITH CHECK (
  user_id = auth.uid()
);

DROP POLICY IF EXISTS message_reads_update ON public.message_reads;
CREATE POLICY message_reads_update ON public.message_reads FOR UPDATE TO authenticated USING (
  user_id = auth.uid()
);
