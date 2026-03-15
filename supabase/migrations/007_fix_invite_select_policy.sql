-- Fix: Allow invited users to see their own pending invites
-- The current SELECT policy only allows family members to see invites for their own family,
-- but invited users need to see invites addressed to their email (from another family).

-- Add policy: users can see invites sent to their email
CREATE POLICY "Users can view own invites"
  ON public.family_invites FOR SELECT
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Also allow invited users to delete their own auto-created family membership
-- when accepting an invite (they need to leave their auto-family)
DROP POLICY IF EXISTS "Users can leave own family" ON public.family_members;

CREATE POLICY "Users can leave own family"
  ON public.family_members FOR DELETE
  USING (
    user_id = auth.uid()
  );
