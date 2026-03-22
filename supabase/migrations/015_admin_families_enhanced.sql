-- Enhanced admin function: get families with member details, transaction counts and last login

DROP FUNCTION IF EXISTS public.admin_get_families;

CREATE OR REPLACE FUNCTION public.admin_get_families(lim int default 50)
RETURNS TABLE (
  family_id uuid,
  family_name text,
  member_count bigint,
  total_transactions bigint,
  last_activity timestamptz,
  created_at timestamptz,
  members json
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
    SELECT
      f.id AS family_id,
      f.name AS family_name,
      COUNT(DISTINCT fm.id) AS member_count,
      COALESCE(ft.cnt, 0) AS total_transactions,
      ft.last_tx AS last_activity,
      f.created_at,
      (
        SELECT json_agg(json_build_object(
          'user_id', m.user_id,
          'name', p.name,
          'email', u.email,
          'transaction_count', COALESCE(tc.cnt, 0),
          'last_sign_in', u.last_sign_in_at
        ) ORDER BY p.name)
        FROM public.family_members m
        JOIN public.profiles p ON p.user_id = m.user_id
        JOIN auth.users u ON u.id = m.user_id
        LEFT JOIN (
          SELECT t.user_id AS uid, COUNT(*) AS cnt
          FROM public.transactions t
          WHERE t.family_id = f.id
          GROUP BY t.user_id
        ) tc ON tc.uid = m.user_id
        WHERE m.family_id = f.id
      ) AS members
    FROM public.families f
    LEFT JOIN public.family_members fm ON fm.family_id = f.id
    LEFT JOIN (
      SELECT t.family_id AS fid, COUNT(*) AS cnt, MAX(t.created_at) AS last_tx
      FROM public.transactions t
      GROUP BY t.family_id
    ) ft ON ft.fid = f.id
    GROUP BY f.id, f.name, f.created_at, ft.cnt, ft.last_tx
    ORDER BY f.created_at DESC
    LIMIT lim;
END;
$$;
