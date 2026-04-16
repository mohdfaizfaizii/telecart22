import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProductSubscription } from '@/hooks/use-product-subscription';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import CategorySection from '@/components/CategorySection';
import FAQSection from '@/components/FAQSection';
import Footer from '@/components/Footer';
import SectionAds from '@/components/SectionAds';
import type { ProductCardProps } from '@/components/ProductCard';

interface CategoryWithProducts {
  id: string;
  name: string;
  products: ProductCardProps[];
}

interface HomepageSection {
  id: string;
  section_type: string;
  reference_id: string | null;
  display_order: number;
  is_visible: boolean;
}

const Index = () => {
  const [categories, setCategories] = useState<CategoryWithProducts[]>([]);
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const [catsRes, productsRes, featuresRes, integrationsRes, reviewsRes, sectionsRes] = await Promise.all([
        supabase.from('categories').select('*').eq('is_visible', true).order('display_order'),
        supabase.from('products').select('*').eq('status', 'approved').eq('is_visible', true).order('display_order'),
        supabase.from('product_features').select('*').order('display_order'),
        supabase.from('product_integrations').select('*').order('display_order'),
        supabase.from('reviews').select('product_id, rating').eq('status', 'approved').eq('is_visible', true),
        supabase.from('homepage_sections' as any).select('*').eq('is_visible', true).order('display_order'),
      ]);

      const cats = catsRes.data ?? [];
      const products = productsRes.data ?? [];
      const features = featuresRes.data ?? [];
      const integrations = integrationsRes.data ?? [];
      const reviews = reviewsRes.data ?? [];

      const ratingMap: Record<string, { sum: number; count: number }> = {};
      reviews.forEach((r: any) => {
        if (!ratingMap[r.product_id]) ratingMap[r.product_id] = { sum: 0, count: 0 };
        ratingMap[r.product_id].sum += r.rating;
        ratingMap[r.product_id].count += 1;
      });

      const featureMap: Record<string, string[]> = {};
      features.forEach((f: any) => {
        if (!featureMap[f.product_id]) featureMap[f.product_id] = [];
        featureMap[f.product_id].push(f.feature_text);
      });

      const integrationMap: Record<string, string[]> = {};
      integrations.forEach((i: any) => {
        if (!integrationMap[i.product_id]) integrationMap[i.product_id] = [];
        integrationMap[i.product_id].push(i.integration_name);
      });

      const categorized: CategoryWithProducts[] = cats.map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        products: products.filter((p: any) => p.category_id === cat.id).map((p: any) => ({
          id: p.id,
          companyName: p.company_name,
          subtitle: p.subtitle,
          description: p.description,
          logoUrl: p.logo_url,
          pricingValue: p.pricing_value,
          currency: p.currency,
          pricingUnit: p.pricing_unit,
          ctaText: p.cta_text,
          ctaLink: p.cta_link,
          discountPercent: p.discount_percent,
          freeTrialLink: p.free_trial_link,
          freeTrialText: p.free_trial_text,
          requestDemoLink: p.request_demo_link,
          websiteUrl: p.website_url,
          googleFormUrl: p.google_form_url,
          googleFormStatus: p.google_form_status,
          isSponsored: p.is_sponsored ?? false,
          categoryLabel: cat.name,
          rating: ratingMap[p.id] ? ratingMap[p.id].sum / ratingMap[p.id].count : 0,
          features: featureMap[p.id] ?? [],
          integrations: integrationMap[p.id] ?? [],
          priceOnRequest: p.price_on_request ?? false,
          showPricing: p.show_pricing ?? true,
          showFreeTrial: p.show_free_trial ?? true,
        })),
      }));

      setCategories(categorized);
      setSections((sectionsRes.data as any[]) ?? []);
      setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Subscribe to real-time product changes
  useProductSubscription(fetchData);

  // Build the page layout based on homepage section ordering
  const renderSections = () => {
    const uniqueSections = sections.reduce((acc: HomepageSection[], section) => {
      const key = `${section.section_type}:${section.reference_id ?? 'null'}`;
      if (!acc.some((existing) => `${existing.section_type}:${existing.reference_id ?? 'null'}` === key)) {
        acc.push(section);
      }
      return acc;
    }, []);

    return uniqueSections.map((section) => {
      if (section.section_type === 'category') {
        const category = categories.find((c) => c.id === section.reference_id);
        if (!category || category.products.length === 0) return null;

        return (
          <CategorySection
            key={`${section.id}-category`}
            categoryId={category.id}
            categoryName={category.name}
            products={category.products}
            showInlineAds={false}
          />
        );
      }

      if (section.section_type === 'ad-3-grid' || section.section_type === 'ad-2-grid') {
        if (!section.reference_id) return null;

        return (
          <SectionAds
            key={`${section.id}-ads`}
            categoryId={section.reference_id}
            adType={section.section_type}
          />
        );
      }

      return null;
    });
  };

  return (
    <div
      className="min-h-screen"
      style={{ backgroundImage: 'var(--gradient-background)' }}
    >
      <Header />
      <main>
        <HeroSection />
        {loading ? (
          <div className="py-20 text-center text-muted-foreground">Loading software...</div>
        ) : categories.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            <p className="text-lg">No software listed yet. Check back soon!</p>
          </div>
        ) : (
          renderSections()
        )}
        <FAQSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
