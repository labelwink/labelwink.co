'use client';

import { useState, useEffect } from 'react';
import { ProductImage } from '@/components/storefront/ProductImage';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Banner {
  id: string;
  title: string;
  cloudinary_public_id: string;
  subheadline?: string;
  badge?: string;
  cta_text?: string;
  cta_link?: string;
}

interface HeroProps {
  banners: Banner[];
}

export function Hero({ banners }: HeroProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const displayBanners = banners.length > 0 ? banners : [
    {
      id: 'default',
      title: 'Better Together',
      subheadline: 'From coffee dates to weekend getaways — your perfect pair starts with what you wear',
      badge: 'NEW COLLECTION 2026',
      cloudinary_public_id: 'labelwink/banners/hero_default',
    }
  ];

  useEffect(() => {
    if (displayBanners.length <= 1) return;
    const t = setInterval(() => setCurrentIndex(p => (p + 1) % displayBanners.length), 5000);
    return () => clearInterval(t);
  }, [displayBanners.length]);

  const current = displayBanners[currentIndex];

  return (
    <section className="relative w-full h-[60vh] md:h-[85vh] min-h-[480px] overflow-hidden bg-[#1a3a34]">
      {/* Slides */}
      {displayBanners.map((slide, i) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-700 ${i === currentIndex ? 'opacity-100' : 'opacity-0'}`}
        >
          <ProductImage
            publicId={slide.cloudinary_public_id}
            alt={slide.title}
            width={1920}
            height={1080}
            className="w-full h-full object-cover object-top"
            priority={i === 0}
            quality="auto:best"
            sizes="100vw"
          />
          {/* Subtle dark overlay for text legibility */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/10 to-transparent" />
        </div>
      ))}

      {/* Editorial text — bottom-left */}
      <div className="absolute bottom-10 left-6 md:left-14 z-10 text-white max-w-xs md:max-w-md">
        {current.badge && (
          <span className="block text-[10px] md:text-xs tracking-[0.3em] mb-2 md:mb-3 text-[#c9a84c] font-medium">
            {current.badge}
          </span>
        )}
        <h1 className="font-serif text-3xl md:text-5xl leading-tight mb-2">
          {current.title}
        </h1>
        {current.subheadline && (
          <p className="text-xs md:text-sm text-white/75 leading-relaxed">
            {current.subheadline}
          </p>
        )}
      </div>

      {/* Prev / Next arrows (multi-slide only) */}
      {displayBanners.length > 1 && (
        <>
          <button
            onClick={() => setCurrentIndex(p => (p - 1 + displayBanners.length) % displayBanners.length)}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full border border-white/30 text-white hover:bg-white hover:text-[#1a3a34] transition-all z-20 hidden md:flex"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setCurrentIndex(p => (p + 1) % displayBanners.length)}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full border border-white/30 text-white hover:bg-white hover:text-[#1a3a34] transition-all z-20 hidden md:flex"
            aria-label="Next slide"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {displayBanners.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`h-2 rounded-full transition-all duration-300 ${i === currentIndex ? 'bg-white w-6' : 'bg-white/40 w-2'}`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
