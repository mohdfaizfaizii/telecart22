import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useProductSubscription } from '@/hooks/use-product-subscription';
import { useAuth } from '@/lib/auth-context';
import { useTrackActivity } from '@/hooks/use-track-activity';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import LeadFormPopup from '@/components/LeadFormPopup';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Phone, Play, FileText, Building2, ShieldCheck, BadgeCheck, CheckCircle2, Crown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

const safeParsePricingValue = (value: any) => {
  if (value == null) return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const num = Number(value);
    if (!Number.isNaN(num)) return num;
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === 'object') {
        if (typeof parsed.value === 'number') return parsed.value;
        if (typeof parsed.price === 'number') return parsed.price;
      }
    } catch {
      // not json
    }
    return null;
  }
  if (typeof value === 'object') {
    if (typeof value.value === 'number') return value.value;
    if (typeof value.price === 'number') return value.price;
  }
  return null;
};

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user, role } = useAuth();
  const { trackView, trackClick } = useTrackActivity();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [features, setFeatures] = useState<any[]>([]);
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [leadPopupOpen, setLeadPopupOpen] = useState(false);
  const [leadSource, setLeadSource] = useState('');
  const [pricingPlans, setPricingPlans] = useState<any[]>([]);
  const [payingPlanId, setPayingPlanId] = useState<string | null>(null);

  const fetchProduct = async () => {
    const [pRes, fRes, iRes, rRes, plansRes] = await Promise.all([
      supabase.from('products').select('*').eq('id', id!).single(),
      supabase.from('product_features').select('*').eq('product_id', id!).order('display_order'),
      supabase.from('product_integrations').select('*').eq('product_id', id!).order('display_order'),
      supabase.from('reviews').select('*').eq('product_id', id!).eq('status', 'approved').eq('is_visible', true).order('created_at', { ascending: false }),
      supabase.from('pricing_plans').select('*').eq('product_id', id!).eq('is_enabled', true).order('display_order'),
    ]);
    setProduct(pRes.data);
    setFeatures(fRes.data ?? []);
    setIntegrations(iRes.data ?? []);
    setReviews(rRes.data ?? []);
    // Fetch features for each plan
    const plans = (plansRes.data as any[]) ?? [];
    if (plans.length > 0) {
      const { data: planFeats } = await supabase.from('pricing_features').select('*').in('plan_id', plans.map(p => p.id)).order('display_order');
      setPricingPlans(plans.map(p => ({ ...p, features: (planFeats ?? []).filter((f: any) => f.plan_id === p.id) })));
    }
  };

  useEffect(() => {
    if (id) {
      fetchProduct();
      trackView(id);
    }
  }, [id, trackView]);

  // Subscribe to real-time product changes
  useProductSubscription(fetchProduct);

  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const ratingBreakdown = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    percent: reviews.length > 0 ? (reviews.filter(r => r.rating === star).length / reviews.length) * 100 : 0,
  }));

  const submitReview = async () => {
    if (!user || !id || rating === 0) return;
    setSubmitting(true);
    const { error } = await supabase.from('reviews').insert({ product_id: id, user_id: user.id, rating, review_text: reviewText });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Review submitted for approval' });
      setRating(0); setReviewText('');
    }
    setSubmitting(false);
  };

  const handleRazorpayPayment = async (plan: any) => {
    const razorpayKey = (import.meta as any).env?.VITE_RAZORPAY_KEY_ID;
    if (!razorpayKey) {
      toast({ title: 'Payment not configured', description: 'Razorpay is not set up yet.', variant: 'destructive' });
      return;
    }
    // Load Razorpay script if not loaded
    if (!(window as any).Razorpay) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      document.head.appendChild(script);
      await new Promise(resolve => script.onload = resolve);
    }
    const amountInPaise = Math.round((plan.price || 0) * 100);
    const options = {
      key: razorpayKey,
      amount: amountInPaise,
      currency: plan.currency === '₹' ? 'INR' : 'USD',
      name: product?.company_name || 'Product',
      description: `${plan.name} Plan`,
      handler: (response: any) => {
        toast({ title: 'Payment Successful!', description: `Payment ID: ${response.razorpay_payment_id}` });
      },
      prefill: { email: user?.email || '' },
      theme: { color: '#ff6b35' },
    };
    const rzp = new (window as any).Razorpay(options);
    rzp.open();
  };

  const openLeadForm = async (source: string) => {
    setLeadSource(source);
    if (product?.id) {
      await trackClick(product.id, product.google_form_url || '', source);
    }
    if (product?.google_form_url && product?.google_form_status === 'approved') {
      window.open(product.google_form_url, '_blank');
    } else {
      setLeadPopupOpen(true);
    }
  };

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-20 text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const discount = product.discount_percent ?? 0;

  const resolvedPricingValue = safeParsePricingValue(product?.pricing_value);
  const resolvedPricingUnit = safeParsePricingUnit(product?.pricing_unit);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">

        {/* === Step 1: Product Overview === */}
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-start gap-6">
              {product.logo_url ? (
                <img src={product.logo_url} alt="" className="h-20 w-20 rounded-xl object-contain bg-muted p-2" />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-primary/10 text-2xl font-bold text-primary">
                  {product.company_name.charAt(0)}
                </div>
              )}
              <div className="flex-1">
                <h1 className="text-3xl font-bold font-[Plus_Jakarta_Sans]">{product.company_name}</h1>
                {product.subtitle && <p className="text-muted-foreground mt-1">{product.subtitle}</p>}
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Star className="h-5 w-5 fill-warning text-warning" />
                    <span className="font-bold text-lg">{avgRating.toFixed(1)}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">({reviews.length} reviews)</span>
                  {resolvedPricingValue !== null && (
                    <Badge variant="outline" className="ml-2">
                      Starting {product.currency || '₹'}{resolvedPricingValue.toLocaleString()}{resolvedPricingUnit}
                    </Badge>
                  )}
                </div>
                <p className="mt-3 text-foreground">{product.description}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              {product.free_trial_link && (
                <Button size="lg" className="bg-primary text-primary-foreground" onClick={() => openLeadForm('Try For Free')}>
                  <Play className="mr-2 h-4 w-4" /> Try For Free
                </Button>
              )}
              <Button size="lg" variant="outline" onClick={() => openLeadForm('Get Quote')}>
                <FileText className="mr-2 h-4 w-4" /> Get Quote
              </Button>
              <Button size="lg" variant="outline" onClick={() => openLeadForm('Call Now')}>
                <Phone className="mr-2 h-4 w-4" /> Call Now
              </Button>
            </div>
          </div>

          {/* Sidebar Pricing & Actions */}
          <div className="space-y-4">
            <Card className="sticky top-24">
              <CardContent className="p-6 space-y-5">
                {/* Pricing */}
                <div>
                  {resolvedPricingValue !== null ? (
                    <div>
                      <p className="text-sm text-muted-foreground">Starting at</p>
                      <div className="flex items-baseline gap-2 mt-1">
                        <p className="text-3xl font-bold text-foreground">
                          {product.currency || '₹'}{resolvedPricingValue.toLocaleString()}
                        </p>
                      </div>
                      <span className="text-sm text-muted-foreground">{resolvedPricingUnit}</span>
                      {discount > 0 && <Badge className="ml-2 bg-success/20 text-success border-0">Save {discount}%</Badge>}
                    </div>
                  ) : (
                    <div className="text-center py-2">
                      <p className="text-2xl font-bold text-primary">Price on Request</p>
                      <span className="text-sm text-muted-foreground">Contact us for pricing</span>
                    </div>
                  )}
                </div>

                {/* Offers */}
                {discount > 0 && (
                  <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
                    <p className="text-sm font-semibold text-foreground">Save Extra with Offers</p>
                    <p className="text-xs text-muted-foreground">Save upto {discount}%, Get GST Invoice on your business purchase</p>
                  </div>
                )}

                {/* Primary CTA Buttons */}
                <div className="space-y-2.5">
                  <Button 
                    className="w-full bg-[hsl(var(--warning))] text-[hsl(var(--warning-foreground))] hover:bg-[hsl(var(--warning))]/90 font-bold" 
                    size="lg" 
                    onClick={() => openLeadForm('Get Free Demo')}
                  >
                    <Play className="mr-2 h-4 w-4" /> Get Free Demo
                  </Button>
                  <Button 
                    className="w-full" 
                    variant="outline" 
                    size="lg" 
                    onClick={() => openLeadForm('Get Quote')}
                  >
                    <FileText className="mr-2 h-4 w-4" /> Get Quote
                  </Button>
                </div>

                {/* Trust Indicators */}
                <div className="space-y-3 pt-2 border-t border-border">
                  <button 
                    onClick={() => openLeadForm('Get Instant Expert Advice')}
                    className="flex items-center gap-3 w-full text-left group"
                  >
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Phone className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">Get Instant Expert Advice</span>
                  </button>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
                      <ShieldCheck className="h-4 w-4 text-success" />
                    </div>
                    <span className="text-sm font-medium text-foreground">Safe & Secure Payment</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-warning/10 flex items-center justify-center flex-shrink-0">
                      <BadgeCheck className="h-4 w-4 text-warning" />
                    </div>
                    <span className="text-sm font-medium text-foreground">Assured Best Price Guaranteed</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>


        {/* === Features === */}
        {features.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold font-[Plus_Jakarta_Sans] mb-6">Key Features</h2>
            <Card>
              <CardContent className="p-6">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {features.map((f) => (
                    <div key={f.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                      <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                      <span className="text-sm font-medium">{f.feature_text}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Integrations */}
        {integrations.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold font-[Plus_Jakarta_Sans] mb-4">Integrations</h2>
            <div className="flex flex-wrap gap-2">
              {integrations.map((i) => (
                <span key={i.id} className="rounded-full border border-border px-4 py-1.5 text-sm font-medium">{i.integration_name}</span>
              ))}
            </div>
          </div>
        )}

        {/* === Pricing Plans === */}
        {pricingPlans.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold font-[Plus_Jakarta_Sans] mb-6">Pricing Plans</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {pricingPlans.map((plan: any) => (
                <Card key={plan.id} className={`relative overflow-hidden transition-all hover:shadow-lg ${plan.is_popular ? 'border-primary ring-2 ring-primary/20' : ''}`}>
                  {plan.is_popular && (
                    <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-bold rounded-bl-lg flex items-center gap-1">
                      <Crown className="h-3 w-3" /> Popular
                    </div>
                  )}
                  <CardContent className="p-5 space-y-4">
                    <div>
                      <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
                      <div className="mt-2 flex items-baseline gap-1">
                        <span className="text-3xl font-extrabold text-foreground">{plan.currency}{plan.price?.toLocaleString()}</span>
                        <span className="text-sm text-muted-foreground">{plan.billing_period}</span>
                      </div>
                    </div>
                    {plan.features?.length > 0 && (
                      <ul className="space-y-2">
                        {plan.features.map((f: any) => (
                          <li key={f.id} className="flex items-start gap-2 text-sm">
                            <CheckCircle2 className={`h-4 w-4 mt-0.5 flex-shrink-0 ${f.is_included !== false ? 'text-success' : 'text-muted'}`} />
                            <span className={f.is_included !== false ? 'text-foreground' : 'text-muted-foreground line-through'}>{f.feature_text}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    <Button
                      className={`w-full ${plan.is_popular ? 'bg-primary text-primary-foreground' : ''}`}
                      variant={plan.is_popular ? 'default' : 'outline'}
                      onClick={() => {
                        if (!user) { navigate(`/auth?redirect=${encodeURIComponent(window.location.pathname)}`); return; }
                        handleRazorpayPayment(plan);
                      }}
                    >
                      Buy Now
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* === Ratings & Reviews === */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold font-[Plus_Jakarta_Sans] mb-6">Ratings & Reviews</h2>
          <div className="mb-6 grid gap-4 sm:grid-cols-2">
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-4xl font-bold">{avgRating.toFixed(1)}</p>
                <div className="mt-1 flex items-center justify-center gap-1">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} className={`h-4 w-4 ${s <= Math.round(avgRating) ? 'fill-warning text-warning' : 'text-muted'}`} />
                  ))}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{reviews.length} reviews</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="space-y-2 p-6">
                {ratingBreakdown.map(rb => (
                  <div key={rb.star} className="flex items-center gap-2">
                    <span className="w-4 text-sm">{rb.star}</span>
                    <Star className="h-3 w-3 fill-warning text-warning" />
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-warning" style={{ width: `${rb.percent}%` }} />
                    </div>
                    <span className="w-6 text-right text-xs text-muted-foreground">{rb.count}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {user && role === 'user' && (
            <Card className="mb-6">
              <CardContent className="p-6">
                <h4 className="mb-3 font-semibold">Write a Review</h4>
                <div className="mb-3 flex gap-1">
                  {[1, 2, 3, 4, 5].map(s => (
                    <button key={s} onClick={() => setRating(s)}>
                      <Star className={`h-6 w-6 cursor-pointer transition ${s <= rating ? 'fill-warning text-warning' : 'text-muted hover:text-warning/60'}`} />
                    </button>
                  ))}
                </div>
                <Textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)} placeholder="Share your experience..." rows={3} />
                <Button className="mt-3" onClick={submitReview} disabled={submitting || rating === 0}>
                  {submitting ? 'Submitting...' : 'Submit Review'}
                </Button>
              </CardContent>
            </Card>
          )}

          <div className="space-y-3">
            {reviews.map((r) => (
              <Card key={r.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} className={`h-3 w-3 ${s <= r.rating ? 'fill-warning text-warning' : 'text-muted'}`} />
                    ))}
                  </div>
                  <p className="text-sm">{r.review_text}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <LeadFormPopup
        open={leadPopupOpen}
        onOpenChange={setLeadPopupOpen}
        productId={product.id}
        productName={product.company_name}
        sourceButton={leadSource}
        googleFormUrl={product.google_form_url && product.google_form_status === 'approved' ? product.google_form_url : null}
      />

      <Footer />
    </div>
  );
};

export default ProductDetail;
