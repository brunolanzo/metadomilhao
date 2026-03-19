-- Admin helper: check if the calling user is the admin
create or replace function public.is_admin()
returns boolean
language sql
security definer set search_path = ''
stable
as $$
  select exists (
    select 1
    from auth.users
    where id = auth.uid()
      and email = 'admin.metadomilhao@gmail.com'
  );
$$;

-- Admin: get platform stats
create or replace function public.admin_get_stats()
returns json
language plpgsql
security definer set search_path = ''
as $$
declare
  result json;
begin
  if not public.is_admin() then
    raise exception 'Access denied';
  end if;

  select json_build_object(
    'total_users', (select count(*) from public.profiles),
    'total_families', (select count(*) from public.families),
    'total_transactions', (select count(*) from public.transactions),
    'new_users_today', (
      select count(*) from public.profiles
      where created_at >= (current_date at time zone 'UTC')
    ),
    'new_users_week', (
      select count(*) from public.profiles
      where created_at >= (current_date - interval '7 days')
    ),
    'new_users_month', (
      select count(*) from public.profiles
      where created_at >= (current_date - interval '30 days')
    )
  ) into result;

  return result;
end;
$$;

-- Admin: get recent users
create or replace function public.admin_get_recent_users(lim int default 20)
returns table (
  user_id uuid,
  name text,
  email text,
  created_at timestamptz
)
language plpgsql
security definer set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Access denied';
  end if;

  return query
    select p.user_id, p.name, u.email, p.created_at
    from public.profiles p
    join auth.users u on u.id = p.user_id
    order by p.created_at desc
    limit lim;
end;
$$;

-- Admin: get families with member count
create or replace function public.admin_get_families(lim int default 50)
returns table (
  family_id uuid,
  family_name text,
  member_count bigint,
  created_at timestamptz
)
language plpgsql
security definer set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Access denied';
  end if;

  return query
    select f.id, f.name, count(fm.id), f.created_at
    from public.families f
    left join public.family_members fm on fm.family_id = f.id
    group by f.id, f.name, f.created_at
    order by f.created_at desc
    limit lim;
end;
$$;
