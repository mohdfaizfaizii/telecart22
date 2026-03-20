
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'brand', 'user');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email TEXT NOT NULL,
  full_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Categories
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  display_order INT DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Subcategories
CREATE TABLE public.subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Products
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_name TEXT NOT NULL,
  description TEXT NOT NULL,
  logo_url TEXT,
  old_price NUMERIC(10,2),
  new_price NUMERIC(10,2),
  discount_percent NUMERIC(5,2),
  free_trial_link TEXT,
  request_demo_link TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  subcategory_id UUID REFERENCES public.subcategories(id) ON DELETE SET NULL,
  display_order INT DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  is_sponsored BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Product features
CREATE TABLE public.product_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  feature_text TEXT NOT NULL,
  display_order INT DEFAULT 0
);

-- Product integrations
CREATE TABLE public.product_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  integration_name TEXT NOT NULL,
  display_order INT DEFAULT 0
);

-- Reviews
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Activity logs
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  
  -- Default role is 'user', can be overridden by metadata
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'user'));
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- RLS POLICIES

-- Profiles: users can read all profiles, update own
CREATE POLICY "Anyone can read profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "System inserts profiles" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- User roles: readable by authenticated, admin can manage
CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "System inserts roles" ON public.user_roles FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin manages roles" ON public.user_roles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin deletes roles" ON public.user_roles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Categories: public read, admin manage
CREATE POLICY "Public can read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admin creates categories" ON public.categories FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin updates categories" ON public.categories FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin deletes categories" ON public.categories FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Subcategories: public read, admin manage
CREATE POLICY "Public can read subcategories" ON public.subcategories FOR SELECT USING (true);
CREATE POLICY "Admin creates subcategories" ON public.subcategories FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin updates subcategories" ON public.subcategories FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin deletes subcategories" ON public.subcategories FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Products: public read approved, brand creates own, admin manages all
CREATE POLICY "Public can read approved products" ON public.products FOR SELECT USING (
  (status = 'approved' AND is_visible = true) 
  OR auth.uid() = brand_user_id 
  OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "Brand creates products" ON public.products FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = brand_user_id AND public.has_role(auth.uid(), 'brand')
);
CREATE POLICY "Brand updates own products" ON public.products FOR UPDATE TO authenticated USING (
  auth.uid() = brand_user_id OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "Admin deletes products" ON public.products FOR DELETE TO authenticated USING (
  public.has_role(auth.uid(), 'admin')
);

-- Product features: public read, brand/admin manage
CREATE POLICY "Public reads features" ON public.product_features FOR SELECT USING (true);
CREATE POLICY "Brand creates features" ON public.product_features FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.products WHERE id = product_id AND (brand_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin')))
);
CREATE POLICY "Brand updates features" ON public.product_features FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.products WHERE id = product_id AND (brand_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin')))
);
CREATE POLICY "Brand deletes features" ON public.product_features FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.products WHERE id = product_id AND (brand_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin')))
);

-- Product integrations: same as features
CREATE POLICY "Public reads integrations" ON public.product_integrations FOR SELECT USING (true);
CREATE POLICY "Brand creates integrations" ON public.product_integrations FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.products WHERE id = product_id AND (brand_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin')))
);
CREATE POLICY "Brand updates integrations" ON public.product_integrations FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.products WHERE id = product_id AND (brand_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin')))
);
CREATE POLICY "Brand deletes integrations" ON public.product_integrations FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.products WHERE id = product_id AND (brand_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin')))
);

-- Reviews: public read approved, user creates, admin manages
CREATE POLICY "Public reads approved reviews" ON public.reviews FOR SELECT USING (
  (status = 'approved' AND is_visible = true) OR user_id = auth.uid() OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "User creates reviews" ON public.reviews FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = user_id AND public.has_role(auth.uid(), 'user')
);
CREATE POLICY "User/Admin updates reviews" ON public.reviews FOR UPDATE TO authenticated USING (
  user_id = auth.uid() OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "Admin deletes reviews" ON public.reviews FOR DELETE TO authenticated USING (
  public.has_role(auth.uid(), 'admin')
);

-- Activity logs: admin only
CREATE POLICY "Admin reads logs" ON public.activity_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "System inserts logs" ON public.activity_logs FOR INSERT WITH CHECK (true);

-- Storage bucket for logos
INSERT INTO storage.buckets (id, name, public) VALUES ('logos', 'logos', true);

CREATE POLICY "Anyone can view logos" ON storage.objects FOR SELECT USING (bucket_id = 'logos');
CREATE POLICY "Authenticated users upload logos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'logos');
CREATE POLICY "Users manage own logos" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'logos');
CREATE POLICY "Users delete own logos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'logos');
