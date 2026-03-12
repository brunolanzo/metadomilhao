-- Financial Goals table
CREATE TABLE IF NOT EXISTS public.goals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id uuid REFERENCES public.families(id) ON DELETE CASCADE NOT NULL,
  target_amount decimal(12,2) NOT NULL CHECK (target_amount > 0),
  month varchar(7) NOT NULL, -- format: YYYY-MM
  created_at timestamptz DEFAULT now(),
  UNIQUE(family_id, month)
);

-- Enable RLS
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- Policies using helper functions (avoid recursion)
CREATE POLICY "Users can view goals of their family"
  ON public.goals FOR SELECT
  USING (family_id = public.get_user_family_id());

CREATE POLICY "Admins can insert goals"
  ON public.goals FOR INSERT
  WITH CHECK (
    family_id = public.get_user_family_id()
    AND public.is_family_admin()
  );

CREATE POLICY "Admins can update goals"
  ON public.goals FOR UPDATE
  USING (
    family_id = public.get_user_family_id()
    AND public.is_family_admin()
  );

CREATE POLICY "Admins can delete goals"
  ON public.goals FOR DELETE
  USING (
    family_id = public.get_user_family_id()
    AND public.is_family_admin()
  );
