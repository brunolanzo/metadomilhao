-- =============================================
-- FIX: Remove self-referencing RLS policies that cause infinite recursion
-- =============================================

-- Step 1: Create a SECURITY DEFINER helper function to get user's family_id
-- This bypasses RLS, avoiding the circular reference
CREATE OR REPLACE FUNCTION public.get_user_family_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT family_id FROM public.family_members WHERE user_id = auth.uid() LIMIT 1;
$$;

-- Step 2: Drop the problematic self-referencing policy on family_members
DROP POLICY IF EXISTS "Family members can view all members of their family" ON public.family_members;

-- Step 3: Recreate it using the helper function (no recursion)
CREATE POLICY "Family members can view all members of their family"
  ON public.family_members FOR SELECT
  USING (family_id = public.get_user_family_id());

-- Step 4: Fix the delete policy on family_members (also had recursion)
DROP POLICY IF EXISTS "Admins can delete family members" ON public.family_members;

CREATE POLICY "Admins can delete family members"
  ON public.family_members FOR DELETE
  USING (
    family_id = public.get_user_family_id()
    AND EXISTS (
      SELECT 1 FROM public.family_members AS fm
      WHERE fm.family_id = family_members.family_id
        AND fm.user_id = auth.uid()
        AND fm.role = 'admin'
    )
    AND user_id != auth.uid()
  );

-- Actually the above still has recursion in the EXISTS. Let's use a simpler approach:
DROP POLICY IF EXISTS "Admins can delete family members" ON public.family_members;

CREATE OR REPLACE FUNCTION public.is_family_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.family_members
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$;

CREATE POLICY "Admins can delete family members"
  ON public.family_members FOR DELETE
  USING (
    family_id = public.get_user_family_id()
    AND public.is_family_admin()
    AND user_id != auth.uid()
  );

-- Step 5: Fix the insert policy on family_members (replace the one from 003)
DROP POLICY IF EXISTS "Anyone can insert family members via invite" ON public.family_members;

CREATE POLICY "Anyone can insert family members via invite"
  ON public.family_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.family_invites
      WHERE family_invites.family_id = family_members.family_id
        AND family_invites.email = (SELECT email FROM auth.users WHERE id = auth.uid())
        AND family_invites.status = 'pending'
    )
    OR auth.uid() = user_id
  );

-- Step 6: Fix family_invites policies (they referenced family_members causing chain recursion)
DROP POLICY IF EXISTS "Family members can view invites" ON public.family_invites;
DROP POLICY IF EXISTS "Family admins can create invites" ON public.family_invites;
DROP POLICY IF EXISTS "Family admins can update invites" ON public.family_invites;
DROP POLICY IF EXISTS "Family admins can delete invites" ON public.family_invites;
DROP POLICY IF EXISTS "Users can accept own invites" ON public.family_invites;

CREATE POLICY "Family members can view invites"
  ON public.family_invites FOR SELECT
  USING (family_id = public.get_user_family_id());

CREATE POLICY "Family admins can create invites"
  ON public.family_invites FOR INSERT
  WITH CHECK (
    family_id = public.get_user_family_id()
    AND public.is_family_admin()
  );

CREATE POLICY "Family admins can update invites"
  ON public.family_invites FOR UPDATE
  USING (
    family_id = public.get_user_family_id()
    AND public.is_family_admin()
  );

CREATE POLICY "Family admins can delete invites"
  ON public.family_invites FOR DELETE
  USING (
    family_id = public.get_user_family_id()
    AND public.is_family_admin()
  );

CREATE POLICY "Users can accept own invites"
  ON public.family_invites FOR UPDATE
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND status = 'pending'
  );

-- Step 7: Fix families UPDATE policy (also referenced family_members)
DROP POLICY IF EXISTS "Admins can update family" ON public.families;

CREATE POLICY "Admins can update family"
  ON public.families FOR UPDATE
  USING (
    id = public.get_user_family_id()
    AND public.is_family_admin()
  );
