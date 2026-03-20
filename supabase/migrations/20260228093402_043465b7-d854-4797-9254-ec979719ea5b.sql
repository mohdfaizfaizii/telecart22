
-- Add new fields to products table for the updated card design
ALTER TABLE public.products 
  ADD COLUMN IF NOT EXISTS website_url TEXT,
  ADD COLUMN IF NOT EXISTS free_trial_text TEXT DEFAULT '14-day free trial',
  ADD COLUMN IF NOT EXISTS category_label TEXT;

-- Create product action links table for "What's next" panel
CREATE TABLE IF NOT EXISTS public.product_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  link_text TEXT NOT NULL,
  link_url TEXT NOT NULL,
  link_type TEXT DEFAULT 'action',
  display_order INT DEFAULT 0,
  is_highlighted BOOLEAN DEFAULT false
);

-- Create promotional banners table
CREATE TABLE IF NOT EXISTS public.product_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  banner_text TEXT NOT NULL,
  banner_subtext TEXT,
  banner_label TEXT,
  banner_url TEXT,
  bg_color TEXT DEFAULT '#7C3AED',
  display_order INT DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.product_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_banners ENABLE ROW LEVEL SECURITY;

-- RLS for product_links
CREATE POLICY "Anyone can view product links" ON public.product_links FOR SELECT USING (true);
CREATE POLICY "Brands can manage own product links" ON public.product_links FOR ALL USING (
  EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND p.brand_user_id = auth.uid())
);
CREATE POLICY "Admins can manage all product links" ON public.product_links FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- RLS for product_banners
CREATE POLICY "Anyone can view product banners" ON public.product_banners FOR SELECT USING (true);
CREATE POLICY "Brands can manage own product banners" ON public.product_banners FOR ALL USING (
  EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND p.brand_user_id = auth.uid())
);
CREATE POLICY "Admins can manage all product banners" ON public.product_banners FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);
