import { useState, useEffect, useRef } from 'react';
import { Star, ChevronRight, X, MoreHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTrackActivity } from '@/hooks/use-track-activity';
import { useAuth } from '@/lib/auth-context';
import LeadFormPopup from '@/components/LeadFormPopup';

export interface ProductCardProps {
  id: string;
  companyName: string;
  subtitle?: string | null;
  description: string;
  logoUrl?: string | null;
  showFreeTrial?: boolean;
  pricingValue?: number | null;
  currency?: string | null;
  pricingUnit?: string | null;
  ctaText?: string | null;
  ctaLink?: string | null;
  discountPercent?: number | null;
  freeTrialLink?: string | null;
  freeTrialText?: string | null;
  requestDemoLink?: string | null;
  websiteUrl?: string | null;
  googleFormUrl?: string | null;
  googleFormStatus?: string | null;
  rating?: number;
  isSponsored?: boolean;
  categoryLabel?: string | null;
  features?: string[];
  integrations?: string[];
  banners?: { text: string; subtext?: string; label?: string; url?: string; bgColor?: string }[];
  links?: { text: string; url: string; isHighlighted?: boolean }[];
  priceOnRequest?: boolean;
  showPricing?: boolean;
  popupBackgroundClass?: string;
}

const ProductCard = ({
  id, companyName, subtitle, description, logoUrl,
  pricingValue, currency, pricingUnit,
  ctaText, ctaLink,
  discountPercent,
  freeTrialLink, requestDemoLink, websiteUrl,
  googleFormUrl, googleFormStatus,
  rating = 0, isSponsored, categoryLabel,
  features = [], integrations = [],
  banners = [], links = [],
  priceOnRequest, showPricing = true,
  popupBackgroundClass,
}: ProductCardProps) => {
  const [showWhatsNext, setShowWhatsNext] = useState(false);
  const [leadPopupOpen, setLeadPopupOpen] = useState(false);
  const [leadSource, setLeadSource] = useState('');
  const { trackView, trackClick } = useTrackActivity();
  const { user } = useAuth();
  const navigate = useNavigate();
  const tracked = useRef(false);

  useEffect(() => {
    if (!tracked.current && id) {
      tracked.current = true;
      trackView(id);
    }
  }, [id, trackView]);

  const handleCardClick = () => {
    if (showWhatsNext) return;
    if (!user) {
      navigate(`/auth?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }
    navigate(`/product/${id}`);
  };

  const openLeadForm = (text: string) => {
    if (googleFormUrl && googleFormStatus === 'approved') {
      window.open(googleFormUrl, '_blank');
    } else {
      setLeadSource(text);
      setLeadPopupOpen(true);
    }
  };

  const guardClick = (e: React.MouseEvent, url: string, text: string) => {
    if (!user) {
      e.preventDefault();
      e.stopPropagation();
      navigate(`/auth?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }
    trackClick(id, url, text);
    
    const quoteActions = ['request a quote', 'get free advice', 'apply startup offer', 'request demo', 'get quote'];
    const isQuoteAction = quoteActions.some(q => text.toLowerCase().includes(q.toLowerCase()));
    
    if (isQuoteAction) {
      e.preventDefault();
      openLeadForm(text);
    }
  };

  const parsePricingUnit = (unit: any) => {
    if (!unit) return '/user/mo';
    if (typeof unit === 'object') {
      return unit.unit || unit.pricingUnit || unit.value || '/user/mo';
    }
    if (typeof unit === 'string') {
      try {
        const parsed = JSON.parse(unit);
        if (parsed && typeof parsed === 'object') {
          return parsed.unit || parsed.pricingUnit || parsed.value || unit;
        }
      } catch {
        // Not JSON
      }
      return unit;
    }
    return String(unit);
  };

  const parsePricingValue = (value: any) => {
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
        // not JSON
      }
      return null;
    }
    if (typeof value === 'object') {
      if (typeof value.value === 'number') return value.value;
      if (typeof value.price === 'number') return value.price;
    }
    return null;
  };

  const discount = discountPercent ?? 0;

  const defaultWhatsNextItems = [
    { text: 'Start Free Trial', url: freeTrialLink || '#', isHighlighted: false },
    { text: 'Request A Quote', url: '#', isHighlighted: false },
    { text: 'Get Free Advice', url: '#', isHighlighted: false },
    { text: 'Apply Startup Offer', url: '#', isHighlighted: false },
  ];

  const baseWhatsNextItems = links.length > 0 ? links : defaultWhatsNextItems;
  const hasWebsiteItem = baseWhatsNextItems.some((item) => item.text.toLowerCase().includes('website'));
  const whatsNextItems = websiteUrl && !hasWebsiteItem
    ? [{ text: 'Go to Website', url: websiteUrl, isHighlighted: false }, ...baseWhatsNextItems]
    : baseWhatsNextItems;

  const resolvedPricingUnit = parsePricingUnit(pricingUnit);
  const resolvedPricingValue = parsePricingValue(pricingValue);

  const showPrice = showPricing && !priceOnRequest;
  const pricingText = showPrice && resolvedPricingValue !== null
    ? `${currency || '₹'}${resolvedPricingValue.toLocaleString()}`
    : null;

  const showPricingBlock = showPricing && (pricingText || priceOnRequest);
  const resolvedCtaText = ctaText || 'Request Demo';
  const resolvedCtaLink = ctaLink || requestDemoLink || `/product/${id}`;

  return (
    <div className="relative w-full max-w-full">
      {/* Main Card */}
      <div 
        onClick={handleCardClick}
        className={`group relative w-full max-w-full overflow-hidden rounded-2xl border border-transparent bg-white shadow-[0_10px_30px_rgba(15,23,42,0.10)] transition-all duration-500 ease-out ${showWhatsNext ? 'cursor-default' : 'hover:-translate-y-2 hover:scale-[1.035] hover:border-blue-500 hover:shadow-[0_24px_60px_rgba(15,23,42,0.18)] cursor-pointer'}`}
      >
        <div className={showWhatsNext ? 'pointer-events-none' : ''}>
          {/* Header */}
          <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-6 pb-2.5 sm:pb-4">
            {logoUrl ? (
            <div className="flex h-14 w-14 sm:h-20 sm:w-20 flex-shrink-0 items-center justify-center overflow-hidden transition-transform duration-500 ease-out group-hover:scale-110">
              <img src={logoUrl} alt={companyName} className="h-full w-full object-contain" />
            </div>
          ) : (
            <div className="h-14 w-14 sm:h-20 sm:w-20 flex-shrink-0 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center transition-transform duration-500 ease-out group-hover:scale-110">
              <span className="text-lg sm:text-2xl font-bold text-primary-foreground">{companyName.charAt(0)}</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-lg sm:text-2xl font-bold text-foreground truncate transition-colors duration-300 group-hover:text-[#4027bf]">{companyName}</h3>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!user) { navigate(`/auth?redirect=${encodeURIComponent(window.location.pathname)}`); return; }
                  setShowWhatsNext(true);
                }}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[#4a2dd8] bg-white text-[#4a2dd8] shadow-sm flex-shrink-0"
                aria-label="More options"
              >
                <div className="flex flex-col gap-0.5">
                  <div className="w-1 h-1 bg-current rounded-full"></div>
                  <div className="w-1 h-1 bg-current rounded-full"></div>
                  <div className="w-1 h-1 bg-current rounded-full"></div>
                </div>
              </button>
            </div>
            {subtitle && <p className="text-xs sm:text-sm text-muted-foreground mt-2 px-2 py-1 bg-gray-100 rounded-md inline-block">{subtitle}</p>}
          </div>
        </div>

        {/* Description */}
        <div className="px-3 sm:px-6">
          <p className="text-sm sm:text-base text-foreground leading-snug line-clamp-2 transition-colors duration-300 group-hover:text-foreground/90">{description}</p>
        </div>


        {/* Pricing Row */}
        {showPricingBlock && (
          <div className="mx-3 sm:mx-6 mt-4 rounded-xl border border-[#d9dee7] bg-[#f3f4f6] px-3 py-3">
            {showPricingBlock && (
              <div>
                {priceOnRequest ? (
                  <p className="text-lg sm:text-xl font-semibold text-primary">STARTING AT Price on Request</p>
                ) : (
                  <p className="text-lg sm:text-2xl font-semibold text-[#4027bf] whitespace-nowrap">
                    <span className="mr-1 text-xs sm:text-sm font-medium uppercase text-muted-foreground">STARTING AT</span>
                    {pricingText}<span>{resolvedPricingUnit}</span>
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* CTA Button and Ratings */}
        <div className="mt-5 flex min-w-0 flex-wrap items-center justify-between gap-3 px-3 sm:px-6 pb-7">
          <div className="flex min-w-0 items-center gap-1 px-3 py-2 bg-white rounded-xl border border-[#4a2dd8]">
            <Star className="h-4 w-4 fill-[#f5b301] text-[#f5b301]" />
            <span className="text-sm font-bold text-foreground">{rating.toFixed(1)}</span>
          </div>
          <a
            href={resolvedCtaLink}
            target={resolvedCtaLink.startsWith('http') ? '_blank' : undefined}
            rel={resolvedCtaLink.startsWith('http') ? 'noopener noreferrer' : undefined}
            onClick={(e) => guardClick(e, resolvedCtaLink, resolvedCtaText)}
            className="inline-flex min-w-0 w-full justify-center gap-2 rounded-xl border border-[#4a2dd8] bg-white px-3 py-2 text-sm font-bold text-[#4a2dd8] transition-all shadow-[0_4px_10px_rgba(74,45,216,0.30)] active:scale-[0.98] active:shadow-[0_2px_6px_rgba(74,45,216,0.35)] sm:px-6 sm:w-auto"
          >
            {resolvedCtaText}
            <ChevronRight className="h-4 w-4" />
          </a>
        </div>
      </div>

        {/* What's Next Slide Panel */}
        <AnimatePresence>
          {showWhatsNext && (
            <>
              <div className="fixed inset-0 z-10" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowWhatsNext(false); }} />
              <motion.div
                initial={{ opacity: 0, y: 24, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 24, scale: 0.97 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className={`absolute bottom-0 left-2 right-2 z-20 mx-auto w-auto max-w-[360px] min-w-0 origin-bottom-center rounded-3xl border border-white/20 ${popupBackgroundClass || 'bg-gradient-to-br from-[#3648b2] via-[#6b4fc2] to-[#a486f1]'} shadow-[0_-10px_40px_rgba(0,0,0,0.18)] flex h-auto max-h-[calc(100vh-2.5rem)] flex-col overflow-hidden text-white`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-start gap-3 p-4 border-b border-white/30 bg-white/10">
                  <h4 className="text-base font-bold text-white">{companyName}</h4>
                </div>
                <div className="flex-1 min-h-0 overflow-y-auto py-2">
                  {whatsNextItems.map((item, i) => (
                    <button
                      key={i}
                      type="button"
                      className="flex w-full items-center gap-3 px-5 py-3.5 text-sm font-medium text-white transition-colors hover:bg-white/10 border-b border-white/20 last:border-0 text-left"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowWhatsNext(false);
                        if (!user) {
                          navigate(`/auth?redirect=${encodeURIComponent(window.location.pathname)}`);
                          return;
                        }
                        trackClick(id, item.url, item.text);
                        const quoteActions = ['request a quote', 'get free advice', 'apply startup offer', 'request demo', 'get quote'];
                        const isQuoteAction = quoteActions.some(q => item.text.toLowerCase().includes(q.toLowerCase()));
                        if (isQuoteAction) {
                          openLeadForm(item.text);
                        } else if (item.url.startsWith('http')) {
                          window.open(item.url, '_blank');
                        } else {
                          openLeadForm(item.text);
                        }
                      }}
                    >
                      <span className="text-white text-lg leading-none">›</span>
                      <span className={`${item.isHighlighted ? 'font-bold text-yellow-200' : ''} break-words`}>{item.text}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Lead Form Popup */}
      <LeadFormPopup
        open={leadPopupOpen}
        onOpenChange={setLeadPopupOpen}
        productId={id}
        productName={companyName}
        sourceButton={leadSource}
      />
    </div>
  );
};

export default ProductCard;
