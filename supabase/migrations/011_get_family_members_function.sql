-- Create a SECURITY DEFINER function to return family members with profiles.
-- This bypasses RLS issues with profile joins.

CREATE OR REPLACE FUNCTION public.get_family_members()
RETURNS TABLE (
  id uuid,
  family_id uuid,
  user_id uuid,
  role text,
  created_at timestamptz,
  profile_name text,
  profile_email text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_family_id uuid;
BEGIN
  -- Get the calling user's family
  SELECT fm.family_id INTO v_family_id
  FROM public.family_members fm
  WHERE fm.user_id = auth.uid()
  LIMIT 1;

  IF v_family_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    fm.id,
    fm.family_id,
    fm.user_id,
    fm.role,
    fm.created_at,
    p.name AS profile_name,
    p.email AS profile_email
  FROM public.family_members fm
  LEFT JOIN public.profiles p ON p.user_id = fm.user_id
  WHERE fm.family_id = v_family_id
  ORDER BY fm.created_at;
END;
$$;
