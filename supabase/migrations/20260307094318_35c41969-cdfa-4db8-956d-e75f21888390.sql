
-- Leads table for quote/inquiry forms
CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  mobile text,
  purpose text,
  source_button text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Users can insert their own leads
CREATE POLICY "Users insert own leads" ON public.leads
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Admin reads all leads
CREATE POLICY "Admin reads all leads" ON public.leads
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Brand reads leads for own products
CREATE POLICY "Brand reads own product leads" ON public.leads
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.products p WHERE p.id = leads.product_id AND p.brand_user_id = auth.uid()
  ));

-- Add google_form_url to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS google_form_url text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS google_form_status text DEFAULT 'pending';

-- Allow brands to insert categories  
CREATE POLICY "Brand creates categories" ON public.categories
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'brand'));
