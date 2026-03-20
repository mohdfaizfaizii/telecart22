-- Add product_id to pricing_plans table
ALTER TABLE public.pricing_plans ADD COLUMN product_id uuid REFERENCES public.products(id) ON DELETE CASCADE;

-- Update RLS policies for product-specific pricing plans
DROP POLICY IF EXISTS "Public reads pricing plans" ON public.pricing_plans;

CREATE POLICY "Public reads pricing plans"
ON public.pricing_plans
FOR SELECT
USING (true);

-- Update other policies to handle product_id
DROP POLICY IF EXISTS "Brand creates pricing plans" ON public.pricing_plans;
DROP POLICY IF EXISTS "Brand updates own pricing plans" ON public.pricing_plans;

CREATE POLICY "Brand creates pricing plans"
ON public.pricing_plans
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR
  (product_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM products 
    WHERE products.id = pricing_plans.product_id 
    AND products.brand_user_id = auth.uid()
  ))
);

CREATE POLICY "Brand updates own pricing plans"
ON public.pricing_plans
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  (product_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM products 
    WHERE products.id = pricing_plans.product_id 
    AND products.brand_user_id = auth.uid()
  ))
);