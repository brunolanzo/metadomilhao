-- Fix: The "Users can accept own invites" UPDATE policy had no WITH CHECK clause,
-- so it defaulted to the USING clause which requires status = 'pending'.
-- When updating status to 'accepted', the WITH CHECK fails because the new row
-- has status = 'accepted', not 'pending'. Fix by adding explicit WITH CHECK.

DROP POLICY IF EXISTS "Users can accept own invites" ON public.family_invites;

CREATE POLICY "Users can accept own invites"
  ON public.family_invites FOR UPDATE
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND status = 'pending'
  )
  WITH CHECK (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );
