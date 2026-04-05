import ProductCard, { type ProductCardProps } from './ProductCard';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import SectionAds from './SectionAds';

const safeParsePricingValue = (value: any) => {
  if (value == null) return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const num = Number(value);
    if (!Number.isNaN(num)) return num;
    try { const parsed = JSON.parse(value); if (parsed && typeof parsed === 'object' && typeof parsed.value === 'number') return parsed.value; } catch {}
    return null;
  }
  if (typeof value === 'object') {
    if (typeof value.value === 'number') return value.value;
    if (typeof value.price === 'number') return value.price;
  }
  return null;
};

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

interface CategorySectionProps {
  categoryName: string;
  categoryId: string;
  products: ProductCardProps[];
  showInlineAds?: boolean;
}

const CategorySection = ({ categoryName, categoryId, products, showInlineAds = true }: CategorySectionProps) => {
  // products sliced in return below
  const firstProduct = products[0];
  const firstPricingValue = safeParsePricingValue(firstProduct?.pricingValue);
  const firstPricingUnit = safeParsePricingUnit(firstProduct?.pricingUnit);
  const startingPrice = firstPricingValue !== null
    ? `${firstProduct.currency || '₹'}${firstPricingValue.toLocaleString()}${firstPricingUnit}`
    : null;

  const displayed = products.slice(0, 4);

  return (
    <section className="py-10 bg-muted/50 w-full">
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Ads */}
        {showInlineAds && <SectionAds categoryId={categoryId} />}

        {/* Cards section without white container */}
        <div className="mt-6">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <h3 className="text-2xl md:text-3xl font-bold font-[Plus_Jakarta_Sans] text-foreground">
                {categoryName}
              </h3>
            </div>
            <Link to={`/software?category=${categoryId}`}>
              <Button variant="link" className="text-[#5f259f] font-semibold text-sm">
                See all cards →
              </Button>
            </Link>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {displayed.map((p) => (
              <ProductCard key={p.id} {...p} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CategorySection;
