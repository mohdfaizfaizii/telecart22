import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Check, X, Eye, EyeOff, Plus, Trash2, Users, Package, Star, Clock, Edit2, Save, GripVertical, BarChart3, Upload, Image, CreditCard, Layout, ArrowUpDown, Filter } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ProductCard from '@/components/ProductCard';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const CURRENCIES = [
  { value: '₹', label: '₹ Rupees' }, { value: '$', label: '$ Dollar' },
  { value: '€', label: '€ Euro' }, { value: '£', label: '£ Pound' },
];
const PRICING_UNITS = [
  { value: '/user/mo', label: '/user/mo' }, { value: '/mo', label: '/mo' },
  { value: '/year', label: '/year' }, { value: '/user/year', label: '/user/year' },
  { value: 'one-time', label: 'One-time' },
];

const ADMIN_SIDEBAR_ITEMS = [
  { label: 'Overview', value: 'overview', icon: Eye },
  { label: 'Products', value: 'products', icon: Package },
  { label: 'Reviews', value: 'reviews', icon: Star },
  { label: 'Categories', value: 'categories', icon: Layout },
  { label: 'Users & Brands', value: 'users', icon: Users },
  { label: 'Leads', value: 'leads', icon: BarChart3 },
  { label: 'Banners', value: 'banners', icon: Image },
  { label: 'Section Ads', value: 'sectionads', icon: Image },
  { label: 'Page Sections', value: 'sections', icon: ArrowUpDown },
  { label: 'Pricing', value: 'pricing', icon: CreditCard },
  { label: 'Analytics', value: 'analytics', icon: BarChart3 },
];

const SortableItem = ({ id, children }: { id: string; children: React.ReactNode }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2">
      <button {...attributes} {...listeners} className="cursor-grab p-1 text-muted-foreground hover:text-foreground">
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="flex-1">{children}</div>
    </div>
  );
};

const getHomepageSectionKey = (section: { section_type: string; reference_id: string | null }) =>
  `${section.section_type}:${section.reference_id ?? 'null'}`;

const getHeroBannerKey = (banner: {
  image_url: string | null;
  title: string | null;
  subtitle: string | null;
  link_url: string | null;
}) =>
  `${banner.image_url ?? ''}|${banner.title ?? ''}|${banner.subtitle ?? ''}|${banner.link_url ?? ''}`;

const getSectionAdKey = (ad: {
  category_id: string | null;
  image_url: string | null;
  link_url: string | null;
  alt_text: string | null;
  ad_type: string | null;
}) =>
  `${ad.category_id ?? ''}|${ad.ad_type ?? ''}|${ad.image_url ?? ''}|${ad.link_url ?? ''}|${ad.alt_text ?? ''}`;

