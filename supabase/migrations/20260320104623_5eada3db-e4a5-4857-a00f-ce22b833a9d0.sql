ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS price_on_request boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS show_pricing boolean DEFAULT true;