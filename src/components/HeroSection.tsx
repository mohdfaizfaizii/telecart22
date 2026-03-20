import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';

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
      >
        <CarouselContent>
          {banners.map((banner) => (
            <CarouselItem key={banner.id} className="basis-full">
              <BannerSlide banner={banner} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-0 h-24 w-14 translate-y-[-50%] rounded-r-xl border-0 bg-white/35 text-slate-700 shadow-none backdrop-blur-sm hover:bg-white/50 hover:text-slate-900" />
        <CarouselNext className="right-0 h-24 w-14 translate-y-[-50%] rounded-l-xl border-0 bg-white/35 text-slate-700 shadow-none backdrop-blur-sm hover:bg-white/50 hover:text-slate-900" />
      </Carousel>
    </section>
  );
};

export default HeroSection;
