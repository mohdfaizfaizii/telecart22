
-- User activity tracking table
CREATE TABLE public.user_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  event_type text NOT NULL DEFAULT 'view', -- 'view', 'click'
  link_url text,
  link_text text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_user_activity_user ON public.user_activity(user_id);
CREATE INDEX idx_user_activity_product ON public.user_activity(product_id);
CREATE INDEX idx_user_activity_event ON public.user_activity(event_type);

-- Enable RLS
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

-- Authenticated users can insert their own activity
CREATE POLICY "Users insert own activity"
ON public.user_activity FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Admin can read all activity
CREATE POLICY "Admin reads all activity"
ON public.user_activity FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Brand can read activity for their products
CREATE POLICY "Brand reads own product activity"
ON public.user_activity FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.id = user_activity.product_id
    AND p.brand_user_id = auth.uid()
  )
);
