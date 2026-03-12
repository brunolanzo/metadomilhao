-- Category budgets table
CREATE TABLE IF NOT EXISTS public.category_budgets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id uuid REFERENCES public.families(id) ON DELETE CASCADE NOT NULL,
  category_id uuid REFERENCES public.categories(id) ON DELETE CASCADE NOT NULL,
  monthly_limit decimal(12,2) NOT NULL CHECK (monthly_limit > 0),
  created_at timestamptz DEFAULT now(),
  UNIQUE(family_id, category_id)
);

-- Enable RLS
ALTER TABLE public.category_budgets ENABLE ROW LEVEL SECURITY;

-- Policies using helper functions
CREATE POLICY "Users can view budgets of their family"
  ON public.category_budgets FOR SELECT
  USING (family_id = public.get_user_family_id());

CREATE POLICY "Admins can insert budgets"
  ON public.category_budgets FOR INSERT
  WITH CHECK (
    family_id = public.get_user_family_id()
    AND public.is_family_admin()
  );

CREATE POLICY "Admins can update budgets"
  ON public.category_budgets FOR UPDATE
  USING (
    family_id = public.get_user_family_id()
    AND public.is_family_admin()
  );

CREATE POLICY "Admins can delete budgets"
  ON public.category_budgets FOR DELETE
  USING (
    family_id = public.get_user_family_id()
    AND public.is_family_admin()
  );
