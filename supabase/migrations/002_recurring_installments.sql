-- Add recurring and installment fields to transactions
ALTER TABLE public.transactions ADD COLUMN is_recurring boolean DEFAULT false NOT NULL;
ALTER TABLE public.transactions ADD COLUMN is_provisional boolean DEFAULT false NOT NULL;
ALTER TABLE public.transactions ADD COLUMN recurring_id uuid REFERENCES public.transactions(id) ON DELETE SET NULL;
ALTER TABLE public.transactions ADD COLUMN installment_number integer;
ALTER TABLE public.transactions ADD COLUMN total_installments integer;
ALTER TABLE public.transactions ADD COLUMN parent_id uuid REFERENCES public.transactions(id) ON DELETE SET NULL;
