-- Fix infinite recursion in chat RLS policies
-- The conversation_members policies reference themselves, causing recursion

-- Step 1: Create a SECURITY DEFINER function that bypasses RLS to check membership
CREATE OR REPLACE FUNCTION public.is_conversation_member(conv_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversation_members
    WHERE conversation_id = conv_id AND user_id = auth.uid()
  );
$$;

-- Step 2: Fix conversations policies
DROP POLICY IF EXISTS conversations_select ON public.conversations;
CREATE POLICY conversations_select ON public.conversations FOR SELECT USING (
  public.is_conversation_member(id)
);

-- conversations_insert stays the same (no recursion issue)

-- Step 3: Fix conversation_members policies (the main culprits)
DROP POLICY IF EXISTS conv_members_select ON public.conversation_members;
CREATE POLICY conv_members_select ON public.conversation_members FOR SELECT USING (
  public.is_conversation_member(conversation_id)
);

DROP POLICY IF EXISTS conv_members_insert ON public.conversation_members;
CREATE POLICY conv_members_insert ON public.conversation_members FOR INSERT WITH CHECK (
  -- Allow if user is a team member of the conversation's team
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id AND public.is_team_member(c.team_id)
  )
);

-- Step 4: Fix messages policies (also reference conversation_members)
DROP POLICY IF EXISTS messages_select ON public.messages;
CREATE POLICY messages_select ON public.messages FOR SELECT USING (
  public.is_conversation_member(conversation_id)
);

DROP POLICY IF EXISTS messages_insert ON public.messages;
CREATE POLICY messages_insert ON public.messages FOR INSERT WITH CHECK (
  sender_id = auth.uid() AND public.is_conversation_member(conversation_id)
);
