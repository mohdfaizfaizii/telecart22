
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS subtitle text,
  ADD COLUMN IF NOT EXISTS sub_description text,
  ADD COLUMN IF NOT EXISTS best_for_min integer,
  ADD COLUMN IF NOT EXISTS best_for_max integer,
  ADD COLUMN IF NOT EXISTS best_for_unit text DEFAULT 'Employees',
  ADD COLUMN IF NOT EXISTS pricing_value numeric,
  ADD COLUMN IF NOT EXISTS currency text DEFAULT '₹',
  ADD COLUMN IF NOT EXISTS pricing_unit text DEFAULT '/user/mo',
  ADD COLUMN IF NOT EXISTS cta_text text DEFAULT 'Request Demo',
  ADD COLUMN IF NOT EXISTS cta_link text;
