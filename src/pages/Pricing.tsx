import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, X } from 'lucide-react';

interface PricingFeature {
  id: string;
  feature_text: string;
  is_included: boolean;
}

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  billing_period: string;
  is_popular: boolean;
  is_enabled: boolean;
  features: PricingFeature[];
}

const Pricing = () => {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      const { data: plansData } = await supabase
        .from('pricing_plans' as any)
        .select('*')
        .eq('is_enabled', true)
        .order('display_order');

      // Filter to only show approved plans on public page
      const approvedPlans = (plansData ?? []).filter((p: any) => !p.status || p.status === 'approved');

      const { data: featuresData } = await supabase
        .from('pricing_features' as any)
        .select('*')
        .order('display_order');

      const enriched: PricingPlan[] = (approvedPlans).map((p: any) => ({
        ...p,
        features: (featuresData ?? []).filter((f: any) => f.plan_id === p.id),
      }));

      setPlans(enriched);
      setLoading(false);
    };
    fetchPlans();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="py-20 text-center text-muted-foreground">Loading pricing...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold font-[Plus_Jakarta_Sans] mb-3">
            Choose Your Plan
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Find the perfect plan for your business. All plans include core features with additional capabilities as you scale.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative flex flex-col ${
                plan.is_popular
                  ? 'border-2 border-primary shadow-xl scale-105'
                  : 'border border-border'
              }`}
            >
              {plan.is_popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4">
                  Most Popular
                </Badge>
              )}
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-xl font-[Plus_Jakarta_Sans]">{plan.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-foreground">
                    {plan.currency}{plan.price.toLocaleString()}
                  </span>
                  <span className="text-muted-foreground">{plan.billing_period}</span>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <ul className="space-y-3 flex-1 mb-6">
                  {plan.features.map((f) => (
                    <li key={f.id} className="flex items-start gap-2 text-sm">
                      {f.is_included ? (
                        <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground/40 mt-0.5 flex-shrink-0" />
                      )}
                      <span className={f.is_included ? 'text-foreground' : 'text-muted-foreground line-through'}>
                        {f.feature_text}
                      </span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant={plan.is_popular ? 'default' : 'outline'}
                >
                  Get Started
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {plans.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <p>Pricing plans coming soon!</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Pricing;
