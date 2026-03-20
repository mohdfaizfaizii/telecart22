import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SectionAd {
  id: string;
  image_url: string;
  link_url: string | null;
  alt_text: string | null;
  ad_type: string;
}

interface SectionAdsProps {
  categoryId: string;
  adType?: 'ad-2-grid' | 'ad-3-grid';
}

const AdImage = ({ ad }: { ad: SectionAd }) => {
  const img = (
    <img
      src={ad.image_url}
      alt={ad.alt_text || 'Ad'}
      className="w-full h-40 sm:h-48 object-cover"
    />
  );

  return (
    <div className="overflow-hidden border border-border shadow-sm transition-shadow bg-card">
      {ad.link_url ? (
        <a href={ad.link_url} target="_blank" rel="noopener noreferrer" className="block">
          {img}
        </a>
      ) : img}
    </div>
  );
};

const ResponsiveAdsCarousel = ({ adList, gridCols }: { adList: SectionAd[]; gridCols: number }) => {
  const [api, setApi] = useState<CarouselApi>();
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  useEffect(() => {
    if (!api) return;

    const updateButtons = () => {
      setCanScrollPrev(api.canScrollPrev());
      setCanScrollNext(api.canScrollNext());
    };

    updateButtons();
    api.on('select', updateButtons);
    api.on('reInit', updateButtons);

    return () => {
      api.off('select', updateButtons);
    };
  }, [api]);

  return (
    <Carousel
      opts={{ loop: true, align: 'start' }}
      plugins={[Autoplay({ delay: 5000, stopOnInteraction: true })]}
      className="w-full"
      setApi={setApi}
    >
      <CarouselContent>
        {adList.map((ad) => (
          <CarouselItem
            key={ad.id}
            className={gridCols === 3 ? 'basis-1/2 sm:basis-1/2 lg:basis-1/3' : 'basis-full sm:basis-1/2'}
          >
            <AdImage ad={ad} />
          </CarouselItem>
        ))}
      </CarouselContent>

      {canScrollPrev && (
        <button
          type="button"
          onClick={() => api?.scrollPrev()}
          className="absolute left-3 top-1/2 z-10 -translate-y-1/2 p-0 text-[#0f766e]"
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-6 w-6 stroke-[2.5]" />
        </button>
      )}

      {canScrollNext && (
        <button
          type="button"
          onClick={() => api?.scrollNext()}
          className="absolute right-3 top-1/2 z-10 -translate-y-1/2 p-0 text-[#0f766e]"
          aria-label="Next slide"
        >
          <ChevronRight className="h-6 w-6 stroke-[2.5]" />
        </button>
      )}
    </Carousel>
  );
};

const SectionAds = ({ categoryId, adType }: SectionAdsProps) => {
  const [ads, setAds] = useState<SectionAd[]>([]);

  useEffect(() => {
    const fetchAds = async () => {
      const { data } = await supabase
        .from('section_ads' as any)
        .select('*')
        .eq('category_id', categoryId)
        .eq('is_visible', true)
        .order('display_order');
      setAds((data as any[]) ?? []);
    };
    fetchAds();
  }, [categoryId]);

  if (ads.length === 0) return null;

  const threeGridAds = ads.filter(a => a.ad_type === '3-grid');
  const twoGridAds = ads.filter(a => a.ad_type === '2-grid');

  // Optional outer adType restricts what this component renders (if within a section entry)
  const showThree = !adType || adType === 'ad-3-grid';
  const showTwo = !adType || adType === 'ad-2-grid';

  const renderAdsWithSlider = (adList: SectionAd[], gridCols: number) => {
    if (adList.length === 1) {
      return (
        <div className="grid grid-cols-1 gap-4">
          {adList.map((ad) => (
            <AdImage key={ad.id} ad={ad} />
          ))}
        </div>
      );
    }

    return <ResponsiveAdsCarousel adList={adList} gridCols={gridCols} />;
  };

  return (
    <div className="space-y-4 mb-6">
      {showThree && threeGridAds.length > 0 && renderAdsWithSlider(threeGridAds, 3)}
      {showTwo && twoGridAds.length > 0 && renderAdsWithSlider(twoGridAds, 2)}
      {!showThree && !showTwo && <p className="text-muted-foreground">No ads for this section type</p>}
    </div>
  );
};

export default SectionAds;
