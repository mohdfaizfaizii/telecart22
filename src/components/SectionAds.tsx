import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SectionAd {
  id: string;
  image_url: string;
  link_url: string | null;
  alt_text: string | null;
  ad_type: string;
}

const getSectionAdKey = (ad: SectionAd & { category_id?: string | null }) =>
  `${ad.category_id ?? ''}|${ad.ad_type}|${ad.image_url}|${ad.link_url ?? ''}|${ad.alt_text ?? ''}`;

interface SectionAdsProps {
  categoryId: string;
  adType?: 'ad-2-grid' | 'ad-3-grid';
}

const AdImage = ({ ad }: { ad: SectionAd }) => {
  const img = (
    <img
      src={ad.image_url}
      alt={ad.alt_text || 'Ad'}
      className="w-full h-[6cm] object-cover"
    />
  );

  return (
    <div className="overflow-hidden border border-border shadow-sm bg-white rounded-2xl">
      {ad.link_url ? (
        <a href={ad.link_url} target="_blank" rel="noopener noreferrer" className="block">
          {img}
        </a>
      ) : (
        img
      )}
    </div>
  );
};

const ResponsiveAdsCarousel = ({
  adList,
  gridCols,
}: {
  adList: SectionAd[];
  gridCols: number;
}) => {
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

  const carouselOpts = {
    loop: adList.length > gridCols,
    align: 'start',
    containScroll: 'keepSnaps', // 🔥 FIXED
    dragFree: false,
    skipSnaps: false,
  };

  return (
    <div className="w-full max-w-[1200px] mx-auto overflow-hidden">
      <Carousel
        opts={carouselOpts}
        plugins={[Autoplay({ delay: 5000, stopOnInteraction: true })]}
        className="w-full overflow-hidden"
        setApi={setApi}
      >
        <CarouselContent className="ml-0">
          {adList.map((ad) => (
            <CarouselItem
              key={ad.id}
              className={
                gridCols === 3
                  ? 'basis-[100%] sm:basis-[50%] md:basis-[33.333333%] px-2'
                  : 'basis-[100%] sm:basis-[50%] px-2'
              }
            >
              <AdImage ad={ad} />
            </CarouselItem>
          ))}
        </CarouselContent>

        {canScrollPrev && (
          <button
            type="button"
            onClick={() => api?.scrollPrev()}
            className="absolute left-2 top-1/2 z-10 -translate-y-1/2 p-1 text-[#0f766e]"
          >
            <ChevronLeft className="h-6 w-6 stroke-[2.5]" />
          </button>
        )}

        {canScrollNext && (
          <button
            type="button"
            onClick={() => api?.scrollNext()}
            className="absolute right-2 top-1/2 z-10 -translate-y-1/2 p-1 text-[#0f766e]"
          >
            <ChevronRight className="h-6 w-6 stroke-[2.5]" />
          </button>
        )}
      </Carousel>
    </div>
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

      const uniqueAds = ((data as any[]) ?? []).filter((ad, index, list) => {
        const currentKey = getSectionAdKey(ad);
        return index === list.findIndex((item) => getSectionAdKey(item) === currentKey);
      });

      setAds(uniqueAds);
    };

    fetchAds();
  }, [categoryId]);

  if (ads.length === 0) return null;

  const threeGridAds = ads.filter((a) => a.ad_type === '3-grid');
  const twoGridAds = ads.filter((a) => a.ad_type === '2-grid');

  const showThree = !adType || adType === 'ad-3-grid';
  const showTwo = !adType || adType === 'ad-2-grid';

  const renderAdsWithSlider = (adList: SectionAd[], gridCols: number) => {
    if (adList.length === 1) {
      return (
        <div className="mx-auto w-full max-w-[1200px]">
          <AdImage ad={adList[0]} />
        </div>
      );
    }

    return <ResponsiveAdsCarousel adList={adList} gridCols={gridCols} />;
  };

  return (
    <div className="space-y-4 mb-6">
      {showThree && threeGridAds.length > 0 && renderAdsWithSlider(threeGridAds, 3)}
      {showTwo && twoGridAds.length > 0 && renderAdsWithSlider(twoGridAds, 2)}
    </div>
  );
};

export default SectionAds;
