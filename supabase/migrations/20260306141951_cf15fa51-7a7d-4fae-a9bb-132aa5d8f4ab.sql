ALTER TABLE public.pricing_plans ADD COLUMN IF NOT EXISTS status text DEFAULT 'approved';
ALTER TABLE public.pricing_plans ADD COLUMN IF NOT EXISTS brand_user_id uuid DEFAULT NULL;

-- Allow brands to create and manage their own pricing plans
CREATE POLICY "Brand creates pricing plans"
ON public.pricing_plans FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = brand_user_id OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Brand updates own pricing plans"
ON public.pricing_plans FOR UPDATE TO authenticated
USING (
  auth.uid() = brand_user_id OR has_role(auth.uid(), 'admin'::app_role)
);

-- Allow brands to manage features on their own plans
DROP POLICY IF EXISTS "Admin manages pricing features" ON public.pricing_features;
CREATE POLICY "Admin or brand manages pricing features"
ON public.pricing_features FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  EXISTS (SELECT 1 FROM public.pricing_plans pp WHERE pp.id = pricing_features.plan_id AND pp.brand_user_id = auth.uid())
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR
  EXISTS (SELECT 1 FROM public.pricing_plans pp WHERE pp.id = pricing_features.plan_id AND pp.brand_user_id = auth.uid())
);