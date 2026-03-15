-- Create a SECURITY DEFINER function to handle invite acceptance atomically.
-- This bypasses RLS issues since it runs with the function owner's privileges.

CREATE OR REPLACE FUNCTION public.accept_pending_invite()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_user_email text;
  v_invite_id uuid;
  v_invite_family_id uuid;
  v_family_name text;
  v_current_family_id uuid;
  v_membership_count int;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Get user email
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = v_user_id;

  IF v_user_email IS NULL THEN
    RETURN NULL;
  END IF;

  -- Find a pending invite for this email
  SELECT fi.id, fi.family_id, f.name
  INTO v_invite_id, v_invite_family_id, v_family_name
  FROM public.family_invites fi
  JOIN public.families f ON f.id = fi.family_id
  WHERE fi.email = v_user_email
    AND fi.status = 'pending'
  ORDER BY fi.created_at ASC
  LIMIT 1;

  -- No pending invite found
  IF v_invite_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Check if user is already a member of the invited family
  IF EXISTS (
    SELECT 1 FROM public.family_members
    WHERE user_id = v_user_id AND family_id = v_invite_family_id
  ) THEN
    -- Already a member, just mark invite as accepted
    UPDATE public.family_invites SET status = 'accepted' WHERE id = v_invite_id;
    RETURN v_family_name;
  END IF;

  -- Count current memberships
  SELECT COUNT(*) INTO v_membership_count
  FROM public.family_members
  WHERE user_id = v_user_id;

  -- If user only has the auto-created family, remove them from it
  IF v_membership_count = 1 THEN
    SELECT family_id INTO v_current_family_id
    FROM public.family_members
    WHERE user_id = v_user_id
    LIMIT 1;

    -- Remove from auto-created family
    DELETE FROM public.family_members
    WHERE user_id = v_user_id AND family_id = v_current_family_id;

    -- Also clean up the auto-created empty family
    IF NOT EXISTS (
      SELECT 1 FROM public.family_members WHERE family_id = v_current_family_id
    ) THEN
      DELETE FROM public.families WHERE id = v_current_family_id;
    END IF;
  END IF;

  -- Add user to the invited family
  INSERT INTO public.family_members (family_id, user_id, role)
  VALUES (v_invite_family_id, v_user_id, 'member');

  -- Mark invite as accepted
  UPDATE public.family_invites SET status = 'accepted' WHERE id = v_invite_id;

  RETURN v_family_name;
END;
$$;
