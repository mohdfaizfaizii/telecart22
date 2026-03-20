import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';

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
    const perSlide = gridCols;
    if (adList.length <= perSlide) {
      return (
        <div className={`grid grid-cols-1 ${gridCols === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-4`}>
          {adList.map((ad) => (
            <AdImage key={ad.id} ad={ad} />
          ))}
        </div>
      );
    }

    // Make slides full by wrapping from the start when the list doesn't divide evenly.
    const remainder = adList.length % perSlide;
    const normalizedAds = remainder === 0
      ? adList
      : [...adList, ...adList.slice(0, perSlide - remainder)];

    const slides: SectionAd[][] = [];
    for (let i = 0; i < normalizedAds.length; i += perSlide) {
      slides.push(normalizedAds.slice(i, i + perSlide));
    }

    return (
      <Carousel
        opts={{ loop: true, align: 'start' }}
        plugins={[Autoplay({ delay: 5000, stopOnInteraction: true })]}
        className="w-full"
      >
        <CarouselContent>
          {slides.map((slide, idx) => (
            <CarouselItem key={idx} className="basis-full">
              <div className={`grid grid-cols-1 ${gridCols === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-4`}>
                {slide.map((ad) => (
                  <AdImage key={ad.id} ad={ad} />
                ))}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-2 bg-white/80 hover:bg-white border-0 shadow-lg" />
        <CarouselNext className="right-2 bg-white/80 hover:bg-white border-0 shadow-lg" />
      </Carousel>
    );
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
