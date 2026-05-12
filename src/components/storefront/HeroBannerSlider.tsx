'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export function HeroBannerSlider({ banners }: { banners: any[] }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!banners || banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrent(c => (c + 1) % banners.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [banners]);

  if (!banners || banners.length === 0) return null;

  return (
    <div className="relative w-full h-[60vh] md:h-[80vh] overflow-hidden">
      {banners.map((b, i) => (
        <div 
          key={b.id} 
          className={`absolute inset-0 transition-opacity duration-1000 ${i === current ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
        >
          <Image
            src={b.image_url}
            alt={b.title || 'Banner'}
            fill
            className="object-cover"
            priority={i === 0}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-16 max-w-4xl">
            <h2 className="text-4xl md:text-6xl font-bold text-[#faf7f2] mb-4">{b.title}</h2>
            {b.subtitle && <p className="text-lg text-[#faf7f2]/80 mb-8">{b.subtitle}</p>}
            {b.cta_url && b.cta_text && (
              <Link 
                href={b.cta_url}
                className="bg-[#c9a84c] text-[#ffffff] font-bold px-8 py-3 rounded-lg w-max hover:bg-[#b8973d] transition-colors"
              >
                {b.cta_text}
              </Link>
            )}
          </div>
        </div>
      ))}
      
      {banners.length > 1 && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-10">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-3 h-3 rounded-full transition-colors ${i === current ? 'bg-[#c9a84c]' : 'bg-white/50'}`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
