-- Add email column to profiles (needed to show member emails in family page)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

-- Backfill email from auth.users
UPDATE public.profiles SET email = u.email
FROM auth.users u WHERE profiles.user_id = u.id AND profiles.email IS NULL;

-- Update trigger to also save email on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  new_family_id uuid;
BEGIN
  -- Create profile (now includes email)
  INSERT INTO public.profiles (user_id, name, email)
  VALUES (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), new.email);

  -- Create family
  INSERT INTO public.families (name)
  VALUES (coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)) || '''s Family')
  RETURNING id INTO new_family_id;

  -- Add user as admin of family
  INSERT INTO public.family_members (family_id, user_id, role)
  VALUES (new_family_id, new.id, 'admin');

  -- Create default categories
  INSERT INTO public.categories (family_id, name, type, icon, color) VALUES
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

  RETURN new;
END;
$$;

-- Family invites table
CREATE TABLE public.family_invites (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  email text NOT NULL,
  invited_by uuid NOT NULL REFERENCES auth.users(id),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(family_id, email)
);

ALTER TABLE public.family_invites ENABLE ROW LEVEL SECURITY;

-- RLS: Family members can view invites for their family
CREATE POLICY "Family members can view invites"
  ON public.family_invites FOR SELECT
  USING (
    family_id IN (
      SELECT fm.family_id FROM public.family_members fm WHERE fm.user_id = auth.uid()
    )
  );

-- RLS: Family admins can create invites
CREATE POLICY "Family admins can create invites"
  ON public.family_invites FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.family_members
      WHERE family_members.family_id = family_invites.family_id
        AND family_members.user_id = auth.uid()
        AND family_members.role = 'admin'
    )
  );

-- RLS: Family admins can update invite status
CREATE POLICY "Family admins can update invites"
  ON public.family_invites FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.family_members
      WHERE family_members.family_id = family_invites.family_id
        AND family_members.user_id = auth.uid()
        AND family_members.role = 'admin'
    )
  );

-- RLS: Family admins can delete invites
CREATE POLICY "Family admins can delete invites"
  ON public.family_invites FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.family_members
      WHERE family_members.family_id = family_invites.family_id
        AND family_members.user_id = auth.uid()
        AND family_members.role = 'admin'
    )
  );

-- RLS: Users can accept their own invites
CREATE POLICY "Users can accept own invites"
  ON public.family_invites FOR UPDATE
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND status = 'pending'
  );

-- Allow admins to update family name
CREATE POLICY "Admins can update family"
  ON public.families FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.family_members
      WHERE family_members.family_id = families.id
        AND family_members.user_id = auth.uid()
        AND family_members.role = 'admin'
    )
  );

-- Allow admins to view all family members (not just own row)
CREATE POLICY "Family members can view all members of their family"
  ON public.family_members FOR SELECT
  USING (
    family_id IN (
      SELECT fm.family_id FROM public.family_members fm WHERE fm.user_id = auth.uid()
    )
  );

-- Allow admins to delete family members
CREATE POLICY "Admins can delete family members"
  ON public.family_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.family_members AS fm
      WHERE fm.family_id = family_members.family_id
        AND fm.user_id = auth.uid()
        AND fm.role = 'admin'
    )
    AND user_id != auth.uid()
  );

-- Allow adding members (for invite acceptance)
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
