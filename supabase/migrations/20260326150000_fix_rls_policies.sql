-- Fix RLS policies for user_activity table
-- Brands need to be able to read activity for their products
DROP POLICY IF EXISTS "Admin reads all activity" ON public.user_activity;
DROP POLICY IF EXISTS "Brand reads own product activity" ON public.user_activity;

-- Admin can read all activity
CREATE POLICY "Admin reads all activity"
ON public.user_activity FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Brand can read activity for their own products
CREATE POLICY "Brand reads own product activity"
ON public.user_activity FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'brand') AND EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.id = user_activity.product_id
    AND p.brand_user_id = auth.uid()
  )
);

-- Fix RLS policies for leads table
-- Brands should only read leads for their own products
DROP POLICY IF EXISTS "Brand reads own product leads" ON public.leads;

CREATE POLICY "Brand reads own product leads"
ON public.leads FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'brand') AND EXISTS (
    SELECT 1 FROM public.products p WHERE p.id = leads.product_id AND p.brand_user_id = auth.uid()
  )
);

