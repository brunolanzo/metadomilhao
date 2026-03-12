-- Profiles table
create table public.profiles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  name text not null,
  avatar_url text,
  created_at timestamptz default now() not null
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = user_id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = user_id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = user_id);

-- Families table
create table public.families (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  created_at timestamptz default now() not null
);

alter table public.families enable row level security;

-- Family members table
create table public.family_members (
  id uuid default gen_random_uuid() primary key,
  family_id uuid references public.families(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text check (role in ('admin', 'member')) default 'member' not null,
  created_at timestamptz default now() not null,
  unique(family_id, user_id)
);

alter table public.family_members enable row level security;

-- RLS: Users can only access their own family
create policy "Users can view own family"
  on public.families for select
  using (
    exists (
      select 1 from public.family_members
      where family_members.family_id = families.id
      and family_members.user_id = auth.uid()
    )
  );

create policy "Users can insert family"
  on public.families for insert
  with check (true);

create policy "Users can view own family memberships"
  on public.family_members for select
  using (auth.uid() = user_id);

create policy "Users can insert family members"
  on public.family_members for insert
  with check (auth.uid() = user_id);

-- Categories table
create table public.categories (
  id uuid default gen_random_uuid() primary key,
  family_id uuid references public.families(id) on delete cascade not null,
  name text not null,
  type text check (type in ('income', 'expense')) not null,
  icon text default 'circle' not null,
  color text default '#FFD700' not null,
  created_at timestamptz default now() not null
);

alter table public.categories enable row level security;

create policy "Users can view categories of own family"
  on public.categories for select
  using (
    exists (
      select 1 from public.family_members
      where family_members.family_id = categories.family_id
      and family_members.user_id = auth.uid()
    )
  );

create policy "Users can insert categories in own family"
  on public.categories for insert
  with check (
    exists (
      select 1 from public.family_members
      where family_members.family_id = categories.family_id
      and family_members.user_id = auth.uid()
    )
  );

create policy "Users can update categories of own family"
  on public.categories for update
  using (
    exists (
      select 1 from public.family_members
      where family_members.family_id = categories.family_id
      and family_members.user_id = auth.uid()
    )
  );

create policy "Users can delete categories of own family"
  on public.categories for delete
  using (
    exists (
      select 1 from public.family_members
      where family_members.family_id = categories.family_id
      and family_members.user_id = auth.uid()
    )
  );

-- Transactions table
create table public.transactions (
  id uuid default gen_random_uuid() primary key,
  family_id uuid references public.families(id) on delete cascade not null,
  category_id uuid references public.categories(id) on delete set null,
  user_id uuid references auth.users(id) on delete cascade not null,
  amount decimal(12,2) not null check (amount > 0),
  description text default '' not null,
  date date default current_date not null,
  type text check (type in ('income', 'expense')) not null,
  created_at timestamptz default now() not null
);

alter table public.transactions enable row level security;

create policy "Users can view transactions of own family"
  on public.transactions for select
  using (
    exists (
      select 1 from public.family_members
      where family_members.family_id = transactions.family_id
      and family_members.user_id = auth.uid()
    )
  );

create policy "Users can insert transactions in own family"
  on public.transactions for insert
  with check (
    exists (
      select 1 from public.family_members
      where family_members.family_id = transactions.family_id
      and family_members.user_id = auth.uid()
    )
  );

create policy "Users can update transactions of own family"
  on public.transactions for update
  using (
    exists (
      select 1 from public.family_members
      where family_members.family_id = transactions.family_id
      and family_members.user_id = auth.uid()
    )
  );

create policy "Users can delete transactions of own family"
  on public.transactions for delete
  using (
    exists (
      select 1 from public.family_members
      where family_members.family_id = transactions.family_id
      and family_members.user_id = auth.uid()
    )
  );

-- Function to create profile + family on user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  new_family_id uuid;
begin
  -- Create profile
  insert into public.profiles (user_id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)));

  -- Create family
  insert into public.families (name)
  values (coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)) || '''s Family')
  returning id into new_family_id;

  -- Add user as admin of family
  insert into public.family_members (family_id, user_id, role)
  values (new_family_id, new.id, 'admin');

  -- Create default categories
  insert into public.categories (family_id, name, type, icon, color) values
    (new_family_id, 'Salário', 'income', 'banknote', '#22C55E'),
    (new_family_id, 'Freelance', 'income', 'laptop', '#3B82F6'),
    (new_family_id, 'Investimentos', 'income', 'trending-up', '#8B5CF6'),
    (new_family_id, 'Outros', 'income', 'plus-circle', '#FFD700'),
    (new_family_id, 'Alimentação', 'expense', 'utensils', '#EF4444'),
    (new_family_id, 'Transporte', 'expense', 'car', '#F97316'),
    (new_family_id, 'Moradia', 'expense', 'home', '#EC4899'),
    (new_family_id, 'Saúde', 'expense', 'heart-pulse', '#14B8A6'),
    (new_family_id, 'Educação', 'expense', 'graduation-cap', '#6366F1'),
    (new_family_id, 'Lazer', 'expense', 'gamepad-2', '#F59E0B'),
    (new_family_id, 'Compras', 'expense', 'shopping-bag', '#D946EF'),
    (new_family_id, 'Contas', 'expense', 'file-text', '#64748B');

  return new;
end;
$$;

-- Trigger on auth.users insert
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
