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

  const displayed = products.slice(0, 3);
  const popupColors = [
    'bg-gradient-to-br from-[#3648b2] via-[#6b4fc2] to-[#a486f1]',
    'bg-gradient-to-br from-[#5b6be5] via-[#8b5cf6] to-[#a78bfa]',
    'bg-gradient-to-br from-[#4c1d95] via-[#7c3aed] to-[#c084fc]',
  ];

  return (
    <section
      className="w-full py-10"
      style={{ backgroundImage: 'var(--gradient-background)', backgroundAttachment: 'fixed' }}
    >
      <div className="w-full">
        {/* Section Ads */}
        {showInlineAds && <SectionAds categoryId={categoryId} />}

        {/* Cards section without white container */}
        <div className="mt-6 rounded-3xl px-0 py-1">
          {/* Header */}
          <div className="mb-6 flex w-full items-center justify-between rounded-none bg-white px-4 sm:px-6 lg:px-8 py-6 sm:py-9">
            <div className="flex items-center gap-2">
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold font-[Plus_Jakarta_Sans] text-foreground">
                {categoryName}
              </h3>
            </div>
            <Link to={`/software?category=${categoryId}`}>
              <Button variant="outline" className="h-10 rounded-xl border border-border bg-white px-5 text-sm font-medium text-foreground shadow-[0_4px_10px_rgba(15,23,42,0.06)] transition-colors hover:border-[#4027bf] hover:bg-[#4027bf] hover:text-white">
                See All
              </Button>
            </Link>
          </div>

          <div className="px-4 sm:px-6 lg:px-8 flex justify-center">
            <div className="grid gap-4 sm:gap-6 lg:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 w-full max-w-7xl">
              {displayed.map((p, index) => (
                <ProductCard key={p.id} {...p} popupBackgroundClass={popupColors[index % popupColors.length]} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CategorySection;
