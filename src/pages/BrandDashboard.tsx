import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Upload, Link as LinkIcon, BarChart3, Eye, CreditCard, Star, Edit2, Package, Send, Settings } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface LinkItem { text: string; url: string; isHighlighted: boolean }

const CURRENCIES = [
  { value: '₹', label: '₹ Rupees' }, { value: '$', label: '$ Dollar' },
  { value: '€', label: '€ Euro' }, { value: '£', label: '£ Pound' },
];
const PRICING_UNITS = [
  { value: '/user/mo', label: '/user/mo' }, { value: '/mo', label: '/mo' },
  { value: '/year', label: '/year' }, { value: '/user/year', label: '/user/year' },
  { value: 'one-time', label: 'One-time' },
];

const safeParsePricingUnit = (unit: any) => {
  if (!unit) return '/user/mo';
  if (typeof unit === 'object') return unit.unit || unit.pricingUnit || unit.value || '/user/mo';
  if (typeof unit === 'string') {
    try {
      const parsed = JSON.parse(unit);
      if (parsed && typeof parsed === 'object') return parsed.unit || parsed.pricingUnit || parsed.value || unit;
    } catch {
      // not json
    }
    return unit;
  }
  return String(unit);
};

const BRAND_SIDEBAR_ITEMS = [
  { label: 'Overview', value: 'overview', icon: Eye },
  { label: 'Submit Product', value: 'products', icon: Send },
  { label: 'My Products', value: 'my-products', icon: Package },
  { label: 'Leads', value: 'leads', icon: Star },
  { label: 'Analytics', value: 'analytics', icon: BarChart3 },
  { label: 'Settings', value: 'pricing', icon: Settings },
];

const BrandDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Form state
  const [companyName, setCompanyName] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [subDescription, setSubDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [bestForMin, setBestForMin] = useState('');
  const [bestForMax, setBestForMax] = useState('');
  const [bestForUnit, setBestForUnit] = useState('Employees');
  const [pricingValue, setPricingValue] = useState('');
  const [oldPrice, setOldPrice] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [currency, setCurrency] = useState('₹');
  const [pricingUnit, setPricingUnit] = useState('/user/mo');
  const [ctaText, setCtaText] = useState('Request Demo');
  const [ctaLink, setCtaLink] = useState('');
  const [freeTrialLink, setFreeTrialLink] = useState('');
  const [freeTrialText, setFreeTrialText] = useState('14-day free trial');
  const [requestDemoLink, setRequestDemoLink] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [googleFormUrl, setGoogleFormUrl] = useState('');
  const [priceOnRequest, setPriceOnRequest] = useState(false);
  const [features, setFeatures] = useState<string[]>([]);
  const [integrations, setIntegrations] = useState<string[]>([]);
  const [newFeature, setNewFeature] = useState('');
  const [newIntegration, setNewIntegration] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [actionLinks, setActionLinks] = useState<LinkItem[]>([]);
  const [linkText, setLinkText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkHighlighted, setLinkHighlighted] = useState(false);

  useEffect(() => {
    if (!logoFile) {
      setLogoPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(logoFile);
    setLogoPreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [logoFile]);

  // Analytics
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [userDetail, setUserDetail] = useState<any[]>([]);
  const [analyticsSort, setAnalyticsSort] = useState<string>('views-desc');
  const [analyticsCategoryFilter, setAnalyticsCategoryFilter] = useState<string>('all');
  const [detailCardId, setDetailCardId] = useState<string | null>(null);

  // Reviews
  const [productReviews, setProductReviews] = useState<any[]>([]);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editReviewText, setEditReviewText] = useState('');

  // Pricing
  const [pricingPlans, setPricingPlans] = useState<any[]>([]);
  const [showPricingForm, setShowPricingForm] = useState(false);
  const [pricingName, setPricingName] = useState('');
  const [pricingPrice, setPricingPrice] = useState('');
  const [pricingCurrency, setPricingCurrency] = useState('₹');
  const [pricingBillingPeriod, setPricingBillingPeriod] = useState('/mo');
  const [pricingFeatures, setPricingFeatures] = useState<string[]>([]);
  const [newPricingFeature, setNewPricingFeature] = useState('');
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [pricingProductId, setPricingProductId] = useState('');

  // Leads
  const [leads, setLeads] = useState<any[]>([]);

  useEffect(() => {
    if (user) { fetchProducts(); fetchCategories(); fetchBrandAnalytics(); fetchPricingPlans(); fetchReviews(); fetchLeads(); }
  }, [user]);

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*').eq('brand_user_id', user!.id).order('created_at', { ascending: false });
    if (data) {
      const enriched = await Promise.all(data.map(async (p) => {
        const [feats, ints, lnks] = await Promise.all([
          supabase.from('product_features').select('*').eq('product_id', p.id).order('display_order'),
          supabase.from('product_integrations').select('*').eq('product_id', p.id).order('display_order'),
          supabase.from('product_links').select('*').eq('product_id', p.id).order('display_order'),
        ]);
        return { ...p, features: feats.data ?? [], integrations: ints.data ?? [], links: lnks.data ?? [] };
      }));
      setProducts(enriched);
    }
  };

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*').eq('is_visible', true).order('display_order');
    setCategories(data ?? []);
  };

  const fetchBrandAnalytics = async () => {
    const { data } = await supabase.from('user_activity' as any).select('*').order('created_at', { ascending: false }).limit(500);
    setAnalytics(data ?? []);
  };

  const fetchReviews = async () => {
    const { data: prods } = await supabase.from('products').select('id').eq('brand_user_id', user!.id);
    if (prods && prods.length > 0) {
      const { data } = await supabase.from('reviews').select('*').in('product_id', prods.map(p => p.id)).order('created_at', { ascending: false });
      setProductReviews(data ?? []);
    }
  };

  const fetchLeads = async () => {
    const { data } = await supabase.from('leads' as any).select('*').order('created_at', { ascending: false }).limit(200);
    setLeads((data as any[]) ?? []);
  };

  const fetchPricingPlans = async () => {
    const { data: plans } = await supabase.from('pricing_plans' as any).select('*').eq('brand_user_id', user!.id).order('display_order');
    const { data: feats } = await supabase.from('pricing_features' as any).select('*').order('display_order');
    setPricingPlans(((plans as any[]) ?? []).map(p => ({ ...p, features: ((feats as any[]) ?? []).filter(f => f.plan_id === p.id) })));
  };

  const fetchUserDetail = async (userId: string) => {
    setSelectedUser(userId);
    const productIds = products.map(p => p.id);
    const { data } = await supabase.from('user_activity' as any).select('*').eq('user_id', userId).in('product_id', productIds).order('created_at', { ascending: false }).limit(200);
    setUserDetail(data ?? []);
  };

  const getUserDisplay = (userId: string) => `Customer #${userId.slice(0, 8).toUpperCase()}`;
  const getProductName = (productId: string) => products.find(p => p.id === productId)?.company_name ?? productId;

  const resetForm = () => {
    setCompanyName(''); setSubtitle(''); setDescription(''); setSubDescription('');
    setCategoryId(''); setNewCategoryName(''); setBestForMin(''); setBestForMax(''); setBestForUnit('Employees');
    setPricingValue(''); setOldPrice(''); setNewPrice(''); setCurrency('₹'); setPricingUnit('/user/mo');
    setCtaText('Request Demo'); setCtaLink('');
    setFreeTrialLink(''); setFreeTrialText('14-day free trial'); setRequestDemoLink(''); setWebsiteUrl(''); setGoogleFormUrl('');
    setFeatures([]); setIntegrations([]); setNewFeature(''); setNewIntegration('');
    setLogoFile(null); setEditingId(null); setPriceOnRequest(false);
    setActionLinks([]); setLinkText(''); setLinkUrl(''); setLinkHighlighted(false);
  };

  const addNewCategory = async () => {
    if (!newCategoryName.trim()) return;
    const { data, error } = await supabase.from('categories').insert({ name: newCategoryName.trim(), display_order: categories.length }).select().single();
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    if (data) { setCategoryId(data.id); setNewCategoryName(''); fetchCategories(); toast({ title: 'Category created' }); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    let logoUrl: string | null = null;
    if (logoFile) {
      const ext = logoFile.name.split('.').pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from('logos').upload(path, logoFile);
      if (!uploadErr) { const { data: urlData } = supabase.storage.from('logos').getPublicUrl(path); logoUrl = urlData.publicUrl; }
    }
    const productData: any = {
      company_name: companyName, subtitle: subtitle || null, description: description.slice(0, 150),
      sub_description: subDescription || null, category_id: categoryId || null,
      best_for_min: parseInt(bestForMin) || null, best_for_max: parseInt(bestForMax) || null, best_for_unit: bestForUnit || 'Employees',
      pricing_value: parseFloat(pricingValue) || null,
      old_price: parseFloat(oldPrice) || null,
      new_price: parseFloat(newPrice) || null,
      currency: currency || '₹', pricing_unit: safeParsePricingUnit(pricingUnit),
      cta_text: ctaText || 'Request Demo', cta_link: ctaLink || null,
      free_trial_link: freeTrialLink || null, free_trial_text: freeTrialText || null,
      request_demo_link: requestDemoLink || null, website_url: websiteUrl || null,
      google_form_url: googleFormUrl || null, google_form_status: googleFormUrl ? 'pending' : null,
      price_on_request: priceOnRequest,
      status: 'pending', ...(logoUrl && { logo_url: logoUrl }),
    };
    try {
      let productId = editingId;
      if (editingId) {
        await supabase.from('products').update(productData).eq('id', editingId);
        await Promise.all([
          supabase.from('product_features').delete().eq('product_id', editingId),
          supabase.from('product_integrations').delete().eq('product_id', editingId),
          supabase.from('product_links').delete().eq('product_id', editingId),
        ]);
      } else {
        const { data: newProduct } = await supabase.from('products').insert({ ...productData, brand_user_id: user.id }).select().single();
        productId = newProduct?.id;
      }
      if (productId) {
        const inserts = [];
        if (features.length > 0) inserts.push(supabase.from('product_features').insert(features.map((f, i) => ({ product_id: productId!, feature_text: f, display_order: i }))));
        if (integrations.length > 0) inserts.push(supabase.from('product_integrations').insert(integrations.map((n, i) => ({ product_id: productId!, integration_name: n, display_order: i }))));
        if (actionLinks.length > 0) inserts.push(supabase.from('product_links').insert(actionLinks.map((l, i) => ({ product_id: productId!, link_text: l.text, link_url: l.url, is_highlighted: l.isHighlighted, display_order: i }))));
        await Promise.all(inserts);
      }
      toast({ title: editingId ? 'Product updated and re-submitted' : 'Product submitted for approval' });
      resetForm(); setShowForm(false); fetchProducts();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
    setLoading(false);
  };

  const editProduct = (p: any) => {
    setEditingId(p.id); setCompanyName(p.company_name); setSubtitle(p.subtitle ?? '');
    setDescription(p.description); setSubDescription(p.sub_description ?? '');
    setCategoryId(p.category_id ?? ''); setBestForMin(p.best_for_min?.toString() ?? '');
    setBestForMax(p.best_for_max?.toString() ?? ''); setBestForUnit(p.best_for_unit ?? 'Employees');
    setPricingValue(p.pricing_value?.toString() ?? '');
    setOldPrice(p.old_price?.toString() ?? '');
    setNewPrice(p.new_price?.toString() ?? '');
    setCurrency(p.currency ?? '₹');
    setPricingUnit(safeParsePricingUnit(p.pricing_unit)); setCtaText(p.cta_text ?? 'Request Demo');
    setCtaLink(p.cta_link ?? ''); setFreeTrialLink(p.free_trial_link ?? '');
    setFreeTrialText(p.free_trial_text ?? '14-day free trial'); setRequestDemoLink(p.request_demo_link ?? '');
    setWebsiteUrl(p.website_url ?? ''); setGoogleFormUrl(p.google_form_url ?? '');
    setPriceOnRequest(p.price_on_request ?? false);
    setFeatures(p.features?.map((f: any) => f.feature_text) ?? []);
    setIntegrations(p.integrations?.map((i: any) => i.integration_name) ?? []);
    setActionLinks(p.links?.map((l: any) => ({ text: l.link_text, url: l.link_url, isHighlighted: l.is_highlighted ?? false })) ?? []);
    setShowForm(true);
    setActiveTab('products');
  };

  const statusColor = (s: string) => {
    switch (s) { case 'approved': return 'bg-green-100 text-green-800'; case 'rejected': return 'bg-red-100 text-red-800'; default: return 'bg-yellow-100 text-yellow-800'; }
  };

  const addLink = () => {
    if (!linkText.trim() || !linkUrl.trim()) return;
    setActionLinks([...actionLinks, { text: linkText, url: linkUrl, isHighlighted: linkHighlighted }]);
    setLinkText(''); setLinkUrl(''); setLinkHighlighted(false);
  };

  const updateReview = async (reviewId: string) => {
    await supabase.from('reviews').update({ review_text: editReviewText }).eq('id', reviewId);
    toast({ title: 'Review updated' }); setEditingReviewId(null); fetchReviews();
  };
  const deleteReview = async (reviewId: string) => {
    await supabase.from('reviews').update({ is_visible: false }).eq('id', reviewId);
    toast({ title: 'Review hidden' }); fetchReviews();
  };

  const resetPricingForm = () => {
    setPricingName(''); setPricingPrice(''); setPricingCurrency('₹'); setPricingBillingPeriod('/mo');
    setPricingFeatures([]); setNewPricingFeature(''); setEditingPlanId(null); setShowPricingForm(false); setPricingProductId('');
  };
  const submitPricingPlan = async () => {
    if (!pricingName.trim() || !user || !pricingProductId) { toast({ title: 'Please select a product and enter plan name', variant: 'destructive' }); return; }
    try {
      if (editingPlanId) {
        await supabase.from('pricing_plans' as any).update({ name: pricingName, price: parseFloat(pricingPrice) || 0, currency: pricingCurrency, billing_period: pricingBillingPeriod, status: 'pending' }).eq('id', editingPlanId);
        await supabase.from('pricing_features' as any).delete().eq('plan_id', editingPlanId);
        if (pricingFeatures.length > 0) await supabase.from('pricing_features' as any).insert(pricingFeatures.map((f, i) => ({ plan_id: editingPlanId, feature_text: f, display_order: i })));
      } else {
        const { data: newPlan } = await supabase.from('pricing_plans' as any).insert({ name: pricingName, price: parseFloat(pricingPrice) || 0, currency: pricingCurrency, billing_period: pricingBillingPeriod, brand_user_id: user.id, product_id: pricingProductId, status: 'pending', display_order: pricingPlans.length }).select().single();
        if (newPlan && pricingFeatures.length > 0) await supabase.from('pricing_features' as any).insert(pricingFeatures.map((f, i) => ({ plan_id: (newPlan as any).id, feature_text: f, display_order: i })));
      }
      toast({ title: editingPlanId ? 'Plan updated & submitted' : 'Plan submitted for approval' });
      resetPricingForm(); fetchPricingPlans();
    } catch (err: any) { toast({ title: 'Error', description: err.message, variant: 'destructive' }); }
  };
  const editPricingPlan = (plan: any) => {
    setEditingPlanId(plan.id); setPricingName(plan.name); setPricingPrice(plan.price?.toString() ?? '');
    setPricingCurrency(plan.currency ?? '₹'); setPricingBillingPeriod(plan.billing_period ?? '/mo');
    setPricingFeatures(plan.features?.map((f: any) => f.feature_text) ?? []); setPricingProductId(plan.product_id ?? ''); setShowPricingForm(true);
  };

  // Overview stats
  const productIds = products.map(p => p.id);
  const filteredAnalytics = analytics.filter((a: any) => productIds.includes(a.product_id));
  const totalViews = filteredAnalytics.filter((a: any) => a.event_type === 'view').length;
  const totalClicks = filteredAnalytics.filter((a: any) => a.event_type === 'click').length;
  const activeProducts = products.filter(p => p.status === 'approved' && p.is_visible).length;

  const customerAnalytics = Object.values(filteredAnalytics.reduce((acc: Record<string, any>, event: any) => {
    if(!event.user_id) return acc;
    if(!acc[event.user_id]) acc[event.user_id] = { userId: event.user_id, views: 0, clicks: 0, events: [], latestTime: event.created_at };
    const item = acc[event.user_id];
    item.events.push(event);
    if (event.event_type === 'view') item.views += 1;
    if (event.event_type === 'click') item.clicks += 1;
    if (new Date(event.created_at) > new Date(item.latestTime)) item.latestTime = event.created_at;
    item.total = item.views + item.clicks;
    return acc;
  }, {} as Record<string, any>));

  const sortedCustomerAnalytics = customerAnalytics.sort((a: any, b: any) => {
    if (analyticsSort === 'views-desc') return b.views - a.views;
    if (analyticsSort === 'clicks-desc') return b.clicks - a.clicks;
    if (analyticsSort === 'recent') return new Date(b.latestTime).getTime() - new Date(a.latestTime).getTime();
    return 0;
  });

  const displayedAnalytics = analyticsCategoryFilter === 'all' ? sortedCustomerAnalytics : sortedCustomerAnalytics.filter((c: any) => {
    const productMatch = products.find(p => productIds.includes(p.id) && p.category_id === analyticsCategoryFilter && c.events.some((e: any) => e.product_id === p.id));
    return !!productMatch;
  });

  return (
    <DashboardLayout
      title="Brand Panel"
      items={BRAND_SIDEBAR_ITEMS}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {/* Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <h1 className="text-2xl font-bold font-[Plus_Jakarta_Sans]">Brand Overview</h1>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Product Views', value: totalViews.toLocaleString(), change: '+15%', color: 'text-orange-500', icon: Eye },
              { label: 'Clicks', value: totalClicks.toLocaleString(), change: '+10%', color: 'text-red-500', icon: BarChart3 },
              { label: 'Leads', value: leads.length.toString(), change: '+28%', color: 'text-primary', icon: Star },
              { label: 'Active Products', value: activeProducts.toString(), color: 'text-purple-500', icon: Package },
            ].map((s) => (
              <Card key={s.label}>
                <CardContent className="flex items-center gap-4 p-6">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-full bg-muted ${s.color}`}>
                    <s.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{s.label}</p>
                    <p className="text-2xl font-bold">{s.value}</p>
                    {s.change && <p className="text-xs text-green-500">{s.change}</p>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {leads.slice(0, 3).map((lead: any) => (
                <div key={lead.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="font-semibold text-sm">Lead received</p>
                    <p className="text-xs text-muted-foreground">{lead.name} requested a {lead.source_button}</p>
                  </div>
                  <span className="text-xs text-primary">{new Date(lead.created_at).toLocaleDateString()}</span>
                </div>
              ))}
              {products.filter(p => p.status === 'approved').slice(0, 2).map(p => (
                <div key={p.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="font-semibold text-sm">Product approved</p>
                    <p className="text-xs text-muted-foreground">{p.company_name} is now live</p>
                  </div>
                  <span className="text-xs text-primary">{new Date(p.updated_at || p.created_at).toLocaleDateString()}</span>
                </div>
              ))}
              {leads.length === 0 && products.length === 0 && <p className="text-sm text-muted-foreground">No recent activity</p>}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Submit Product */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold font-[Plus_Jakarta_Sans]">Submit Product</h1>
            <Button onClick={() => { resetForm(); setShowForm(!showForm); }}>
              <Plus className="mr-2 h-4 w-4" /> {showForm ? 'Cancel' : 'Create Product'}
            </Button>
          </div>

          {showForm && (
            <Card>
              <CardHeader><CardTitle>{editingId ? 'Edit Product' : 'Create New Product'}</CardTitle></CardHeader>
              <CardContent>
                <div className="grid gap-8 lg:grid-cols-2">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div><Label>Company Name *</Label><Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} required /></div>
                      <div><Label>Subtitle</Label><Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="e.g. Cloud CRM Platform" /></div>
                    </div>
                    <div>
                      <Label>Logo Image</Label>
                      <label className="mt-1 flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border px-4 py-2 hover:bg-muted">
                        <Upload className="h-4 w-4" /><span className="text-sm">{logoFile?.name ?? 'Choose file'}</span>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)} />
                      </label>
                    </div>
                    <div>
                      <Label>Category</Label>
                      <Select value={categoryId} onValueChange={setCategoryId}>
                        <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                        <SelectContent>{categories.filter(c => c.id).map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                      </Select>
                      <div className="mt-2 flex gap-2">
                        <Input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="Or create new category" className="text-sm" />
                        <Button type="button" variant="outline" size="sm" onClick={addNewCategory}><Plus className="h-3 w-3" /></Button>
                      </div>
                    </div>
                    <div><Label>Description *</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={150} rows={2} required /></div>
                    <div><Label>Sub-description</Label><Input value={subDescription} onChange={(e) => setSubDescription(e.target.value)} /></div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div><Label className="text-xs">Best For Min</Label><Input type="number" value={bestForMin} onChange={(e) => setBestForMin(e.target.value)} /></div>
                      <div><Label className="text-xs">Best For Max</Label><Input type="number" value={bestForMax} onChange={(e) => setBestForMax(e.target.value)} /></div>
                      <div><Label className="text-xs">Unit</Label><Input value={bestForUnit} onChange={(e) => setBestForUnit(e.target.value)} /></div>
                    </div>
                    <div className="border-t border-border pt-4 space-y-3">
                      <Label className="text-base font-semibold">Pricing Information</Label>
                    <p className="text-xs text-muted-foreground">Leave both prices empty to show "Price on Request"</p>
                      <div className="flex items-center gap-2 mt-1">
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <input type="checkbox" checked={priceOnRequest} onChange={(e) => setPriceOnRequest(e.target.checked)} className="rounded" />
                          <span className="font-medium">Price on Request (hide pricing, show "Price on Request" on card)</span>
                        </label>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div><Label className="text-xs">Old Price (Optional)</Label><Input type="number" value={oldPrice} onChange={(e) => setOldPrice(e.target.value)} placeholder="Original price" /></div>
                        <div><Label className="text-xs">New Price</Label><Input type="number" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} placeholder="Current price" /></div>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div><Label className="text-xs">Currency</Label>
                          <Select value={currency} onValueChange={setCurrency}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CURRENCIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent></Select>
                        </div>
                        <div><Label className="text-xs">Starting Price (for card display)</Label><Input type="number" value={pricingValue} onChange={(e) => setPricingValue(e.target.value)} placeholder="e.g. 5000" /></div>
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div><Label className="text-xs">Pricing Unit</Label>
                        <Select value={pricingUnit} onValueChange={setPricingUnit}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PRICING_UNITS.map(u => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}</SelectContent></Select>
                      </div>
                      <div><Label className="text-xs">CTA Text</Label><Input value={ctaText} onChange={(e) => setCtaText(e.target.value)} /></div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div><Label>Free Trial Link</Label><Input value={freeTrialLink} onChange={(e) => setFreeTrialLink(e.target.value)} /></div>
                      <div><Label>Free Trial Text</Label><Input value={freeTrialText} onChange={(e) => setFreeTrialText(e.target.value)} /></div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div><Label>Request Demo Link</Label><Input value={requestDemoLink} onChange={(e) => setRequestDemoLink(e.target.value)} /></div>
                      <div><Label>Website URL</Label><Input value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} /></div>
                    </div>
                    <div><Label>Google Form URL (optional, needs admin approval)</Label><Input value={googleFormUrl} onChange={(e) => setGoogleFormUrl(e.target.value)} placeholder="https://docs.google.com/forms/..." /></div>
                    <div>
                      <Label>Features</Label>
                      <div className="mt-2 flex gap-2">
                        <Input value={newFeature} onChange={(e) => setNewFeature(e.target.value)} placeholder="Add feature" />
                        <Button type="button" variant="outline" onClick={() => { if (newFeature.trim()) { setFeatures([...features, newFeature.trim()]); setNewFeature(''); } }}>Add</Button>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {features.map((f, i) => <Badge key={i} variant="secondary" className="gap-1">{f}<button type="button" onClick={() => setFeatures(features.filter((_, idx) => idx !== i))}><Trash2 className="h-3 w-3" /></button></Badge>)}
                      </div>
                    </div>
                    <div>
                      <Label>Integrations</Label>
                      <div className="mt-2 flex gap-2">
                        <Input value={newIntegration} onChange={(e) => setNewIntegration(e.target.value)} placeholder="Add integration" />
                        <Button type="button" variant="outline" onClick={() => { if (newIntegration.trim()) { setIntegrations([...integrations, newIntegration.trim()]); setNewIntegration(''); } }}>Add</Button>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {integrations.map((n, i) => <Badge key={i} variant="secondary" className="gap-1">{n}<button type="button" onClick={() => setIntegrations(integrations.filter((_, idx) => idx !== i))}><Trash2 className="h-3 w-3" /></button></Badge>)}
                      </div>
                    </div>
                    <div className="border-t border-border pt-4">
                      <Label className="text-base font-semibold">What's Next Links</Label>
                      <div className="grid gap-3 sm:grid-cols-3 mt-2">
                        <div><Label className="text-xs">Link Text</Label><Input value={linkText} onChange={(e) => setLinkText(e.target.value)} /></div>
                        <div><Label className="text-xs">Link URL</Label><Input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} /></div>
                        <div className="flex items-end gap-2">
                          <label className="flex items-center gap-1.5 text-xs"><input type="checkbox" checked={linkHighlighted} onChange={(e) => setLinkHighlighted(e.target.checked)} className="rounded" />Highlight</label>
                          <Button type="button" variant="outline" onClick={addLink} size="sm"><Plus className="mr-1 h-3 w-3" />Add</Button>
                        </div>
                      </div>
                      <div className="mt-3 space-y-1">
                        {actionLinks.map((l, i) => (
                          <div key={i} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm">
                            <span className={l.isHighlighted ? 'font-semibold text-orange-500' : ''}><LinkIcon className="mr-1.5 inline h-3 w-3" />{l.text}</span>
                            <button type="button" onClick={() => setActionLinks(actionLinks.filter((_, idx) => idx !== i))}><Trash2 className="h-3 w-3 text-destructive" /></button>
                          </div>
                        ))}
                      </div>
                    </div>
                    <Button type="submit" disabled={loading} className="w-full">
                      {loading ? 'Submitting...' : editingId ? 'Update & Re-submit' : 'Submit for Approval'}
                    </Button>
                  </form>
                  <div className="lg:sticky lg:top-24 lg:self-start">
                    <p className="text-sm font-semibold text-muted-foreground mb-3">Live Preview</p>
                    <ProductCard
                      id="preview" companyName={companyName || 'Company Name'} subtitle={subtitle}
                      description={description || 'Product description will appear here'} subDescription={subDescription}
                      logoUrl={logoPreviewUrl || undefined} bestForMin={parseInt(bestForMin) || null} bestForMax={parseInt(bestForMax) || null}
                      bestForUnit={bestForUnit} pricingValue={parseFloat(pricingValue) || null} currency={currency}
                      pricingUnit={pricingUnit} ctaText={ctaText} ctaLink={ctaLink} freeTrialLink={freeTrialLink}
                      freeTrialText={freeTrialText} requestDemoLink={requestDemoLink} websiteUrl={websiteUrl}
                      categoryLabel={categories.find(c => c.id === categoryId)?.name} features={features}
                      integrations={integrations} links={actionLinks}
                      priceOnRequest={priceOnRequest} showPricing={!priceOnRequest}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* My Products */}
      {activeTab === 'my-products' && (
        <div className="space-y-6">
          <h1 className="text-2xl font-bold font-[Plus_Jakarta_Sans]">My Products</h1>
          {products.length === 0 ? (
            <p className="text-muted-foreground">No products yet.</p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((p) => (
                <div key={p.id} className="space-y-2">
                  <ProductCard
                    id={p.id} companyName={p.company_name} subtitle={p.subtitle}
                    description={p.description} subDescription={p.sub_description} logoUrl={p.logo_url}
                    bestForMin={p.best_for_min} bestForMax={p.best_for_max} bestForUnit={p.best_for_unit}
                    pricingValue={p.pricing_value} currency={p.currency} pricingUnit={p.pricing_unit}
                    ctaText={p.cta_text} ctaLink={p.cta_link}
                    freeTrialLink={p.free_trial_link} freeTrialText={p.free_trial_text}
                    requestDemoLink={p.request_demo_link} websiteUrl={p.website_url}
                    categoryLabel={categories.find(c => c.id === p.category_id)?.name}
                    features={p.features?.map((f: any) => f.feature_text) ?? []}
                    integrations={p.integrations?.map((i: any) => i.integration_name) ?? []}
                    links={p.links?.map((l: any) => ({ text: l.link_text, url: l.link_url, isHighlighted: l.is_highlighted ?? false })) ?? []}
                    priceOnRequest={p.price_on_request ?? false}
                    showPricing={!p.price_on_request}
                  />
                  <div className="flex items-center justify-between px-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusColor(p.status)}`}>{p.status}</span>
                    <Button variant="outline" size="sm" onClick={() => editProduct(p)}>Edit</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Leads */}
      {activeTab === 'leads' && (
        <div className="space-y-6">
          <h1 className="text-2xl font-bold font-[Plus_Jakarta_Sans]">Lead Inquiries</h1>
          {leads.length === 0 ? (
            <p className="text-muted-foreground">No leads yet.</p>
          ) : (
            leads.map((lead: any) => (
              <Card key={lead.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{lead.name}</p>
                      <p className="text-sm text-muted-foreground">{lead.email} {lead.mobile && `• ${lead.mobile}`}</p>
                      {lead.purpose && <p className="text-sm mt-1">{lead.purpose}</p>}
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary">{lead.source_button}</Badge>
                      <p className="text-xs text-muted-foreground mt-1">{getProductName(lead.product_id)}</p>
                      <p className="text-xs text-muted-foreground">{new Date(lead.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Analytics */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <h1 className="text-2xl font-bold font-[Plus_Jakarta_Sans]">Brand Analytics</h1>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Sort by</span>
              <Select value={analyticsSort} onValueChange={setAnalyticsSort}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="views-desc">Views (desc)</SelectItem>
                  <SelectItem value="clicks-desc">Clicks (desc)</SelectItem>
                  <SelectItem value="recent">Recent activity</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Category</span>
              <Select value={analyticsCategoryFilter} onValueChange={setAnalyticsCategoryFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredAnalytics.length === 0 ? (
              <div className="p-4 rounded-lg border border-border text-sm text-muted-foreground">No analytics yet for published products.</div>
            ) : (
              displayedAnalytics.map((customer: any) => (
                <Card key={customer.userId}>
                  <CardContent className="px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold">{getUserDisplay(customer.userId)}</p>
                        <p className="text-xs text-muted-foreground">Last action: {new Date(customer.latestTime).toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs">Views: <strong>{customer.views}</strong></p>
                        <p className="text-xs">Clicks: <strong>{customer.clicks}</strong></p>
                        <p className="text-xs">Total: <strong>{customer.total}</strong></p>
                      </div>
                    </div>
                    <Button className="mt-2" size="sm" variant="outline" onClick={() => fetchUserDetail(customer.userId)}>View details</Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {selectedUser && userDetail.length > 0 && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Activity for {getUserDisplay(selectedUser)}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {userDetail.map((event: any) => (
                  <div key={event.id || `${event.user_id}-${event.created_at}`} className="flex justify-between rounded-lg border border-border p-2">
                    <span className="text-xs">{event.event_type}</span>
                    <span className="text-xs truncate">{getProductName(event.product_id)}</span>
                    <span className="text-xs text-right text-muted-foreground">{new Date(event.created_at).toLocaleString()}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Pricing / Settings */}
      {activeTab === 'pricing' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold font-[Plus_Jakarta_Sans]">Pricing Plans</h1>
            <Button onClick={() => { resetPricingForm(); setShowPricingForm(!showPricingForm); }}>
              <Plus className="mr-2 h-4 w-4" /> {showPricingForm ? 'Cancel' : 'Create Pricing Plan'}
            </Button>
          </div>
          {showPricingForm && (
            <Card className="border-primary">
              <CardHeader><CardTitle>{editingPlanId ? 'Edit Pricing Plan' : 'New Pricing Plan'}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Select Product *</Label>
                  <Select value={pricingProductId} onValueChange={setPricingProductId}>
                    <SelectTrigger><SelectValue placeholder="Choose product" /></SelectTrigger>
                    <SelectContent>{products.filter(p => p.id).map(p => <SelectItem key={p.id} value={p.id}>{p.company_name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid gap-3 sm:grid-cols-4">
                  <div><Label>Plan Name</Label><Input value={pricingName} onChange={(e) => setPricingName(e.target.value)} /></div>
                  <div><Label>Price</Label><Input type="number" value={pricingPrice} onChange={(e) => setPricingPrice(e.target.value)} /></div>
                  <div><Label>Currency</Label>
                    <Select value={pricingCurrency} onValueChange={setPricingCurrency}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CURRENCIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent></Select>
                  </div>
                  <div><Label>Period</Label><Input value={pricingBillingPeriod} onChange={(e) => setPricingBillingPeriod(e.target.value)} /></div>
                </div>
                <div>
                  <Label>Features</Label>
                  <div className="mt-2 flex gap-2">
                    <Input value={newPricingFeature} onChange={(e) => setNewPricingFeature(e.target.value)} placeholder="Add feature" />
                    <Button type="button" variant="outline" onClick={() => { if (newPricingFeature.trim()) { setPricingFeatures([...pricingFeatures, newPricingFeature.trim()]); setNewPricingFeature(''); } }}>Add</Button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {pricingFeatures.map((f, i) => <Badge key={i} variant="secondary" className="gap-1">{f}<button onClick={() => setPricingFeatures(pricingFeatures.filter((_, idx) => idx !== i))}><Trash2 className="h-3 w-3" /></button></Badge>)}
                  </div>
                </div>
                <Button onClick={submitPricingPlan}>{editingPlanId ? 'Update & Submit' : 'Submit for Approval'}</Button>
              </CardContent>
            </Card>
          )}
          {pricingPlans.length === 0 ? (
            <p className="text-muted-foreground">No pricing plans yet.</p>
          ) : (
            pricingPlans.map(plan => (
              <Card key={plan.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-semibold">{plan.name} — {plan.currency}{plan.price}{plan.billing_period}</p>
                    <p className="text-sm text-muted-foreground">{getProductName(plan.product_id)} • {plan.features?.length ?? 0} features</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={plan.status === 'approved' ? 'default' : plan.status === 'rejected' ? 'destructive' : 'secondary'}>{plan.status ?? 'approved'}</Badge>
                    <Button size="sm" variant="outline" onClick={() => editPricingPlan(plan)}>Edit</Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}

          {/* Reviews section within settings */}
          <h2 className="text-xl font-bold font-[Plus_Jakarta_Sans] pt-6">Reviews on Your Products</h2>
          {productReviews.length === 0 ? (
            <p className="text-muted-foreground">No reviews yet.</p>
          ) : (
            productReviews.map((r) => (
              <Card key={r.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5].map(s => <Star key={s} className={`h-3 w-3 ${s <= r.rating ? 'fill-warning text-warning' : 'text-muted'}`} />)}
                        </div>
                        <Badge variant="secondary" className="text-xs">{getProductName(r.product_id)}</Badge>
                        <Badge variant={r.status === 'approved' ? 'default' : 'secondary'} className="text-xs">{r.status}</Badge>
                      </div>
                      {editingReviewId === r.id ? (
                        <div className="flex gap-2 mt-2">
                          <Textarea value={editReviewText} onChange={(e) => setEditReviewText(e.target.value)} rows={2} className="flex-1" />
                          <div className="flex flex-col gap-1">
                            <Button size="sm" onClick={() => updateReview(r.id)}>Save</Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingReviewId(null)}>Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm mt-1">{r.review_text || 'No text'}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">{new Date(r.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <Button size="sm" variant="ghost" onClick={() => { setEditingReviewId(r.id); setEditReviewText(r.review_text || ''); }}><Edit2 className="h-3 w-3" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => deleteReview(r.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </DashboardLayout>
  );
};

export default BrandDashboard;
