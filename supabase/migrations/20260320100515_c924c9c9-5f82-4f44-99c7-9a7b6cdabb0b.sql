
-- Add ad_type to section_ads (3-grid or 2-grid layout)
ALTER TABLE public.section_ads ADD COLUMN IF NOT EXISTS ad_type text NOT NULL DEFAULT '3-grid';

-- Create homepage_sections table for flexible section ordering
CREATE TABLE public.homepage_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_type text NOT NULL, -- 'hero', 'category', 'ad-3-grid', 'ad-2-grid'
  reference_id uuid, -- category_id or ad group reference
  display_order integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.homepage_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manages homepage sections" ON public.homepage_sections
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public reads homepage sections" ON public.homepage_sections
  FOR SELECT TO public
  USING (true);
