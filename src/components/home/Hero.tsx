'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ProductImage } from '@/components/storefront/ProductImage';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Banner {
  id: string;
  title: string;
  cloudinary_public_id: string;
  cta_text?: string;
  cta_link?: string;
}

interface HeroProps {
  banners: Banner[];
}

export function Hero({ banners }: HeroProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [banners.length]);

  // Fallback if no banners exist
  const displayBanners = banners.length > 0 ? banners : [
    {
      id: 'default',
      title: 'Grace In Every Thread',
      cta_text: 'EXPLORE COLLECTION',
      cta_link: '/collections/all',
      cloudinary_public_id: 'labelwink/banners/hero_default'
    }
  ];

  const currentBanner = displayBanners[currentIndex];

  return (
    <section className="relative h-[85vh] min-h-[600px] w-full flex items-center justify-center overflow-hidden bg-charcoal">
      {/* Background Image with Animation */}
      <div className="absolute inset-0 z-0">
        <div key={currentIndex} className="animate-in fade-in zoom-in duration-1000 h-full w-full">
          <ProductImage 
            publicId={currentBanner.cloudinary_public_id} 
            alt={currentBanner.title} 
            width={1920} 
            height={1080} 
            className="w-full h-full object-cover opacity-60 scale-105"
            priority
            quality="auto:best"
            sizes="100vw"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-transparent to-charcoal/20" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center text-cream px-4 max-w-4xl mx-auto flex flex-col items-center">
        <p className="text-eyebrow text-cream/80 mb-6 animate-in slide-in-from-bottom duration-700">
          The New Season · 2026
        </p>
        <h1 className="text-hero-heading text-cream mb-10 animate-in slide-in-from-bottom duration-1000 delay-200">
          {currentBanner.title}
        </h1>
        
        {currentBanner.cta_link && (
          <div className="flex flex-col sm:flex-row gap-6 w-full sm:w-auto animate-in slide-in-from-bottom duration-1000 delay-500">
            <Link
              href={currentBanner.cta_link}
              className="inline-block px-12 py-4 bg-cream text-charcoal font-semibold tracking-widest uppercase text-sm hover:bg-white hover:scale-105 active:scale-95 transition-all duration-300 rounded-full shadow-2xl border-2 border-cream"
            >
              {currentBanner.cta_text || 'SHOP NOW'}
            </Link>
          </div>
        )}
      </div>


      {/* Navigation Arrows (Only if multiple banners) */}
      {banners.length > 1 && (
        <>
          <button 
            onClick={() => setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length)}
            className="absolute left-8 top-1/2 -translate-y-1/2 p-2 rounded-full border border-cream/20 text-cream hover:bg-cream hover:text-charcoal transition-all z-20 hidden md:block"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button 
            onClick={() => setCurrentIndex((prev) => (prev + 1) % banners.length)}
            className="absolute right-8 top-1/2 -translate-y-1/2 p-2 rounded-full border border-cream/20 text-cream hover:bg-cream hover:text-charcoal transition-all z-20 hidden md:block"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-3 z-20">
            {banners.map((_, i) => (
              <button 
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`w-2 h-2 rounded-full transition-all ${i === currentIndex ? 'bg-cream w-8' : 'bg-cream/30'}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
