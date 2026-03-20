import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface HeroBanner {
  id: string;
  image_url: string;
  title: string | null;
  subtitle: string | null;
  link_url: string | null;
}

const BannerSlide = ({ banner }: { banner: HeroBanner }) => (
  <div className="relative w-full overflow-hidden bg-card">
    <div className="relative w-full h-[50vh] md:h-[60vh] lg:h-[65vh]">
      {banner.link_url ? (
        <a href={banner.link_url} target="_blank" rel="noopener noreferrer" className="block h-full w-full">
          <img src={banner.image_url} alt={banner.title || 'Banner'} className="h-full w-full object-cover object-[50%_40%] transition-transform duration-700 group-hover:scale-105" />
        </a>
      ) : (
        <img src={banner.image_url} alt={banner.title || 'Banner'} className="h-full w-full object-cover object-[50%_40%] transition-transform duration-700 group-hover:scale-105" />
      )}
    </div>
  </div>
);

const HeroSection = () => {
  const [banners, setBanners] = useState<HeroBanner[]>([]);
  const [api, setApi] = useState<CarouselApi>();
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  useEffect(() => {
    const fetchBanners = async () => {
      const { data } = await supabase
        .from('hero_banners' as any)
        .select('*')
        .eq('is_visible', true)
        .order('display_order');
      setBanners((data as any[]) ?? []);
    };
    fetchBanners();
  }, []);

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

  if (!banners || banners.length === 0) {
    return null;
  }

  if (banners.length === 1) {
    return (
      <section className="w-full min-h-[60vh]">
        <BannerSlide banner={banners[0]} />
      </section>
    );
  }

  return (
    <section className="w-full min-h-[60vh]">
      <Carousel
        opts={{ loop: true, align: 'start' }}
        plugins={[Autoplay({ delay: 4000, stopOnInteraction: true })]}
        className="w-full"
        setApi={setApi}
      >
        <CarouselContent>
          {banners.map((banner) => (
            <CarouselItem key={banner.id} className="basis-full">
              <BannerSlide banner={banner} />
            </CarouselItem>
          ))}
        </CarouselContent>
        {canScrollPrev && (
          <button
            type="button"
            onClick={() => api?.scrollPrev()}
            className="absolute left-4 top-1/2 z-10 -translate-y-1/2 p-0 text-white"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-8 w-8 stroke-[2.5]" />
          </button>
        )}
        {canScrollNext && (
          <button
            type="button"
            onClick={() => api?.scrollNext()}
            className="absolute right-4 top-1/2 z-10 -translate-y-1/2 p-0 text-white"
            aria-label="Next slide"
          >
            <ChevronRight className="h-8 w-8 stroke-[2.5]" />
          </button>
        )}
      </Carousel>
    </section>
  );
};

export default HeroSection;
