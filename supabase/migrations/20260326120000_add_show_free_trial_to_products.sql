ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS show_free_trial boolean DEFAULT true;