const AdminDashboard = () => {
  const { role } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [products, setProducts] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [newSubcategory, setNewSubcategory] = useState('');
  const [subCatParent, setSubCatParent] = useState('');
  const [editSubcategoryId, setEditSubcategoryId] = useState<string | null>(null);
  const [editSubcategoryName, setEditSubcategoryName] = useState('');
  const [editCatId, setEditCatId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [stats, setStats] = useState({ users: 0, brands: 0, products: 0, pending: 0 });
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [detailCardId, setDetailCardId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [userActivityDetail, setUserActivityDetail] = useState<any[]>([]);
  const [heroBanners, setHeroBanners] = useState<any[]>([]);
  const [editingBanner, setEditingBanner] = useState<any | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerSubtitle, setBannerSubtitle] = useState('');
  const [bannerLinkUrl, setBannerLinkUrl] = useState('');
  const [sectionAds, setSectionAds] = useState<any[]>([]);
  const [editingSectionAd, setEditingSectionAd] = useState<any | null>(null);
  const [adFile, setAdFile] = useState<File | null>(null);
  const [adCategoryId, setAdCategoryId] = useState('');
  const [adLinkUrl, setAdLinkUrl] = useState('');
  const [adAltText, setAdAltText] = useState('');
  const [adType, setAdType] = useState<string>('3-grid');
  const [pricingPlans, setPricingPlans] = useState<any[]>([]);
  const [editingPlan, setEditingPlan] = useState<any | null>(null);
  const [newFeatureText, setNewFeatureText] = useState('');
  const [analyticsSort, setAnalyticsSort] = useState<string>('views-desc');
  const [analyticsCategoryFilter, setAnalyticsCategoryFilter] = useState<string>('all');
  const [currentDateTime, setCurrentDateTime] = useState<Date>(new Date());
  const [leads, setLeads] = useState<any[]>([]);
  const [homepageSections, setHomepageSections] = useState<any[]>([]);
  const [editingReview, setEditingReview] = useState<any | null>(null);
  const [isAddingBanner, setIsAddingBanner] = useState(false);
  const [isAddingSectionAd, setIsAddingSectionAd] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => { if (role === 'admin') fetchAll(); }, [role]);

  useEffect(() => {
    if (role !== 'admin') return;
    const channel = supabase
      .channel('admin-products-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        fetchAll();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [role]);

  const normalizeHomepageSections = async (sections: any[]) => {
    const orderedSections = [...sections].sort((a, b) => {
      const orderDiff = (a.display_order ?? 0) - (b.display_order ?? 0);
      return orderDiff !== 0 ? orderDiff : String(a.id).localeCompare(String(b.id));
    });

    const seen = new Set<string>();
    const uniqueSections: any[] = [];
    const duplicateIds: string[] = [];

    orderedSections.forEach((section) => {
      const key = getHomepageSectionKey(section);
      if (seen.has(key)) {
        duplicateIds.push(section.id);
        return;
      }

      seen.add(key);
      uniqueSections.push(section);
    });

    if (duplicateIds.length > 0) {
      await supabase.from('homepage_sections' as any).delete().in('id', duplicateIds);
    }

    const normalizedSections = uniqueSections.map((section, index) => ({
      ...section,
      display_order: index,
    }));

    const needsOrderSync =
      duplicateIds.length > 0 ||
      normalizedSections.some((section, index) => section.display_order !== uniqueSections[index]?.display_order);

    if (needsOrderSync) {
      await Promise.all(
        normalizedSections.map((section, index) =>
          supabase.from('homepage_sections' as any).update({ display_order: index }).eq('id', section.id)
        )
      );
    }

    return normalizedSections;
  };

  const normalizeHeroBanners = async (banners: any[]) => {
    const orderedBanners = [...banners].sort((a, b) => {
      const orderDiff = (a.display_order ?? 0) - (b.display_order ?? 0);
      return orderDiff !== 0 ? orderDiff : String(a.id).localeCompare(String(b.id));
    });

    const seen = new Set<string>();
    const uniqueBanners: any[] = [];
    const duplicateIds: string[] = [];

    orderedBanners.forEach((banner) => {
      const key = getHeroBannerKey(banner);
      if (seen.has(key)) {
        duplicateIds.push(banner.id);
        return;
      }

      seen.add(key);
      uniqueBanners.push(banner);
    });

    if (duplicateIds.length > 0) {
      await supabase.from('hero_banners' as any).delete().in('id', duplicateIds);
    }

    const normalizedBanners = uniqueBanners.map((banner, index) => ({
      ...banner,
      display_order: index,
    }));

    const needsOrderSync =
      duplicateIds.length > 0 ||
      normalizedBanners.some((banner, index) => (uniqueBanners[index]?.display_order ?? 0) !== index);

    if (needsOrderSync) {
      await Promise.all(
        normalizedBanners.map((banner, index) =>
          supabase.from('hero_banners' as any).update({ display_order: index }).eq('id', banner.id)
        )
      );
    }

    return normalizedBanners;
  };

  const normalizeSectionAds = async (ads: any[]) => {
    const groupedAds = new Map<string, any[]>();

    [...ads]
      .sort((a, b) => {
        const categoryDiff = String(a.category_id ?? '').localeCompare(String(b.category_id ?? ''));
        if (categoryDiff !== 0) return categoryDiff;

        const typeDiff = String(a.ad_type ?? '').localeCompare(String(b.ad_type ?? ''));
        if (typeDiff !== 0) return typeDiff;

        const orderDiff = (a.display_order ?? 0) - (b.display_order ?? 0);
        return orderDiff !== 0 ? orderDiff : String(a.id).localeCompare(String(b.id));
      })
      .forEach((ad) => {
        const groupKey = `${ad.category_id ?? ''}:${ad.ad_type ?? ''}`;
        const current = groupedAds.get(groupKey) ?? [];
        current.push(ad);
        groupedAds.set(groupKey, current);
      });

    const dedupedAds: any[] = [];
    const duplicateIds: string[] = [];

    groupedAds.forEach((groupAds) => {
      const seen = new Set<string>();

      groupAds.forEach((ad) => {
        const key = getSectionAdKey(ad);
        if (seen.has(key)) {
          duplicateIds.push(ad.id);
          return;
        }

        seen.add(key);
        dedupedAds.push(ad);
      });
    });

    if (duplicateIds.length > 0) {
      await supabase.from('section_ads' as any).delete().in('id', duplicateIds);
    }

    const normalizedAds = dedupedAds.map((ad) => ({ ...ad }));
    const updates: Promise<any>[] = [];

    Array.from(groupedAds.keys()).forEach((groupKey) => {
      const [categoryId, adType] = groupKey.split(':');
      const groupItems = normalizedAds.filter(
        (ad) => String(ad.category_id ?? '') === categoryId && String(ad.ad_type ?? '') === adType
      );

      groupItems.forEach((ad, index) => {
        if ((ad.display_order ?? 0) !== index) {
          ad.display_order = index;
          updates.push(
            supabase.from('section_ads' as any).update({ display_order: index }).eq('id', ad.id)
          );
        }
      });
    });

    if (updates.length > 0) {
      await Promise.all(updates);
    }

    return normalizedAds.sort((a, b) => {
      const categoryDiff = String(a.category_id ?? '').localeCompare(String(b.category_id ?? ''));
      if (categoryDiff !== 0) return categoryDiff;

      const typeDiff = String(a.ad_type ?? '').localeCompare(String(b.ad_type ?? ''));
      if (typeDiff !== 0) return typeDiff;

      return (a.display_order ?? 0) - (b.display_order ?? 0);
    });
  };

  const fetchAll = async () => {
    const [productsRes, reviewsRes, categoriesRes, profilesRes, rolesRes, subcatRes] = await Promise.all([
      supabase.from('products').select('*').order('display_order'),
      supabase.from('reviews').select('*').order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('display_order'),
      supabase.from('profiles').select('*'),
      supabase.from('user_roles').select('*'),
      supabase.from('subcategories').select('*').order('display_order'),
    ]);
    const rawProducts = productsRes.data ?? [];
    const enriched = await Promise.all(rawProducts.map(async (p) => {
      const [feats, ints, lnks] = await Promise.all([
        supabase.from('product_features').select('*').eq('product_id', p.id).order('display_order'),
        supabase.from('product_integrations').select('*').eq('product_id', p.id).order('display_order'),
        supabase.from('product_links').select('*').eq('product_id', p.id).order('display_order'),
      ]);
      return { ...p, features: feats.data ?? [], integrations: ints.data ?? [], links: lnks.data ?? [] };
    }));
    setProducts(enriched);
    setReviews(reviewsRes.data ?? []);
    setCategories(categoriesRes.data ?? []);
    setSubcategories(subcatRes.data ?? []);
    const profiles = profilesRes.data ?? [];
    const roles = rolesRes.data ?? [];
    setUsers(profiles.map(p => ({ ...p, role: roles.find(r => r.user_id === p.user_id)?.role ?? 'user' })));
    setStats({ users: roles.filter(r => r.role === 'user').length, brands: roles.filter(r => r.role === 'brand').length, products: rawProducts.length, pending: rawProducts.filter(p => p.status === 'pending').length });
    const { data: activityData } = await supabase.from('user_activity' as any).select('*').order('created_at', { ascending: false }).limit(500);
    setAnalytics(activityData ?? []);
    const [bannersRes, adsRes, plansRes, planFeaturesRes] = await Promise.all([
      supabase.from('hero_banners' as any).select('*').order('display_order'),
      supabase.from('section_ads' as any).select('*').order('display_order'),
      supabase.from('pricing_plans' as any).select('*').order('display_order'),
      supabase.from('pricing_features' as any).select('*').order('display_order'),
    ]);
    const normalizedBanners = await normalizeHeroBanners((bannersRes.data as any[]) ?? []);
    setHeroBanners(normalizedBanners);
    const normalizedSectionAds = await normalizeSectionAds((adsRes.data as any[]) ?? []);
    setSectionAds(normalizedSectionAds);
    const plans = (plansRes.data as any[]) ?? [];
    const planFeatures = (planFeaturesRes.data as any[]) ?? [];
    setPricingPlans(plans.map(p => ({ ...p, features: planFeatures.filter(f => f.plan_id === p.id) })));
    const { data: leadsData } = await supabase.from('leads' as any).select('*').order('created_at', { ascending: false }).limit(500);
    setLeads((leadsData as any[]) ?? []);
    const { data: sectionsData } = await supabase.from('homepage_sections' as any).select('*').order('display_order');
    const normalizedSections = await normalizeHomepageSections((sectionsData as any[]) ?? []);
    setHomepageSections(normalizedSections);
  };

  const fetchUserActivity = async (userId: string) => {
    setSelectedUser(userId);
    const { data } = await supabase.from('user_activity' as any).select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(200);
    setUserActivityDetail(data ?? []);
  };

  const approveProduct = async (id: string, showPricing: boolean = true) => { await supabase.from('products').update({ status: 'approved', show_pricing: showPricing } as any).eq('id', id); toast({ title: 'Product approved' }); fetchAll(); };
  const rejectProduct = async (id: string) => { await supabase.from('products').update({ status: 'rejected' }).eq('id', id); toast({ title: 'Product rejected' }); fetchAll(); };
  const toggleProductVisibility = async (id: string, visible: boolean) => { await supabase.from('products').update({ is_visible: !visible }).eq('id', id); fetchAll(); };
  const approveReview = async (id: string) => { await supabase.from('reviews').update({ status: 'approved' }).eq('id', id); toast({ title: 'Review approved' }); fetchAll(); };
  const rejectReview = async (id: string) => { await supabase.from('reviews').update({ status: 'rejected' }).eq('id', id); fetchAll(); };
  const toggleReviewVisibility = async (id: string, visible: boolean) => { await supabase.from('reviews').update({ is_visible: !visible }).eq('id', id); fetchAll(); };
  const saveReviewEdit = async () => {
    if (!editingReview) return;
    await supabase.from('reviews').update({
      rating: editingReview.rating,
      review_text: editingReview.review_text || null,
      status: editingReview.status,
      is_visible: editingReview.is_visible,
    }).eq('id', editingReview.id);
    toast({ title: 'Review updated' });
    setEditingReview(null);
    fetchAll();
  };
  const addCategory = async () => {
    if (!newCategory.trim()) return;
    await supabase.from('categories').insert({ name: newCategory.trim(), display_order: categories.length });
    // Auto-add homepage section for this category
    const { data: newCat } = await supabase.from('categories').select('id').eq('name', newCategory.trim()).single();
    if (newCat) {
      await supabase.from('homepage_sections' as any).insert({ section_type: 'category', reference_id: newCat.id, display_order: homepageSections.length });
    }
    setNewCategory(''); toast({ title: 'Category created' }); fetchAll();
  };
  const deleteCategory = async (id: string) => {
    await supabase.from('categories').delete().eq('id', id);
    // Also remove associated homepage sections
    await supabase.from('homepage_sections' as any).delete().eq('reference_id', id);
    toast({ title: 'Category deleted' }); fetchAll();
  };
  const renameCategory = async (id: string, name: string) => {
    if (!name.trim()) return;
    await supabase.from('categories').update({ name: name.trim() }).eq('id', id);
    setEditCatId(null); setEditCatName(''); toast({ title: 'Category renamed' }); fetchAll();
  };
  const addSubcategory = async () => {
    if (!newSubcategory.trim() || !subCatParent) return;
    await supabase.from('subcategories').insert({ name: newSubcategory.trim(), category_id: subCatParent, display_order: subcategories.filter(s => s.category_id === subCatParent).length });
    setNewSubcategory(''); toast({ title: 'Subcategory added' }); fetchAll();
  };
  const deleteSubcategory = async (id: string) => {
    await supabase.from('subcategories').delete().eq('id', id);
    toast({ title: 'Subcategory deleted' }); fetchAll();
  };
  const renameSubcategory = async (id: string, name: string) => {
    if (!name.trim()) return;
    await supabase.from('subcategories').update({ name: name.trim() }).eq('id', id);
    setEditSubcategoryId(null);
    setEditSubcategoryName('');
    toast({ title: 'Subcategory updated' });
    fetchAll();
  };
  const toggleUserActive = async (userId: string, isActive: boolean) => { await supabase.from('profiles').update({ is_active: !isActive }).eq('user_id', userId); toast({ title: isActive ? 'Account deactivated' : 'Account activated' }); fetchAll(); };
  const approvePricingPlan = async (id: string) => { await supabase.from('pricing_plans' as any).update({ status: 'approved', is_enabled: true }).eq('id', id); toast({ title: 'Pricing plan approved' }); fetchAll(); };
  const rejectPricingPlan = async (id: string) => { await supabase.from('pricing_plans' as any).update({ status: 'rejected', is_enabled: false }).eq('id', id); toast({ title: 'Pricing plan rejected' }); fetchAll(); };

  const addHeroBanner = async () => {
    if (!bannerFile || isAddingBanner) return;

    setIsAddingBanner(true);
    try {
      const path = `hero/${Date.now()}-${bannerFile.name}`;
      const { error: uploadErr } = await supabase.storage.from('banners').upload(path, bannerFile);
      if (uploadErr) {
        toast({ title: 'Upload failed', description: uploadErr.message, variant: 'destructive' });
        return;
      }

      const { data: urlData } = supabase.storage.from('banners').getPublicUrl(path);
      await supabase.from('hero_banners' as any).insert({
        image_url: urlData.publicUrl,
        title: bannerTitle || null,
        subtitle: bannerSubtitle || null,
        link_url: bannerLinkUrl || null,
        display_order: heroBanners.length,
      });
      setBannerFile(null);
      setBannerTitle('');
      setBannerSubtitle('');
      setBannerLinkUrl('');
      toast({ title: 'Banner added' });
      fetchAll();
    } finally {
      setIsAddingBanner(false);
    }
  };
  const deleteBanner = async (id: string) => { await supabase.from('hero_banners' as any).delete().eq('id', id); toast({ title: 'Banner removed' }); fetchAll(); };
  const saveBannerEdit = async () => {
    if (!editingBanner) return;
    await supabase.from('hero_banners' as any).update({
      title: editingBanner.title || null,
      subtitle: editingBanner.subtitle || null,
      link_url: editingBanner.link_url || null,
      is_visible: editingBanner.is_visible,
    }).eq('id', editingBanner.id);
    toast({ title: 'Banner updated' });
    setEditingBanner(null);
    fetchAll();
  };
  const handleBannerDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = heroBanners.findIndex(b => b.id === active.id);
    const newIndex = heroBanners.findIndex(b => b.id === over.id);
    const reordered = arrayMove(heroBanners, oldIndex, newIndex);
    setHeroBanners(reordered);
    await Promise.all(reordered.map((b, i) => supabase.from('hero_banners' as any).update({ display_order: i }).eq('id', b.id)));
    toast({ title: 'Banner order updated' });
  };

  const addSectionAd = async () => {
    if (!adFile || !adCategoryId || isAddingSectionAd) return;

    setIsAddingSectionAd(true);
    try {
      const path = `ads/${Date.now()}-${adFile.name}`;
      const { error: uploadErr } = await supabase.storage.from('banners').upload(path, adFile);
      if (uploadErr) {
        toast({ title: 'Upload failed', description: uploadErr.message, variant: 'destructive' });
        return;
      }

      const { data: urlData } = supabase.storage.from('banners').getPublicUrl(path);
      await supabase.from('section_ads' as any).insert({
        category_id: adCategoryId,
        image_url: urlData.publicUrl,
        link_url: adLinkUrl || null,
        alt_text: adAltText || null,
        ad_type: adType,
        display_order: sectionAds.filter((a) => a.category_id === adCategoryId && a.ad_type === adType).length,
      });
      
      const sectionType = adType === '2-grid' ? 'ad-2-grid' : 'ad-3-grid';
      const { data: existingSections } = await supabase
        .from('homepage_sections' as any)
        .select('id')
        .eq('section_type', sectionType)
        .eq('reference_id', adCategoryId)
        .limit(1);
      const existing = (existingSections as any[])?.[0];
      if (!existing) {
        await supabase.from('homepage_sections' as any).insert({ section_type: sectionType, reference_id: adCategoryId, display_order: homepageSections.length });
      }
      
      setAdFile(null);
      setAdLinkUrl('');
      setAdAltText('');
      setAdType('3-grid');
      toast({ title: 'Section ad added' });
      fetchAll();
    } finally {
      setIsAddingSectionAd(false);
    }
  };
  const deleteSectionAd = async (id: string) => {
    const ad = sectionAds.find(a => a.id === id);
    await supabase.from('section_ads' as any).delete().eq('id', id);
    // Check if any remaining ads of same type for same category
    if (ad) {
      const remaining = sectionAds.filter(a => a.id !== id && a.category_id === ad.category_id && a.ad_type === ad.ad_type);
      if (remaining.length === 0) {
        const sectionType = ad.ad_type === '2-grid' ? 'ad-2-grid' : 'ad-3-grid';
        await supabase.from('homepage_sections' as any).delete().eq('section_type', sectionType).eq('reference_id', ad.category_id);
      }
    }
    toast({ title: 'Ad removed' }); fetchAll();
  };
  const saveSectionAdEdit = async () => {
    if (!editingSectionAd) return;
    const existingAd = sectionAds.find((ad) => ad.id === editingSectionAd.id);
    const oldSectionType = existingAd?.ad_type === '2-grid' ? 'ad-2-grid' : 'ad-3-grid';
    const newSectionType = editingSectionAd.ad_type === '2-grid' ? 'ad-2-grid' : 'ad-3-grid';

    await supabase.from('section_ads' as any).update({
      link_url: editingSectionAd.link_url || null,
      alt_text: editingSectionAd.alt_text || null,
      ad_type: editingSectionAd.ad_type,
      is_visible: editingSectionAd.is_visible,
    }).eq('id', editingSectionAd.id);

    if (existingAd && oldSectionType !== newSectionType) {
      const remainingOldTypeAds = sectionAds.filter((ad) =>
        ad.id !== editingSectionAd.id &&
        ad.category_id === existingAd.category_id &&
        ad.ad_type === existingAd.ad_type
      );

      if (remainingOldTypeAds.length === 0) {
        await supabase.from('homepage_sections' as any).delete().eq('section_type', oldSectionType).eq('reference_id', existingAd.category_id);
      }

      const { data: existingNewSections } = await supabase
        .from('homepage_sections' as any)
        .select('id')
        .eq('section_type', newSectionType)
        .eq('reference_id', existingAd.category_id)
        .limit(1);
      const existingNewSection = (existingNewSections as any[])?.[0];

      if (!existingNewSection) {
        await supabase.from('homepage_sections' as any).insert({
          section_type: newSectionType,
          reference_id: existingAd.category_id,
          display_order: homepageSections.length,
        });
      }
    }

    toast({ title: 'Section ad updated' });
    setEditingSectionAd(null);
    fetchAll();
  };
  const handleSectionAdDragEnd = async (event: DragEndEvent, categoryId: string, adType: string) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const dragGroupAds = sectionAds.filter((a) => a.category_id === categoryId && a.ad_type === adType);
    const oldIndex = dragGroupAds.findIndex((a) => a.id === active.id);
    const newIndex = dragGroupAds.findIndex((a) => a.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(dragGroupAds, oldIndex, newIndex);
    const updatedAds = sectionAds.map((ad) => {
      if (ad.category_id !== categoryId || ad.ad_type !== adType) return ad;
      const nextIndex = reordered.findIndex((item) => item.id === ad.id);
      return nextIndex === -1 ? ad : { ...ad, display_order: nextIndex };
    });

    setSectionAds(updatedAds);
    await Promise.all(
      reordered.map((a, i) => supabase.from('section_ads' as any).update({ display_order: i }).eq('id', a.id))
    );
    toast({ title: 'Ad order updated' });
  };

  const savePricingPlan = async () => {
    if (!editingPlan) return;
    await supabase.from('pricing_plans' as any).update({ name: editingPlan.name, price: editingPlan.price, currency: editingPlan.currency, billing_period: editingPlan.billing_period, is_popular: editingPlan.is_popular, is_enabled: editingPlan.is_enabled, status: 'approved' }).eq('id', editingPlan.id);
    toast({ title: 'Plan updated' }); setEditingPlan(null); fetchAll();
  };
  const addPlanFeature = async (planId: string) => {
    if (!newFeatureText.trim()) return;
    await supabase.from('pricing_features' as any).insert({ plan_id: planId, feature_text: newFeatureText.trim(), display_order: pricingPlans.find(p => p.id === planId)?.features?.length ?? 0 });
    setNewFeatureText(''); toast({ title: 'Feature added' }); fetchAll();
  };
  const deletePlanFeature = async (featureId: string) => { await supabase.from('pricing_features' as any).delete().eq('id', featureId); toast({ title: 'Feature removed' }); fetchAll(); };

  const handleProductDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = products.findIndex(p => p.id === active.id);
    const newIndex = products.findIndex(p => p.id === over.id);
    const reordered = arrayMove(products, oldIndex, newIndex);
    setProducts(reordered);
    await Promise.all(reordered.map((p, i) => supabase.from('products').update({ display_order: i } as any).eq('id', p.id)));
    toast({ title: 'Product order updated' });
  };
  const handleCategoryDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = categories.findIndex(c => c.id === active.id);
    const newIndex = categories.findIndex(c => c.id === over.id);
    const reordered = arrayMove(categories, oldIndex, newIndex);
    setCategories(reordered);
    await Promise.all(reordered.map((c, i) => supabase.from('categories').update({ display_order: i }).eq('id', c.id)));
    toast({ title: 'Category order updated' });
  };

  const startEditProduct = (p: any) => {
    setEditingProduct({
      ...p, editCompanyName: p.company_name, editSubtitle: p.subtitle ?? '', editDescription: p.description,
      editCategoryId: p.category_id ?? '',
      editLogoFile: null,
      editLogoPreviewUrl: p.logo_url ?? null,
      editShowFreeTrial: p.show_free_trial ?? true,
      editPricingValue: p.pricing_value?.toString() ?? '',
      editCurrency: p.currency ?? '₹', editPricingUnit: p.pricing_unit ?? '/user/mo',
      editCtaText: p.cta_text ?? 'Request Demo', editCtaLink: p.cta_link ?? '',
      editFreeTrialLink: p.free_trial_link ?? '', editFreeTrialText: p.free_trial_text ?? 'Free Trial',
      editRequestDemoLink: p.request_demo_link ?? '', editWebsiteUrl: p.website_url ?? '',
      editFeatures: p.features?.map((f: any) => f.feature_text) ?? [],
      editIntegrations: p.integrations?.map((i: any) => i.integration_name) ?? [],
      editLinks: p.links?.map((l: any) => ({ text: l.link_text, url: l.link_url, isHighlighted: l.is_highlighted ?? false })) ?? [],
      newFeature: '', newIntegration: '',
    });
  };

  const saveEditProduct = async () => {
    if (!editingProduct) return;
    const ep = editingProduct;
    let logoUrl = ep.logo_url ?? null;
    if (ep.editLogoFile) {
      const ext = ep.editLogoFile.name.split('.').pop();
      const path = `${ep.id}/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from('logos').upload(path, ep.editLogoFile);
      if (uploadErr) {
        toast({ title: 'Logo upload failed', description: uploadErr.message, variant: 'destructive' });
        return;
      }
      const { data: urlData } = supabase.storage.from('logos').getPublicUrl(path);
      logoUrl = urlData.publicUrl;
    }
    await supabase.from('products').update({
      company_name: ep.editCompanyName, subtitle: ep.editSubtitle || null,
      logo_url: logoUrl,
      description: ep.editDescription.slice(0, 150),
      category_id: ep.editCategoryId || null,
      pricing_value: parseFloat(ep.editPricingValue) || null, currency: ep.editCurrency || '₹', pricing_unit: ep.editPricingUnit,
      cta_text: ep.editCtaText || 'Request Demo', cta_link: ep.editCtaLink || null,
      free_trial_link: ep.editFreeTrialLink || null, free_trial_text: ep.editFreeTrialText || null,
      show_free_trial: ep.editShowFreeTrial ?? true,
      request_demo_link: ep.editRequestDemoLink || null, website_url: ep.editWebsiteUrl || null,
    } as any).eq('id', ep.id);
    await Promise.all([
      supabase.from('product_features').delete().eq('product_id', ep.id),
      supabase.from('product_integrations').delete().eq('product_id', ep.id),
      supabase.from('product_links').delete().eq('product_id', ep.id),
    ]);
    const inserts = [];
    if (ep.editFeatures.length > 0) inserts.push(supabase.from('product_features').insert(ep.editFeatures.map((f: string, i: number) => ({ product_id: ep.id, feature_text: f, display_order: i }))));
    if (ep.editIntegrations.length > 0) inserts.push(supabase.from('product_integrations').insert(ep.editIntegrations.map((n: string, i: number) => ({ product_id: ep.id, integration_name: n, display_order: i }))));
    if (ep.editLinks.length > 0) inserts.push(supabase.from('product_links').insert(ep.editLinks.map((l: any, i: number) => ({ product_id: ep.id, link_text: l.text, link_url: l.url, is_highlighted: l.isHighlighted, display_order: i }))));
    await Promise.all(inserts);
    toast({ title: 'Product updated' }); setEditingProduct(null); fetchAll();
  };

  if (role !== 'admin') {
    return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-lg text-muted-foreground">Access denied. Admin only.</p></div>;
  }

  const ep = editingProduct;
  const getProductName = (productId: string) => products.find(p => p.id === productId)?.company_name ?? productId;
  const getUserName = (userId: string) => { const u = users.find(u => u.user_id === userId); return u ? (u.full_name || u.email) : userId; };

  const productViewCounts: Record<string, number> = {};
  const productClickCounts: Record<string, number> = {};
  const userViewCounts: Record<string, number> = {};
  const cardLinkClicks: Record<string, Record<string, number>> = {};
  analytics.forEach((a: any) => {
    if (a.event_type === 'view') { productViewCounts[a.product_id] = (productViewCounts[a.product_id] || 0) + 1; userViewCounts[a.user_id] = (userViewCounts[a.user_id] || 0) + 1; }
    else { productClickCounts[a.product_id] = (productClickCounts[a.product_id] || 0) + 1; const linkLabel = a.link_text || a.link_url || 'Unknown'; if (!cardLinkClicks[a.product_id]) cardLinkClicks[a.product_id] = {}; cardLinkClicks[a.product_id][linkLabel] = (cardLinkClicks[a.product_id][linkLabel] || 0) + 1; }
  });

  return (
    <DashboardLayout title="Admin Panel" items={ADMIN_SIDEBAR_ITEMS} activeTab={activeTab} onTabChange={setActiveTab}>
      {/* Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold font-[Plus_Jakarta_Sans]">Admin Overview</h1>
            <span className="text-sm text-muted-foreground">{currentDateTime.toLocaleString()}</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Total Users', value: stats.users, icon: Users, color: 'text-blue-500' },
              { label: 'Total Brands', value: stats.brands, icon: Package, color: 'text-purple-500' },
              { label: 'Total Products', value: stats.products, icon: Star, color: 'text-primary' },
              { label: 'Pending Approvals', value: stats.pending, icon: Clock, color: 'text-yellow-500' },
            ].map((s) => (
              <Card key={s.label}><CardContent className="flex items-center gap-4 p-6"><s.icon className={`h-8 w-8 ${s.color}`} /><div><p className="text-sm text-muted-foreground">{s.label}</p><p className="text-2xl font-bold">{s.value}</p></div></CardContent></Card>
            ))}
          </div>
          <Card>
            <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.slice(0, 10).map((a: any) => (
                  <div key={a.id} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
                    <div><span className="font-medium">{getUserName(a.user_id)}</span> <span className="text-muted-foreground">→</span> <span>{getProductName(a.product_id)}</span></div>
                    <div className="flex items-center gap-2">
                      <Badge variant={a.event_type === 'view' ? 'secondary' : 'default'}>{a.event_type}</Badge>
                      <span className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
                {analytics.length === 0 && <p className="text-sm text-muted-foreground">No activity yet</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Products */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          <h1 className="text-2xl font-bold font-[Plus_Jakarta_Sans]">Products</h1>
          {ep && (
            <Card className="border-primary">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Editing: {ep.company_name}</CardTitle>
                <div className="flex gap-2">
                  <Button size="sm" onClick={saveEditProduct}><Save className="mr-1 h-4 w-4" />Save</Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingProduct(null)}><X className="h-4 w-4" /></Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-center pb-4 border-b border-border">
                  <ProductCard id={ep.id} companyName={ep.editCompanyName} subtitle={ep.editSubtitle} description={ep.editDescription} logoUrl={ep.editLogoPreviewUrl || ep.logo_url} pricingValue={parseFloat(ep.editPricingValue) || null} currency={ep.editCurrency} pricingUnit={ep.editPricingUnit} ctaText={ep.editCtaText} ctaLink={ep.editCtaLink} freeTrialLink={ep.editFreeTrialLink} freeTrialText={ep.editFreeTrialText} requestDemoLink={ep.editRequestDemoLink} websiteUrl={ep.editWebsiteUrl} categoryLabel={categories.find(c => c.id === ep.editCategoryId)?.name} features={ep.editFeatures} integrations={ep.editIntegrations} links={ep.editLinks} showFreeTrial={ep.editShowFreeTrial ?? true} />
                </div>
                <div>
                  <Label>Logo</Label>
                  <div className="mt-2 flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted">
                      {ep.editLogoPreviewUrl || ep.logo_url ? (
                        <img src={ep.editLogoPreviewUrl || ep.logo_url} alt={ep.editCompanyName || 'Logo'} className="h-full w-full object-contain p-2" />
                      ) : (
                        <span className="text-lg font-semibold text-muted-foreground">{ep.editCompanyName?.charAt(0) || '?'}</span>
                      )}
                    </div>
                    <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border px-4 py-2 hover:bg-muted">
                      <Upload className="h-4 w-4" />
                      <span className="text-sm">{ep.editLogoFile?.name ?? 'Update logo'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0] ?? null;
                          setEditingProduct({
                            ...ep,
                            editLogoFile: file,
                            editLogoPreviewUrl: file ? URL.createObjectURL(file) : ep.logo_url ?? null,
                          });
                        }}
                      />
                    </label>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div><Label>Company Name</Label><Input value={ep.editCompanyName} onChange={(e) => setEditingProduct({ ...ep, editCompanyName: e.target.value })} /></div>
                  <div><Label>Subtitle</Label><Input value={ep.editSubtitle} onChange={(e) => setEditingProduct({ ...ep, editSubtitle: e.target.value })} /></div>
                </div>
                <div><Label>Category</Label><Select value={ep.editCategoryId} onValueChange={(v) => setEditingProduct({ ...ep, editCategoryId: v })}><SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger><SelectContent>{categories.filter(c => c.id).map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
                <div><Label>Description</Label><Textarea value={ep.editDescription} onChange={(e) => setEditingProduct({ ...ep, editDescription: e.target.value })} maxLength={150} rows={2} /></div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div><Label>Price</Label><Input type="number" value={ep.editPricingValue} onChange={(e) => setEditingProduct({ ...ep, editPricingValue: e.target.value })} /></div>
                  <div><Label>Currency</Label><Select value={ep.editCurrency} onValueChange={(v) => setEditingProduct({ ...ep, editCurrency: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CURRENCIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent></Select></div>
                  <div><Label>Unit</Label><Select value={ep.editPricingUnit} onValueChange={(v) => setEditingProduct({ ...ep, editPricingUnit: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PRICING_UNITS.map(u => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}</SelectContent></Select></div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div><Label>CTA Text</Label><Input value={ep.editCtaText} onChange={(e) => setEditingProduct({ ...ep, editCtaText: e.target.value })} /></div>
                  <div><Label>CTA Link</Label><Input value={ep.editCtaLink} onChange={(e) => setEditingProduct({ ...ep, editCtaLink: e.target.value })} /></div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div><Label>Free Trial Link</Label><Input value={ep.editFreeTrialLink} onChange={(e) => setEditingProduct({ ...ep, editFreeTrialLink: e.target.value })} /></div>
                  <div className="flex items-center gap-2 mt-6">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={ep.editShowFreeTrial ?? true} onChange={(e) => setEditingProduct({ ...ep, editShowFreeTrial: e.target.checked })} className="rounded" />
                      <span>Show Free Trial button</span>
                    </label>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div><Label>Request Demo Link</Label><Input value={ep.editRequestDemoLink} onChange={(e) => setEditingProduct({ ...ep, editRequestDemoLink: e.target.value })} /></div>
                  <div><Label>Website URL</Label><Input value={ep.editWebsiteUrl} onChange={(e) => setEditingProduct({ ...ep, editWebsiteUrl: e.target.value })} /></div>
                </div>
                <div><Label>Features</Label><div className="mt-2 flex gap-2"><Input value={ep.newFeature} onChange={(e) => setEditingProduct({ ...ep, newFeature: e.target.value })} placeholder="Add feature" /><Button type="button" variant="outline" onClick={() => { if (ep.newFeature?.trim()) { setEditingProduct({ ...ep, editFeatures: [...ep.editFeatures, ep.newFeature.trim()], newFeature: '' }); } }}>Add</Button></div><div className="mt-2 flex flex-wrap gap-2">{ep.editFeatures.map((f: string, i: number) => (<Badge key={i} variant="secondary" className="gap-1">{f}<button onClick={() => setEditingProduct({ ...ep, editFeatures: ep.editFeatures.filter((_: any, idx: number) => idx !== i) })}><Trash2 className="h-3 w-3" /></button></Badge>))}</div></div>
                <div><Label>Integrations</Label><div className="mt-2 flex gap-2"><Input value={ep.newIntegration || ''} onChange={(e) => setEditingProduct({ ...ep, newIntegration: e.target.value })} placeholder="Add integration" /><Button type="button" variant="outline" onClick={() => { if (ep.newIntegration?.trim()) { setEditingProduct({ ...ep, editIntegrations: [...ep.editIntegrations, ep.newIntegration.trim()], newIntegration: '' }); } }}>Add</Button></div><div className="mt-2 flex flex-wrap gap-2">{ep.editIntegrations.map((n: string, i: number) => (<Badge key={i} variant="secondary" className="gap-1">{n}<button onClick={() => setEditingProduct({ ...ep, editIntegrations: ep.editIntegrations.filter((_: any, idx: number) => idx !== i) })}><Trash2 className="h-3 w-3" /></button></Badge>))}</div></div>
              </CardContent>
            </Card>
          )}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleProductDragEnd}>
            <SortableContext items={products.map(p => p.id)} strategy={verticalListSortingStrategy}>
              {products.map((p) => (
                <SortableItem key={p.id} id={p.id}>
                   <Card><CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3">{p.logo_url ? <img src={p.logo_url} alt="" className="h-10 w-10 rounded-lg object-contain" /> : <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-sm font-bold">{p.company_name?.charAt(0)}</div>}<div><p className="font-semibold">{p.company_name}</p><p className="text-sm text-muted-foreground line-clamp-1">{p.description}</p>{p.price_on_request && <Badge variant="outline" className="text-xs mt-1">Price on Request</Badge>}</div></div><div className="flex items-center gap-2 flex-wrap"><Badge variant={p.status === 'approved' ? 'default' : p.status === 'rejected' ? 'destructive' : 'secondary'}>{p.status}</Badge>{p.status === 'pending' && (<><div className="flex items-center gap-1"><label className="flex items-center gap-1 text-xs"><input type="checkbox" defaultChecked={true} id={`show-price-${p.id}`} className="rounded" /><span>Show Price</span></label></div><Button size="sm" variant="outline" onClick={() => { const showPrice = (document.getElementById(`show-price-${p.id}`) as HTMLInputElement)?.checked ?? true; approveProduct(p.id, showPrice); }}><Check className="h-4 w-4" /></Button><Button size="sm" variant="outline" onClick={() => rejectProduct(p.id)}><X className="h-4 w-4" /></Button></>)}<Button size="sm" variant="outline" onClick={() => startEditProduct(p)}><Edit2 className="h-4 w-4" /></Button><Button size="sm" variant="ghost" onClick={() => toggleProductVisibility(p.id, p.is_visible)}>{p.is_visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}</Button></div></CardContent></Card>
                </SortableItem>
              ))}
            </SortableContext>
          </DndContext>
          {products.length === 0 && <p className="text-muted-foreground">No products yet.</p>}
        </div>
      )}

      {/* Reviews */}
      {activeTab === 'reviews' && (
        <div className="space-y-6">
          <h1 className="text-2xl font-bold font-[Plus_Jakarta_Sans]">Reviews</h1>
          {editingReview && (
            <Card className="border-primary">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Edit Review</CardTitle>
                <div className="flex gap-2">
                  <Button size="sm" onClick={saveReviewEdit}><Save className="mr-1 h-4 w-4" />Save</Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingReview(null)}><X className="h-4 w-4" /></Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <Label>Rating</Label>
                    <Select value={String(editingReview.rating)} onValueChange={(v) => setEditingReview({ ...editingReview, rating: Number(v) })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{[1, 2, 3, 4, 5].map((n) => <SelectItem key={n} value={String(n)}>{n} Star</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Select value={editingReview.status} onValueChange={(v) => setEditingReview({ ...editingReview, status: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={!!editingReview.is_visible} onChange={(e) => setEditingReview({ ...editingReview, is_visible: e.target.checked })} className="rounded" />
                      Visible
                    </label>
                  </div>
                </div>
                <div>
                  <Label>Review Text</Label>
                  <Textarea value={editingReview.review_text || ''} onChange={(e) => setEditingReview({ ...editingReview, review_text: e.target.value })} rows={4} />
                </div>
              </CardContent>
            </Card>
          )}
          <h3 className="text-lg font-semibold">Pending Reviews</h3>
          {reviews.filter(r => r.status === 'pending').length === 0 && <p className="text-sm text-muted-foreground">No pending reviews.</p>}
          {reviews.filter(r => r.status === 'pending').map((r) => (
            <Card key={r.id} className="border-yellow-500/50"><CardContent className="flex items-center justify-between p-4"><div><div className="flex items-center gap-2 mb-1">{Array.from({ length: 5 }).map((_, i) => (<Star key={i} className={`h-3 w-3 ${i < r.rating ? 'fill-warning text-warning' : 'text-muted'}`} />))}<span className="text-xs text-muted-foreground ml-2">{getProductName(r.product_id)}</span></div><p className="text-sm">{r.review_text || 'No text'}</p></div><div className="flex items-center gap-2"><Button size="sm" variant="outline" onClick={() => setEditingReview({ ...r })}><Edit2 className="h-4 w-4" /></Button><Button size="sm" variant="outline" onClick={() => approveReview(r.id)}><Check className="h-4 w-4 mr-1" />Approve</Button><Button size="sm" variant="outline" onClick={() => rejectReview(r.id)}><X className="h-4 w-4 mr-1" />Reject</Button></div></CardContent></Card>
          ))}
          <h3 className="text-lg font-semibold mt-6">All Reviews</h3>
          {reviews.filter(r => r.status !== 'pending').map((r) => (
            <Card key={r.id}><CardContent className="flex items-center justify-between p-4"><div><div className="flex items-center gap-2 mb-1">{Array.from({ length: 5 }).map((_, i) => (<Star key={i} className={`h-3 w-3 ${i < r.rating ? 'fill-warning text-warning' : 'text-muted'}`} />))}<span className="text-xs text-muted-foreground ml-2">{getProductName(r.product_id)}</span></div><p className="text-sm">{r.review_text || 'No text'}</p></div><div className="flex items-center gap-2"><Badge variant={r.status === 'approved' ? 'default' : 'destructive'}>{r.status}</Badge><Button size="sm" variant="outline" onClick={() => setEditingReview({ ...r })}><Edit2 className="h-4 w-4" /></Button><Button size="sm" variant="ghost" onClick={() => toggleReviewVisibility(r.id, r.is_visible)}>{r.is_visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}</Button></div></CardContent></Card>
          ))}
        </div>
      )}

      {/* Categories & Subcategories */}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          <h1 className="text-2xl font-bold font-[Plus_Jakarta_Sans]">Categories & Subcategories</h1>
          
          {/* Add Category */}
          <Card>
            <CardHeader><CardTitle className="text-base">Add Category</CardTitle></CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="New category name" />
                <Button onClick={addCategory}><Plus className="mr-2 h-4 w-4" /> Add</Button>
              </div>
            </CardContent>
          </Card>

          {/* Categories List */}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleCategoryDragEnd}>
            <SortableContext items={categories.map(c => c.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {categories.map((c) => (
                  <SortableItem key={c.id} id={c.id}>
                    <Card>
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          {editCatId === c.id ? (
                            <div className="flex items-center gap-2 flex-1 mr-2">
                              <Input value={editCatName} onChange={(e) => setEditCatName(e.target.value)} className="h-8" />
                              <Button size="sm" onClick={() => renameCategory(c.id, editCatName)}><Save className="h-3 w-3" /></Button>
                              <Button size="sm" variant="ghost" onClick={() => setEditCatId(null)}><X className="h-3 w-3" /></Button>
                            </div>
                          ) : (
                            <span className="font-semibold">{c.name}</span>
                          )}
                          <div className="flex items-center gap-1">
                            <Button size="sm" variant="ghost" onClick={() => { setEditCatId(c.id); setEditCatName(c.name); }}><Edit2 className="h-4 w-4" /></Button>
                            <Button size="sm" variant="ghost" onClick={() => deleteCategory(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </div>
                        </div>
                        {/* Subcategories */}
                        <div className="ml-4 space-y-2">
                          {subcategories.filter(s => s.category_id === c.id).map(sub => (
                            <div key={sub.id} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm">
                              {editSubcategoryId === sub.id ? (
                                <div className="flex items-center gap-2 flex-1 mr-2">
                                  <Input value={editSubcategoryName} onChange={(e) => setEditSubcategoryName(e.target.value)} className="h-8 text-sm" />
                                  <Button size="sm" onClick={() => renameSubcategory(sub.id, editSubcategoryName)}><Save className="h-3 w-3" /></Button>
                                  <Button size="sm" variant="ghost" onClick={() => { setEditSubcategoryId(null); setEditSubcategoryName(''); }}><X className="h-3 w-3" /></Button>
                                </div>
                              ) : (
                                <span>{sub.name}</span>
                              )}
                              <div className="flex items-center gap-1">
                                <Button size="sm" variant="ghost" onClick={() => { setEditSubcategoryId(sub.id); setEditSubcategoryName(sub.name); }}><Edit2 className="h-3 w-3" /></Button>
                                <Button size="sm" variant="ghost" onClick={() => deleteSubcategory(sub.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                              </div>
                            </div>
                          ))}
                          <div className="flex gap-2">
                            <Input
                              value={subCatParent === c.id ? newSubcategory : ''}
                              onChange={(e) => { setSubCatParent(c.id); setNewSubcategory(e.target.value); }}
                              onFocus={() => setSubCatParent(c.id)}
                              placeholder="Add subcategory"
                              className="h-8 text-sm"
                            />
                            <Button size="sm" variant="outline" onClick={() => { setSubCatParent(c.id); addSubcategory(); }}>
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </SortableItem>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}

      {/* Users */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <h1 className="text-2xl font-bold font-[Plus_Jakarta_Sans]">Users & Brands</h1>
          {users.map((u) => (
            <Card key={u.user_id}><CardContent className="flex items-center justify-between p-4"><div><p className="font-semibold">{u.full_name || u.email}</p><p className="text-sm text-muted-foreground">{u.email}</p></div><div className="flex items-center gap-2"><Badge>{u.role}</Badge><Button size="sm" variant="outline" onClick={() => fetchUserActivity(u.user_id)}><BarChart3 className="mr-1 h-4 w-4" />Activity</Button><Button size="sm" variant={u.is_active ? 'outline' : 'default'} onClick={() => toggleUserActive(u.user_id, u.is_active)}>{u.is_active ? 'Deactivate' : 'Activate'}</Button></div></CardContent></Card>
          ))}
          {selectedUser && (
            <Card className="border-primary"><CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-lg">Activity: {getUserName(selectedUser)}</CardTitle><Button size="sm" variant="outline" onClick={() => setSelectedUser(null)}><X className="h-4 w-4" /></Button></CardHeader><CardContent>{userActivityDetail.length === 0 ? <p className="text-muted-foreground text-sm">No activity.</p> : <div className="max-h-80 overflow-y-auto space-y-2">{userActivityDetail.map((a: any) => (<div key={a.id} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm"><div><span className="font-medium">{getProductName(a.product_id)}</span>{a.link_text && <span className="ml-2 text-muted-foreground">→ {a.link_text}</span>}</div><div className="flex items-center gap-2"><Badge variant={a.event_type === 'view' ? 'secondary' : 'default'}>{a.event_type}</Badge><span className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString()}</span></div></div>))}</div>}</CardContent></Card>
          )}
        </div>
      )}

      {/* Analytics */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <h1 className="text-2xl font-bold font-[Plus_Jakarta_Sans]">Analytics</h1>
          <Card>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 items-center">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Sort by</p>
                <Select value={analyticsSort} onValueChange={setAnalyticsSort}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="views-desc">Highest Views</SelectItem>
                    <SelectItem value="views-asc">Lowest Views</SelectItem>
                    <SelectItem value="clicks-desc">Highest Clicks</SelectItem>
                    <SelectItem value="clicks-asc">Lowest Clicks</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Category</p>
                <Select value={analyticsCategoryFilter} onValueChange={setAnalyticsCategoryFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((cat) => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Products tracked</p>
                <p className="text-lg font-semibold">{products.length}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total activities</p>
                <p className="text-lg font-semibold">{analytics.length}</p>
              </div>
            </CardContent>
          </Card>

          {detailCardId ? (
            (() => {
              const selectedProduct = products.find((p) => p.id === detailCardId);
              const productViews = analytics.filter((a) => a.product_id === detailCardId && a.event_type === 'view');
              const productClicks = analytics.filter((a) => a.product_id === detailCardId && a.event_type === 'click');
              const productActivity = analytics.filter((a) => a.product_id === detailCardId).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 50);
              const linkBreakdown = cardLinkClicks[detailCardId] || {};
              return (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Button onClick={() => setDetailCardId(null)} variant="outline"><ArrowUpDown className="mr-2 h-4 w-4" /> Back</Button>
                    <h2 className="text-xl font-semibold">{selectedProduct?.company_name ?? 'Unknown Product'} - Detailed Activity</h2>
                  </div>

                  <Card>
                    <CardContent className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="text-sm text-muted-foreground">User Views</p>
                        <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                          {productViews.length ? productViews.map((a) => (
                            <div key={a.id} className="flex items-center justify-between border-b border-border py-1 text-xs">
                              <span>{getUserName(a.user_id)}</span>
                              <span>{new Date(a.created_at).toLocaleString()}</span>
                            </div>
                          )) : <p className="text-muted-foreground">No views yet</p>}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Link Click Breakdown</p>
                        <div className="mt-2 space-y-1">
                          {Object.entries(linkBreakdown).length ? Object.entries(linkBreakdown).map(([linkText, count]) => (
                            <div key={linkText} className="flex items-center justify-between border-b border-border py-1 text-xs"><span>{linkText}</span><Badge>{count}</Badge></div>
                          )) : <p className="text-muted-foreground">No clicks yet</p>}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader><CardTitle>User Clicks</CardTitle></CardHeader>
                    <CardContent>
                      {productClicks.length ? productClicks.map((a) => (
                        <div key={a.id} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm">
                          <div className="flex flex-col">
                            <span className="font-medium">{getUserName(a.user_id)}</span>
                            <span className="text-muted-foreground text-xs">{a.link_text || a.link_url || 'Unknown link'}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString()}</span>
                        </div>
                      )) : <p className="text-muted-foreground">No clicks recorded</p>}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader><CardTitle>Raw Activity (latest 50)</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                      {productActivity.length ? productActivity.map((a) => (
                        <div key={a.id} className="grid grid-cols-1 gap-2 rounded-lg border border-border p-2 text-xs sm:grid-cols-6">
                          <span className="font-medium">{getUserName(a.user_id)}</span>
                          <span>{getProductName(a.product_id)}</span>
                          <span>{a.link_text || '—'}</span>
                          <Badge variant={a.event_type === 'view' ? 'secondary' : 'default'}>{a.event_type}</Badge>
                          <span className="col-span-2 text-right text-muted-foreground">{new Date(a.created_at).toLocaleString()}</span>
                        </div>
                      )) : <p className="text-muted-foreground">No activity found</p>}
                    </CardContent>
                  </Card>
                </div>
              );
            })()
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {products
                .filter((p) => analyticsCategoryFilter === 'all' || p.category_id === analyticsCategoryFilter)
                .map((p) => ({ ...p, totalViews: productViewCounts[p.id] || 0, totalClicks: productClickCounts[p.id] || 0, linkBreakdown: cardLinkClicks[p.id] || {} }))
                .sort((a, b) => {
                  if (analyticsSort === 'views-desc') return b.totalViews - a.totalViews;
                  if (analyticsSort === 'views-asc') return a.totalViews - b.totalViews;
                  if (analyticsSort === 'clicks-desc') return b.totalClicks - a.totalClicks;
                  if (analyticsSort === 'clicks-asc') return a.totalClicks - b.totalClicks;
                  return 0;
                })
                .map((p) => (
                  <Card key={p.id} className="cursor-pointer hover:shadow-lg" onClick={() => setDetailCardId(p.id)}>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{p.company_name}</p>
                          <p className="text-sm text-muted-foreground">{categories.find((c) => c.id === p.category_id)?.name || 'Uncategorized'}</p>
                        </div>
                        <Badge>{p.status || 'N/A'}</Badge>
                      </div>
                      <div className="mt-3 grid gap-2 text-sm">
                        <div className="flex justify-between"><span>Views</span><strong>{p.totalViews}</strong></div>
                        <div className="flex justify-between"><span>Clicks</span><strong>{p.totalClicks}</strong></div>
                      </div>
                      <div className="mt-3 text-xs text-muted-foreground">
                        Link break down: {Object.entries(p.linkBreakdown).map(([label,count]) => `${label}: ${count}`).join(' | ') || 'No link interactions'}
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}

          <Card>
            <CardHeader><CardTitle>Most Active Users</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {Object.entries(userViewCounts).sort(([,a], [,b]) => b - a).slice(0, 10).map(([userId, count]) => (
                <div key={userId} className="flex items-center justify-between rounded-lg border border-border p-2 text-sm">
                  <div>
                    <p className="font-medium">{getUserName(userId)}</p>
                    <p className="text-xs text-muted-foreground">{userId.slice(0, 8)}...</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge>{count} views</Badge>
                    <Button size="sm" variant="outline" onClick={() => fetchUserActivity(userId)}><Eye className="h-4 w-4" /></Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Recent Activity (latest 50)</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {analytics.slice().sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 50).map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-lg border border-border p-2 text-sm">
                  <div><span className="font-medium">{getUserName(a.user_id)}</span> → {getProductName(a.product_id)}</div>
                  <div className="flex items-center gap-2">
                    <Badge variant={a.event_type === 'view' ? 'secondary' : 'default'}>{a.event_type}</Badge>
                    <span className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

        </div>
      )}

      {/* Leads */}
      {activeTab === 'leads' && (
        <div className="space-y-6">
          <h1 className="text-2xl font-bold font-[Plus_Jakarta_Sans]">Leads</h1>
          {products.filter(p => p.google_form_url && p.google_form_status === 'pending').length > 0 && (
            <Card className="border-warning/50"><CardHeader><CardTitle className="text-base text-warning">Pending Google Form Approvals</CardTitle></CardHeader><CardContent className="space-y-3">{products.filter(p => p.google_form_url && p.google_form_status === 'pending').map(p => (<div key={p.id} className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3"><div><p className="font-semibold">{p.company_name}</p><p className="text-sm text-muted-foreground truncate max-w-xs">{p.google_form_url}</p></div><div className="flex items-center gap-2"><Button size="sm" variant="outline" onClick={async () => { await supabase.from('products').update({ google_form_status: 'approved' } as any).eq('id', p.id); toast({ title: 'Google Form approved' }); fetchAll(); }}><Check className="h-4 w-4 mr-1" />Approve</Button><Button size="sm" variant="outline" onClick={async () => { await supabase.from('products').update({ google_form_status: 'rejected' } as any).eq('id', p.id); toast({ title: 'Google Form rejected' }); fetchAll(); }}><X className="h-4 w-4 mr-1" />Reject</Button></div></div>))}</CardContent></Card>
          )}
          <h3 className="text-lg font-semibold">All Lead Inquiries</h3>
          {leads.length === 0 ? <p className="text-muted-foreground">No leads yet.</p> : (
            <div className="space-y-3">{leads.map((lead: any) => (<Card key={lead.id}><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="font-semibold">{lead.name}</p><p className="text-sm text-muted-foreground">{lead.email} {lead.mobile && `• ${lead.mobile}`}</p>{lead.purpose && <p className="text-sm mt-1">{lead.purpose}</p>}</div><div className="text-right"><Badge variant="secondary">{lead.source_button}</Badge><p className="text-xs text-muted-foreground mt-1">{getProductName(lead.product_id)}</p><p className="text-xs text-muted-foreground">{new Date(lead.created_at).toLocaleDateString()}</p></div></div></CardContent></Card>))}</div>
          )}
        </div>
      )}

      {/* Banners */}
      {activeTab === 'banners' && (
        <div className="space-y-6">
          <h1 className="text-2xl font-bold font-[Plus_Jakarta_Sans]">Hero Banners</h1>
          <Card><CardHeader><CardTitle className="text-base">Add Hero Banner (max 3)</CardTitle></CardHeader><CardContent className="space-y-3"><div className="grid gap-3 sm:grid-cols-2"><div><Label>Banner Image</Label><label className="mt-1 flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border px-4 py-2 hover:bg-muted"><Upload className="h-4 w-4" /><span className="text-sm">{bannerFile?.name ?? 'Choose file'}</span><input type="file" accept="image/*" className="hidden" onChange={(e) => setBannerFile(e.target.files?.[0] ?? null)} /></label></div><div><Label>Title (optional)</Label><Input value={bannerTitle} onChange={(e) => setBannerTitle(e.target.value)} placeholder="Banner headline" /></div></div><div className="grid gap-3 sm:grid-cols-2"><div><Label>Subtitle (optional)</Label><Input value={bannerSubtitle} onChange={(e) => setBannerSubtitle(e.target.value)} /></div><div><Label>Link URL (optional)</Label><Input value={bannerLinkUrl} onChange={(e) => setBannerLinkUrl(e.target.value)} placeholder="https://" /></div></div><Button onClick={addHeroBanner} disabled={!bannerFile || heroBanners.length >= 3 || isAddingBanner}><Plus className="mr-1 h-4 w-4" /> {isAddingBanner ? 'Adding...' : 'Add Banner'}</Button></CardContent></Card>
          {editingBanner && (
            <Card className="border-primary">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Edit Hero Banner</CardTitle>
                <div className="flex gap-2">
                  <Button size="sm" onClick={saveBannerEdit}><Save className="mr-1 h-4 w-4" />Save</Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingBanner(null)}><X className="h-4 w-4" /></Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div><Label>Title</Label><Input value={editingBanner.title || ''} onChange={(e) => setEditingBanner({ ...editingBanner, title: e.target.value })} /></div>
                  <div><Label>Subtitle</Label><Input value={editingBanner.subtitle || ''} onChange={(e) => setEditingBanner({ ...editingBanner, subtitle: e.target.value })} /></div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div><Label>Link URL</Label><Input value={editingBanner.link_url || ''} onChange={(e) => setEditingBanner({ ...editingBanner, link_url: e.target.value })} placeholder="https://" /></div>
                  <div className="flex items-end"><label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={!!editingBanner.is_visible} onChange={(e) => setEditingBanner({ ...editingBanner, is_visible: e.target.checked })} className="rounded" />Visible</label></div>
                </div>
              </CardContent>
            </Card>
          )}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleBannerDragEnd}>
            <SortableContext items={heroBanners.map(b => b.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">{heroBanners.map((b) => (<SortableItem key={b.id} id={b.id}><Card><CardContent className="flex items-center gap-4 p-4"><img src={b.image_url} alt={b.title || 'Banner'} className="h-16 w-28 rounded-lg object-cover" /><div className="flex-1"><p className="font-medium">{b.title || 'No title'}</p><p className="text-sm text-muted-foreground">{b.subtitle || ''}</p>{b.link_url && <p className="text-xs text-muted-foreground truncate">{b.link_url}</p>}</div><div className="flex items-center gap-2"><Badge variant={b.is_visible ? 'default' : 'secondary'}>{b.is_visible ? 'Visible' : 'Hidden'}</Badge><Button size="sm" variant="outline" onClick={() => setEditingBanner({ ...b })}><Edit2 className="h-4 w-4" /></Button><Button size="sm" variant="ghost" onClick={() => deleteBanner(b.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></div></CardContent></Card></SortableItem>))}</div>
            </SortableContext>
          </DndContext>
        </div>
      )}

      {/* Section Ads */}
      {activeTab === 'sectionads' && (
        <div className="space-y-6">
          <h1 className="text-2xl font-bold font-[Plus_Jakarta_Sans]">Section Ads</h1>
          <Card>
            <CardHeader><CardTitle className="text-base">Add Section Ad</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-3">
                <div><Label>Category</Label><Select value={adCategoryId} onValueChange={setAdCategoryId}><SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger><SelectContent>{categories.filter(c => c.id).map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
                <div><Label>Ad Layout</Label><Select value={adType} onValueChange={setAdType}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="3-grid">3 Banner Grid</SelectItem><SelectItem value="2-grid">2 Banner Grid</SelectItem></SelectContent></Select></div>
                <div><Label>Ad Image</Label><label className="mt-1 flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border px-4 py-2 hover:bg-muted"><Upload className="h-4 w-4" /><span className="text-sm">{adFile?.name ?? 'Choose file'}</span><input type="file" accept="image/*" className="hidden" onChange={(e) => setAdFile(e.target.files?.[0] ?? null)} /></label></div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div><Label>Link URL</Label><Input value={adLinkUrl} onChange={(e) => setAdLinkUrl(e.target.value)} placeholder="https://" /></div>
                <div><Label>Alt Text</Label><Input value={adAltText} onChange={(e) => setAdAltText(e.target.value)} /></div>
              </div>
              <Button onClick={addSectionAd} disabled={!adFile || !adCategoryId || isAddingSectionAd}><Plus className="mr-1 h-4 w-4" /> {isAddingSectionAd ? 'Adding...' : 'Add Ad'}</Button>
            </CardContent>
          </Card>
          {editingSectionAd && (
            <Card className="border-primary">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Edit Section Ad</CardTitle>
                <div className="flex gap-2">
                  <Button size="sm" onClick={saveSectionAdEdit}><Save className="mr-1 h-4 w-4" />Save</Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingSectionAd(null)}><X className="h-4 w-4" /></Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div><Label>Link URL</Label><Input value={editingSectionAd.link_url || ''} onChange={(e) => setEditingSectionAd({ ...editingSectionAd, link_url: e.target.value })} placeholder="https://" /></div>
                  <div><Label>Alt Text</Label><Input value={editingSectionAd.alt_text || ''} onChange={(e) => setEditingSectionAd({ ...editingSectionAd, alt_text: e.target.value })} /></div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div><Label>Ad Layout</Label><Select value={editingSectionAd.ad_type} onValueChange={(v) => setEditingSectionAd({ ...editingSectionAd, ad_type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="3-grid">3 Banner Grid</SelectItem><SelectItem value="2-grid">2 Banner Grid</SelectItem></SelectContent></Select></div>
                  <div className="flex items-end"><label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={!!editingSectionAd.is_visible} onChange={(e) => setEditingSectionAd({ ...editingSectionAd, is_visible: e.target.checked })} className="rounded" />Visible</label></div>
                </div>
              </CardContent>
            </Card>
          )}
          {categories.map(cat => {
            const threeGridAds = sectionAds
              .filter((a) => a.category_id === cat.id && a.ad_type === '3-grid')
              .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
            const twoGridAds = sectionAds
              .filter((a) => a.category_id === cat.id && a.ad_type === '2-grid')
              .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));

            if (threeGridAds.length === 0 && twoGridAds.length === 0) return null;

            const renderAdGroup = (title: string, ads: any[], type: string) => {
              if (ads.length === 0) return null;

              return (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">{title}</p>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={(e) => handleSectionAdDragEnd(e, cat.id, type)}
                  >
                    <SortableContext items={ads.map((a) => a.id)} strategy={verticalListSortingStrategy}>
                      <div className="space-y-2">
                        {ads.map((ad) => (
                          <SortableItem key={ad.id} id={ad.id}>
                            <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
                              <img src={ad.image_url} alt={ad.alt_text || 'Ad'} className="w-32 h-20 object-cover rounded-lg" />
                              <div className="flex-1">
                                <p className="text-sm font-medium">{ad.alt_text || 'No description'}</p>
                                {ad.link_url && <p className="text-xs text-muted-foreground truncate">{ad.link_url}</p>}
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{ad.ad_type || '3-grid'}</Badge>
                                <Badge variant={ad.is_visible ? 'default' : 'secondary'}>{ad.is_visible ? 'Visible' : 'Hidden'}</Badge>
                                <Button size="sm" variant="outline" onClick={() => setEditingSectionAd({ ...ad })}><Edit2 className="h-4 w-4" /></Button>
                                <Button size="sm" variant="ghost" onClick={() => deleteSectionAd(ad.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                              </div>
                            </div>
                          </SortableItem>
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                </div>
              );
            };

            return (
              <Card key={cat.id}>
                <CardHeader><CardTitle className="text-base">{cat.name}</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {renderAdGroup('3 Banner Grid', threeGridAds, '3-grid')}
                  {renderAdGroup('2 Banner Grid', twoGridAds, '2-grid')}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Page Sections - Flexible Section Management */}
      {activeTab === 'sections' && (
        <div className="space-y-6">
          <h1 className="text-2xl font-bold font-[Plus_Jakarta_Sans]">Page Section Manager</h1>
          <p className="text-sm text-muted-foreground">Drag and drop to rearrange homepage sections. Hero section always stays at top.</p>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={async (event: DragEndEvent) => {
            const { active, over } = event;
            if (!over || active.id === over.id) return;
            const oldIndex = homepageSections.findIndex(s => s.id === active.id);
            const newIndex = homepageSections.findIndex(s => s.id === over.id);
            const reordered = arrayMove(homepageSections, oldIndex, newIndex);
            setHomepageSections(reordered);
            await Promise.all(reordered.map((s, i) => supabase.from('homepage_sections' as any).update({ display_order: i }).eq('id', s.id)));
            toast({ title: 'Section order updated' });
          }}>
            <SortableContext items={homepageSections.map(s => s.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {homepageSections.map((section) => {
                  const cat = categories.find(c => c.id === section.reference_id);
                  const label = section.section_type === 'category'
                    ? `📦 ${cat?.name || 'Unknown'} — Product Cards`
                    : section.section_type === 'ad-3-grid'
                    ? `🖼️ ${cat?.name || 'Unknown'} — 3 Banner Ads`
                    : `🖼️ ${cat?.name || 'Unknown'} — 2 Banner Ads`;
                  return (
                    <SortableItem key={section.id} id={section.id}>
                      <Card>
                        <CardContent className="flex items-center justify-between p-4">
                          <div>
                            <p className="font-medium text-sm">{label}</p>
                            <p className="text-xs text-muted-foreground">Order: {section.display_order}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={section.is_visible ? 'default' : 'secondary'}>{section.is_visible ? 'Visible' : 'Hidden'}</Badge>
                            <Button size="sm" variant="ghost" onClick={async () => {
                              await supabase.from('homepage_sections' as any).update({ is_visible: !section.is_visible }).eq('id', section.id);
                              fetchAll();
                            }}>{section.is_visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}</Button>
                            <Button size="sm" variant="ghost" onClick={async () => {
                              await supabase.from('homepage_sections' as any).delete().eq('id', section.id);
                              toast({ title: 'Section removed' }); fetchAll();
                            }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </div>
                        </CardContent>
                      </Card>
                    </SortableItem>
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>
          {homepageSections.length === 0 && <p className="text-sm text-muted-foreground">No sections configured. Add sections above — or leave empty to use default category order.</p>}
        </div>
      )}

      {/* Pricing */}
      {activeTab === 'pricing' && (
        <div className="space-y-6">
          <h1 className="text-2xl font-bold font-[Plus_Jakarta_Sans]">Pricing Plans</h1>
          {pricingPlans.filter(p => p.status === 'pending').length > 0 && (
            <Card className="border-yellow-500"><CardHeader><CardTitle className="text-base text-yellow-600">Pending Pricing Approvals</CardTitle></CardHeader><CardContent className="space-y-3">{pricingPlans.filter(p => p.status === 'pending').map(plan => (<div key={plan.id} className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3"><div><p className="font-semibold">{plan.name} — {plan.currency}{plan.price}{plan.billing_period}</p><p className="text-sm text-muted-foreground">{plan.features?.length ?? 0} features</p></div><div className="flex items-center gap-2"><Button size="sm" variant="outline" onClick={() => approvePricingPlan(plan.id)}><Check className="h-4 w-4 mr-1" />Approve</Button><Button size="sm" variant="outline" onClick={() => rejectPricingPlan(plan.id)}><X className="h-4 w-4 mr-1" />Reject</Button></div></div>))}</CardContent></Card>
          )}
          {pricingPlans.map(plan => (
            <Card key={plan.id} className={editingPlan?.id === plan.id ? 'border-primary' : ''}><CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-base">{plan.name} — {plan.currency}{plan.price}{plan.billing_period}</CardTitle><div className="flex items-center gap-2"><Badge variant={plan.status === 'approved' ? 'default' : plan.status === 'rejected' ? 'destructive' : 'secondary'}>{plan.status ?? 'approved'}</Badge><Badge variant={plan.is_enabled ? 'default' : 'secondary'}>{plan.is_enabled ? 'Enabled' : 'Disabled'}</Badge>{plan.is_popular && <Badge variant="outline">Popular</Badge>}<Button size="sm" variant="outline" onClick={() => setEditingPlan(editingPlan?.id === plan.id ? null : { ...plan })}><Edit2 className="h-4 w-4" /></Button></div></CardHeader><CardContent className="space-y-3">{editingPlan?.id === plan.id && (<div className="space-y-3 border-b border-border pb-4 mb-3"><div className="grid gap-3 sm:grid-cols-4"><div><Label>Name</Label><Input value={editingPlan.name} onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })} /></div><div><Label>Price</Label><Input type="number" value={editingPlan.price} onChange={(e) => setEditingPlan({ ...editingPlan, price: parseFloat(e.target.value) || 0 })} /></div><div><Label>Currency</Label><Input value={editingPlan.currency} onChange={(e) => setEditingPlan({ ...editingPlan, currency: e.target.value })} /></div><div><Label>Period</Label><Input value={editingPlan.billing_period} onChange={(e) => setEditingPlan({ ...editingPlan, billing_period: e.target.value })} /></div></div><div className="flex items-center gap-4"><label className="flex items-center gap-1.5 text-sm cursor-pointer"><input type="checkbox" checked={editingPlan.is_popular} onChange={(e) => setEditingPlan({ ...editingPlan, is_popular: e.target.checked })} className="rounded" />Popular</label><label className="flex items-center gap-1.5 text-sm cursor-pointer"><input type="checkbox" checked={editingPlan.is_enabled} onChange={(e) => setEditingPlan({ ...editingPlan, is_enabled: e.target.checked })} className="rounded" />Enabled</label><Button size="sm" onClick={savePricingPlan}><Save className="mr-1 h-4 w-4" />Save</Button></div></div>)}<div className="space-y-1">{plan.features?.map((f: any) => (<div key={f.id} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm"><span>{f.feature_text}</span><button onClick={() => deletePlanFeature(f.id)}><Trash2 className="h-3 w-3 text-destructive" /></button></div>))}</div><div className="flex gap-2"><Input value={newFeatureText} onChange={(e) => setNewFeatureText(e.target.value)} placeholder="Add feature" /><Button variant="outline" onClick={() => addPlanFeature(plan.id)}><Plus className="mr-1 h-4 w-4" />Add</Button></div></CardContent></Card>
          ))}
        </div>
      )}

      {/* Analytics */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <h1 className="text-2xl font-bold font-[Plus_Jakarta_Sans]">Analytics</h1>
          
          {/* Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card><CardContent className="p-4"><p className="text-xs font-medium text-muted-foreground">Total Views</p><p className="text-2xl font-bold">{Object.values(productViewCounts).reduce((a, b) => a + b, 0)}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs font-medium text-muted-foreground">Total Clicks</p><p className="text-2xl font-bold">{Object.values(productClickCounts).reduce((a, b) => a + b, 0)}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs font-medium text-muted-foreground">Unique Users</p><p className="text-2xl font-bold">{Object.keys(userViewCounts).length}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs font-medium text-muted-foreground">Products Tracked</p><p className="text-2xl font-bold">{Object.keys(productViewCounts).length}</p></CardContent></Card>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Select value={analyticsSort} onValueChange={setAnalyticsSort}><SelectTrigger className="w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="views-desc">Highest Views</SelectItem><SelectItem value="views-asc">Lowest Views</SelectItem><SelectItem value="clicks-desc">Highest Clicks</SelectItem><SelectItem value="clicks-asc">Lowest Clicks</SelectItem></SelectContent></Select>
            <Select value={analyticsCategoryFilter} onValueChange={setAnalyticsCategoryFilter}><SelectTrigger className="w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Categories</SelectItem>{categories.filter(c => c.id).map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select>
          </div>
          {(() => {
            let filteredProducts = products;
            if (analyticsCategoryFilter !== 'all') filteredProducts = products.filter(p => p.category_id === analyticsCategoryFilter);
            const sortedProducts = [...filteredProducts].sort((a, b) => {
              switch (analyticsSort) {
                case 'views-desc': return (productViewCounts[b.id] || 0) - (productViewCounts[a.id] || 0);
                case 'views-asc': return (productViewCounts[a.id] || 0) - (productViewCounts[b.id] || 0);
                case 'clicks-desc': return (productClickCounts[b.id] || 0) - (productClickCounts[a.id] || 0);
                case 'clicks-asc': return (productClickCounts[a.id] || 0) - (productClickCounts[b.id] || 0);
                default: return 0;
              }
            });
            return (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {sortedProducts.map((p) => (
                  <div key={p.id} className="space-y-2">
                    <ProductCard id={p.id} companyName={p.company_name} subtitle={p.subtitle} description={p.description} logoUrl={p.logo_url} pricingValue={p.pricing_value} currency={p.currency} pricingUnit={p.pricing_unit} ctaText={p.cta_text} ctaLink={p.cta_link} freeTrialLink={p.free_trial_link} freeTrialText={p.free_trial_text} requestDemoLink={p.request_demo_link} websiteUrl={p.website_url} categoryLabel={categories.find(c => c.id === p.category_id)?.name} features={p.features?.map((f: any) => f.feature_text) ?? []} integrations={p.integrations?.map((i: any) => i.integration_name) ?? []} links={p.links?.map((l: any) => ({ text: l.link_text, url: l.link_url, isHighlighted: l.is_highlighted ?? false })) ?? []} showFreeTrial={p.show_free_trial ?? true} />
                    <div className="rounded-xl border border-border bg-card p-3 space-y-2">
                      <div className="flex items-center justify-between"><span className="text-xs font-medium text-muted-foreground">Total Views</span><Badge variant="secondary">{productViewCounts[p.id] || 0}</Badge></div>
                      <div className="flex items-center justify-between"><span className="text-xs font-medium text-muted-foreground">Total Clicks</span><Badge>{productClickCounts[p.id] || 0}</Badge></div>
                      {cardLinkClicks[p.id] && (<div className="border-t border-border pt-2 space-y-1">{Object.entries(cardLinkClicks[p.id]).sort(([,a],[,b]) => b - a).map(([linkName, count]) => (<div key={linkName} className="flex items-center justify-between text-xs"><span className="text-muted-foreground truncate mr-2">{linkName}</span><span className="font-medium">{count}</span></div>))}</div>)}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
          
          {/* Per-User Click Tracking */}
          <Card>
            <CardHeader><CardTitle className="text-base">Per-User Activity (Views & Clicks)</CardTitle></CardHeader>
            <CardContent>
              {(() => {
                const userClickCounts: Record<string, number> = {};
                analytics.forEach((a: any) => {
                  if (a.event_type === 'click') userClickCounts[a.user_id] = (userClickCounts[a.user_id] || 0) + 1;
                });
                const allUserIds = [...new Set([...Object.keys(userViewCounts), ...Object.keys(userClickCounts)])];
                const sorted = allUserIds.sort((a, b) => ((userViewCounts[b] || 0) + (userClickCounts[b] || 0)) - ((userViewCounts[a] || 0) + (userClickCounts[a] || 0)));
                return sorted.length === 0 ? <p className="text-sm text-muted-foreground">No data yet</p> : (
                  <div className="space-y-1">
                    {sorted.slice(0, 20).map((userId) => (
                      <div key={userId} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                        <span className="text-sm font-medium">{getUserName(userId)}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{userViewCounts[userId] || 0} views</Badge>
                          <Badge>{userClickCounts[userId] || 0} clicks</Badge>
                          <Badge variant="outline">{(userViewCounts[userId] || 0) + (userClickCounts[userId] || 0)} total</Badge>
                          <Button size="sm" variant="ghost" onClick={() => fetchUserActivity(userId)}><Eye className="h-3 w-3" /></Button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* Recent Activity with Real Timestamps */}
          <Card>
            <CardHeader><CardTitle className="text-base">Recent Activity (with timestamps)</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="pb-2 font-medium text-muted-foreground">User</th>
                      <th className="pb-2 font-medium text-muted-foreground">Product</th>
                      <th className="pb-2 font-medium text-muted-foreground">Event</th>
                      <th className="pb-2 font-medium text-muted-foreground">Link</th>
                      <th className="pb-2 font-medium text-muted-foreground">Date</th>
                      <th className="pb-2 font-medium text-muted-foreground">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.slice(0, 100).map((a: any) => {
                      const d = new Date(a.created_at);
                      return (
                        <tr key={a.id} className="border-b border-border/50 hover:bg-muted/30">
                          <td className="py-2 pr-3 font-medium">{getUserName(a.user_id)}</td>
                          <td className="py-2 pr-3">{getProductName(a.product_id)}</td>
                          <td className="py-2 pr-3"><Badge variant={a.event_type === 'view' ? 'secondary' : 'default'} className="text-xs">{a.event_type}</Badge></td>
                          <td className="py-2 pr-3 text-muted-foreground truncate max-w-[150px]">{a.link_text || '—'}</td>
                          <td className="py-2 pr-3 tabular-nums text-muted-foreground">{d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                          <td className="py-2 tabular-nums text-muted-foreground">{d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {analytics.length === 0 && <p className="text-sm text-muted-foreground mt-3">No activity recorded yet.</p>}
            </CardContent>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminDashboard;
