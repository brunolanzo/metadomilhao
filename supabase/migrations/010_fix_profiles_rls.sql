-- Fix: Allow family members to view each other's profiles.
-- The current policy only allows viewing own profile, which breaks
-- the family members list (PostgREST inner join excludes members
-- whose profiles can't be read).

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "Users can view family member profiles"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.family_members fm
      WHERE fm.user_id = profiles.user_id
        AND fm.family_id = public.get_user_family_id()
    )
  );
