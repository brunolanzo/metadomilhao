-- Enhanced admin function: get users with last login and transaction count

CREATE OR REPLACE FUNCTION public.admin_get_recent_users(lim int default 50)
RETURNS TABLE (
  user_id uuid,
  name text,
  email text,
  created_at timestamptz,
  last_sign_in timestamptz,
  transaction_count bigint
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
      p.user_id,
      p.name,
      u.email,
      p.created_at,
      u.last_sign_in_at AS last_sign_in,
      COALESCE(tc.cnt, 0) AS transaction_count
    FROM public.profiles p
    JOIN auth.users u ON u.id = p.user_id
    LEFT JOIN (
      SELECT t.user_id AS uid, COUNT(*) AS cnt
      FROM public.transactions t
      GROUP BY t.user_id
    ) tc ON tc.uid = p.user_id
    ORDER BY p.created_at DESC
    LIMIT lim;
END;
$$;
