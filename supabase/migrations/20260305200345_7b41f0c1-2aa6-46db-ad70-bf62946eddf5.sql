
-- Pricing plans table
CREATE TABLE public.pricing_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price numeric(10,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT '₹',
  billing_period text NOT NULL DEFAULT '/mo',
  is_popular boolean DEFAULT false,
  is_enabled boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Pricing features table
CREATE TABLE public.pricing_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid REFERENCES public.pricing_plans(id) ON DELETE CASCADE NOT NULL,
  feature_text text NOT NULL,
  is_included boolean DEFAULT true,
  display_order integer DEFAULT 0
);

-- Hero banners table
CREATE TABLE public.hero_banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL,
  title text,
  subtitle text,
  link_url text,
  display_order integer DEFAULT 0,
  is_visible boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Section ads table
CREATE TABLE public.section_ads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES public.categories(id) ON DELETE CASCADE NOT NULL,
  image_url text NOT NULL,
  link_url text,
  alt_text text,
  display_order integer DEFAULT 0,
  is_visible boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hero_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.section_ads ENABLE ROW LEVEL SECURITY;

-- Pricing plans policies
CREATE POLICY "Public reads pricing plans" ON public.pricing_plans FOR SELECT USING (true);
CREATE POLICY "Admin manages pricing plans" ON public.pricing_plans FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Pricing features policies
CREATE POLICY "Public reads pricing features" ON public.pricing_features FOR SELECT USING (true);
CREATE POLICY "Admin manages pricing features" ON public.pricing_features FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Hero banners policies
CREATE POLICY "Public reads hero banners" ON public.hero_banners FOR SELECT USING (true);
CREATE POLICY "Admin manages hero banners" ON public.hero_banners FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Section ads policies
CREATE POLICY "Public reads section ads" ON public.section_ads FOR SELECT USING (true);
CREATE POLICY "Admin manages section ads" ON public.section_ads FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Seed default pricing plans
INSERT INTO public.pricing_plans (name, price, currency, billing_period, is_popular, display_order) VALUES
  ('Basic', 999, '₹', '/mo', false, 0),
  ('Standard', 2499, '₹', '/mo', false, 1),
  ('Pro', 4999, '₹', '/mo', true, 2),
  ('Enterprise', 9999, '₹', '/mo', false, 3);

-- Add a storage bucket for banners and ads
INSERT INTO storage.buckets (id, name, public) VALUES ('banners', 'banners', true) ON CONFLICT DO NOTHING;

-- Storage policies for banners bucket
CREATE POLICY "Public reads banners" ON storage.objects FOR SELECT USING (bucket_id = 'banners');
CREATE POLICY "Admin uploads banners" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'banners' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin deletes banners" ON storage.objects FOR DELETE USING (bucket_id = 'banners' AND public.has_role(auth.uid(), 'admin'));
