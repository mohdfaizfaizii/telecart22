import { useEffect, useMemo, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useProductSubscription } from '@/hooks/use-product-subscription';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard, { type ProductCardProps } from '@/components/ProductCard';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, X } from 'lucide-react';

type SoftwareCard = ProductCardProps & {
  categoryId?: string;
  categoryLabel?: string;
  subcategoryId?: string;
  subcategoryLabel?: string;
  priceOnRequest?: boolean;
  showPricing?: boolean;
};

const Software = () => {
  const [searchParams] = useSearchParams();
  const categoryFilter = searchParams.get('category');
  const [products, setProducts] = useState<SoftwareCard[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryFilter || 'all');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('all');
  const [selectedPrice, setSelectedPrice] = useState<string>('any');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const [catsRes, subcatsRes, productsRes, featuresRes, integrationsRes, reviewsRes] = await Promise.all([
      supabase.from('categories').select('*').eq('is_visible', true).order('display_order'),
      supabase.from('subcategories').select('*').order('display_order'),
      supabase.from('products').select('*').eq('status', 'approved').eq('is_visible', true).order('display_order'),
      supabase.from('product_features').select('*'),
      supabase.from('product_integrations').select('*'),
      supabase.from('reviews').select('product_id, rating').eq('status', 'approved').eq('is_visible', true),
    ]);

    const categoryRows = catsRes.data ?? [];
    const subcategoryRows = subcatsRes.data ?? [];
    setCategories(categoryRows);
    setSubcategories(subcategoryRows);

    const ratingMap: Record<string, { sum: number; count: number }> = {};
    reviewsRes.data?.forEach((r) => {
      if (!ratingMap[r.product_id]) ratingMap[r.product_id] = { sum: 0, count: 0 };
      ratingMap[r.product_id].sum += r.rating;
      ratingMap[r.product_id].count += 1;
    });

    const featureMap: Record<string, string[]> = {};
    featuresRes.data?.forEach((f) => {
      if (!featureMap[f.product_id]) featureMap[f.product_id] = [];
      featureMap[f.product_id].push(f.feature_text);
    });

    const integrationMap: Record<string, string[]> = {};
    integrationsRes.data?.forEach((i) => {
      if (!integrationMap[i.product_id]) integrationMap[i.product_id] = [];
      integrationMap[i.product_id].push(i.integration_name);
    });

    const categoryMap: Record<string, string> = {};
    categoryRows.forEach((category) => {
      categoryMap[category.id] = category.name;
    });

    const subcategoryMap: Record<string, string> = {};
    subcategoryRows.forEach((subcategory) => {
      subcategoryMap[subcategory.id] = subcategory.name;
    });

    setProducts((productsRes.data ?? []).map((product) => ({
      id: product.id,
      companyName: product.company_name,
      subtitle: (product as any).subtitle,
      description: product.description,
      logoUrl: product.logo_url,
      pricingValue: (product as any).pricing_value,
      currency: (product as any).currency,
      pricingUnit: (product as any).pricing_unit,
      ctaText: (product as any).cta_text,
      ctaLink: (product as any).cta_link,
      discountPercent: product.discount_percent,
      freeTrialLink: product.free_trial_link,
      freeTrialText: (product as any).free_trial_text,
      requestDemoLink: product.request_demo_link,
      websiteUrl: (product as any).website_url,
      googleFormUrl: (product as any).google_form_url,
      googleFormStatus: (product as any).google_form_status,
      isSponsored: product.is_sponsored ?? false,
      categoryId: product.category_id ?? undefined,
      categoryLabel: product.category_id ? categoryMap[product.category_id] : undefined,
      subcategoryId: (product as any).subcategory_id ?? undefined,
      subcategoryLabel: (product as any).subcategory_id ? subcategoryMap[(product as any).subcategory_id] : undefined,
      rating: ratingMap[product.id] ? ratingMap[product.id].sum / ratingMap[product.id].count : 0,
      features: featureMap[product.id] ?? [],
      integrations: integrationMap[product.id] ?? [],
      priceOnRequest: (product as any).price_on_request ?? false,
      showPricing: (product as any).show_pricing ?? true,
      showFreeTrial: (product as any).show_free_trial ?? true,
    })));

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Subscribe to real-time product changes
  useProductSubscription(fetchData);

  useEffect(() => {
    setSelectedSubcategory('all');
  }, [selectedCategory]);

  const filtered = useMemo(() => {
    return products.filter((product) => {
      const normalizedSearch = search.trim().toLowerCase();
      const searchPool = [
        product.companyName,
        product.description,
        product.subtitle,
        product.categoryLabel,
        ...(product.features ?? []),
        ...(product.integrations ?? []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchSearch = !normalizedSearch || searchPool.includes(normalizedSearch);
      const matchCategory = selectedCategory === 'all' || product.categoryId === selectedCategory;
      const matchSubcategory = selectedSubcategory === 'all' || product.subcategoryId === selectedSubcategory;

      const pricingValue = typeof product.pricingValue === 'number' ? product.pricingValue : Number(product.pricingValue);
      const numericPrice = Number.isFinite(pricingValue) ? pricingValue : null;
      const matchPrice =
        selectedPrice === 'any' ||
        (selectedPrice === 'on-request' && !!product.priceOnRequest) ||
        (selectedPrice === 'under-1000' && numericPrice !== null && numericPrice < 1000) ||
        (selectedPrice === '1000-5000' && numericPrice !== null && numericPrice >= 1000 && numericPrice <= 5000) ||
        (selectedPrice === 'above-5000' && numericPrice !== null && numericPrice > 5000);

      return matchSearch && matchCategory && matchSubcategory && matchPrice;
    });
  }, [products, search, selectedCategory, selectedSubcategory, selectedPrice]);

  const clearFilters = () => {
    setSearch('');
    setSelectedCategory('all');
    setSelectedSubcategory('all');
    setSelectedPrice('any');
  };

  return (
    <div className="min-h-screen bg-[#E6F2FF]">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-6 text-3xl font-bold font-[Plus_Jakarta_Sans]">Browse Software</h1>

        <div className="rounded-2xl border border-border bg-[#E6F2FF] p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-2">
            <div className="relative min-w-0 w-96">
              <Search className="pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search software, features, or categories..."
                className="h-11 rounded-xl border-border pl-14 text-base"
              />
            </div>

            <div className="flex shrink-0 gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="h-11 w-full rounded-xl border-border text-xs uppercase">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedSubcategory} onValueChange={setSelectedSubcategory}>
                <SelectTrigger className="h-11 w-full rounded-xl border-border text-xs uppercase">
                  <SelectValue placeholder="Subcategory" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subcategories</SelectItem>
                  {subcategories
                    .filter((sub) => selectedCategory === 'all' || sub.category_id === selectedCategory)
                    .map((subcategory) => (
                      <SelectItem key={subcategory.id} value={subcategory.id}>{subcategory.name}</SelectItem>
                    ))}
                </SelectContent>
              </Select>

              <Select value={selectedPrice} onValueChange={setSelectedPrice}>
                <SelectTrigger className="h-11 w-32 rounded-xl border-border text-xs uppercase">
                  <SelectValue placeholder="Price" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Price </SelectItem>
                  <SelectItem value="under-1000">Under 1000</SelectItem>
                  <SelectItem value="1000-5000">1000 to 5000</SelectItem>
                  <SelectItem value="above-5000">Above 5000</SelectItem>
                  <SelectItem value="on-request">Price on Request</SelectItem>
                </SelectContent>
              </Select>

              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-primary"
              >
                <X className="h-4 w-4" />
                Clear
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8">
          {loading ? (
            <p className="py-10 text-center text-muted-foreground">Loading...</p>
          ) : filtered.length === 0 ? (
            <p className="py-10 text-center text-muted-foreground">No software found.</p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 bg-[#E6F2FF] p-5 rounded-2xl">
              {filtered.map((product) => <ProductCard key={product.id} {...product} />)}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Software;
