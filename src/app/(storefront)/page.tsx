import { HeroBannerSlider } from '@/components/storefront/HeroBannerSlider';
import { FlashSaleBanner } from '@/components/storefront/FlashSaleBanner';
import { NewsletterForm } from '@/components/storefront/NewsletterForm';
import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';

async function getHomepageData() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
  try {
    const res = await fetch(`${baseUrl}/api/storefront/homepage`, { 
      next: { revalidate: 60 } 
    });
    if (!res.ok) throw new Error('Failed to fetch homepage data');
    return await res.json();
  } catch (err) {
    console.error('Homepage fetch error:', err);
    return null;
  }
}

export default async function Home() {
  const data = await getHomepageData();
  
  if (!data) {
    return <div className="min-h-screen flex items-center justify-center bg-[#faf7f2] text-[#1a1a1a]">Failed to load homepage</div>;
  }

  const { banners, sections, flash_sale, collections, occasions, trust_badges, new_arrivals, settings, announcement } = data;

  const announcementActive = sections?.find((s: any) => s.section_key === 'announcement_bar')?.is_active;
  const collectionsActive = sections?.find((s: any) => s.section_key === 'featured_collections')?.is_active;
  const arrivalsActive = sections?.find((s: any) => s.section_key === 'new_arrivals')?.is_active;
  const occasionsActive = sections?.find((s: any) => s.section_key === 'shop_by_occasion')?.is_active;
  const trustActive = sections?.find((s: any) => s.section_key === 'trust_badges')?.is_active;
  const aboutActive = sections?.find((s: any) => s.section_key === 'about_preview')?.is_active;
  const newsletterActive = sections?.find((s: any) => s.section_key === 'newsletter')?.is_active;

  return (
    <main className="min-h-screen bg-[#faf7f2] flex flex-col">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee { animation: marquee 15s linear infinite; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />

      {/* 1. ANNOUNCEMENT BAR */}
      {announcementActive && announcement && (
        <div 
          className="w-full text-center py-2 px-4 text-sm font-medium overflow-hidden whitespace-nowrap"
          style={{ background: settings?.announcement_bar_bg || '#c9a84c', color: settings?.announcement_bar_text_color || '#1a1a1a' }}
        >
          <div className="animate-marquee md:animate-none inline-block">
            <span>{announcement.title}</span>
            {settings?.announcement_bar_link && (
              <a href={settings.announcement_bar_link} className="ml-4 underline hover:no-underline font-bold">
                Shop Now &rarr;
              </a>
            )}
          </div>
        </div>
      )}

      {/* 2. HERO BANNER SLIDER */}
      {banners && banners.length > 0 && <HeroBannerSlider banners={banners} />}

      <Suspense fallback={<div className="h-20 bg-gray-100 animate-pulse w-full"></div>}>
        {/* 3. FLASH SALE COUNTDOWN */}
        {flash_sale && <FlashSaleBanner flashSale={flash_sale} />}
      </Suspense>

      <Suspense fallback={<div className="h-96 bg-gray-100 animate-pulse w-full"></div>}>
        {/* 4. FEATURED COLLECTIONS GRID */}
        {collectionsActive && collections && collections.length > 0 && (
          <section className="py-16 px-4 max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-[#1a1a1a]">
                {sections.find((s: any) => s.section_key === 'featured_collections')?.title}
              </h2>
              <p className="text-[#c9a84c] mt-2">
                {sections.find((s: any) => s.section_key === 'featured_collections')?.subtitle}
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {collections.map((c: any) => (
                <Link key={c.id} href={`/products?collection=${c.slug}`} className="group relative aspect-square overflow-hidden rounded-xl bg-gray-200 block">
                  <Image 
                    src={c.banner_image_url || c.image_url || '/placeholder.png'} 
                    alt={c.name} 
                    fill 
                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4 md:p-6">
                    <h3 className="text-white font-bold text-lg md:text-xl">{c.name}</h3>
                    {c.subtitle && <p className="text-[#c9a84c] text-sm mt-1">{c.subtitle}</p>}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </Suspense>

      <Suspense fallback={<div className="h-96 bg-gray-100 animate-pulse w-full"></div>}>
        {/* 5. NEW ARRIVALS */}
        {arrivalsActive && new_arrivals && new_arrivals.length > 0 && (
          <section className="py-16 px-4 bg-white">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-[#1a1a1a]">
                  {sections.find((s: any) => s.section_key === 'new_arrivals')?.title}
                </h2>
                <p className="text-[#c9a84c] mt-2">
                  {sections.find((s: any) => s.section_key === 'new_arrivals')?.subtitle}
                </p>
              </div>
              
              <div className="flex overflow-x-auto snap-x snap-mandatory md:grid md:grid-cols-4 gap-6 pb-8 md:pb-0 hide-scrollbar">
                {new_arrivals.map((p: any) => (
                  <Link key={p.id} href={`/products/${p.slug}`} className="group min-w-[280px] md:min-w-0 snap-start flex-1 flex flex-col relative">
                    <div className="aspect-[3/4] relative overflow-hidden rounded-xl bg-gray-100 mb-4">
                      <Image 
                        src={p.images?.[0] || '/placeholder.png'} 
                        alt={p.name} 
                        fill 
                        sizes="(max-width: 768px) 100vw, 25vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3 bg-[#c9a84c] text-[#1a1a1a] text-xs font-bold px-3 py-1 rounded-full">NEW</div>
                      <button className="absolute top-3 right-3 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center text-gray-500 hover:text-red-500 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                      </button>
                    </div>
                    <h3 className="font-bold text-[#1a1a1a] line-clamp-2 leading-tight mb-2">{p.name}</h3>
                    <div className="flex items-center gap-2 mt-auto">
                      <span className="font-bold text-[#1a1a1a]">₹{p.price}</span>
                      {p.compare_at_price > p.price && (
                        <span className="text-gray-400 line-through text-sm">₹{p.compare_at_price}</span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
              
              <div className="text-center mt-12">
                <Link href="/products?sort=newest" className="inline-block border-2 border-[#1a1a1a] text-[#1a1a1a] font-bold px-8 py-3 rounded-lg hover:bg-[#1a1a1a] hover:text-[#faf7f2] transition-colors">
                  View All New Arrivals &rarr;
                </Link>
              </div>
            </div>
          </section>
        )}
      </Suspense>

      <Suspense fallback={<div className="h-48 bg-gray-100 animate-pulse w-full"></div>}>
        {/* 6. SHOP BY OCCASION */}
        {occasionsActive && occasions && occasions.length > 0 && (
          <section className="py-16 px-4 bg-[#faf7f2]">
            <div className="max-w-7xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-center text-[#1a1a1a] mb-12">
                {sections.find((s: any) => s.section_key === 'shop_by_occasion')?.title}
              </h2>
              <div className="flex overflow-x-auto snap-x snap-mandatory gap-6 md:gap-10 pb-8 hide-scrollbar justify-start md:justify-center">
                {occasions.map((occ: any) => (
                  <Link key={occ.id} href={occ.link_url || `/products?occasion=${occ.slug}`} className="snap-start flex flex-col items-center group min-w-max">
                    <div className="w-20 h-20 md:w-32 md:h-32 rounded-full overflow-hidden bg-white shadow-sm mb-4 relative transition-all group-hover:ring-4 group-hover:ring-[#c9a84c] flex items-center justify-center text-3xl">
                      {occ.image_url ? (
                        <Image src={occ.image_url} alt={occ.name} fill sizes="(max-width: 768px) 80px, 128px" className="object-cover" />
                      ) : (
                        <span>✨</span>
                      )}
                    </div>
                    <span className="font-bold text-[#1a1a1a] group-hover:text-[#c9a84c] transition-colors">{occ.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </Suspense>

      <Suspense fallback={<div className="h-32 bg-gray-100 animate-pulse w-full"></div>}>
        {/* 7. TRUST BADGES */}
        {trustActive && trust_badges && trust_badges.length > 0 && (
          <section className="py-12 px-4 bg-white border-y border-gray-100">
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                {trust_badges.map((b: any) => (
                  <div key={b.id} className="flex flex-col items-center">
                    <span className="text-3xl mb-3">{b.icon}</span>
                    <h4 className="font-bold text-[#1a1a1a] text-sm md:text-base">{b.title}</h4>
                    {b.subtitle && <p className="text-xs md:text-sm text-gray-500 mt-1">{b.subtitle}</p>}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </Suspense>

      <Suspense fallback={<div className="h-64 bg-gray-100 animate-pulse w-full"></div>}>
        {/* 8. ABOUT PREVIEW */}
        {aboutActive && (
          <section className="py-20 px-4 bg-[#faf7f2]">
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-12">
              {sections.find((s: any) => s.section_key === 'about_preview')?.image_url && (
                <div className="w-full md:w-1/2 relative aspect-[4/3] rounded-2xl overflow-hidden">
                  <Image 
                    src={sections.find((s: any) => s.section_key === 'about_preview').image_url} 
                    alt="About Us" 
                    fill 
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover"
                  />
                </div>
              )}
              <div className={`w-full ${sections.find((s: any) => s.section_key === 'about_preview')?.image_url ? 'md:w-1/2' : 'max-w-3xl mx-auto text-center'}`}>
                <h2 className="text-3xl md:text-5xl font-bold text-[#1a1a1a] mb-6">
                  {sections.find((s: any) => s.section_key === 'about_preview')?.title}
                </h2>
                <p className="text-lg text-gray-600 mb-8 line-clamp-3">
                  {sections.find((s: any) => s.section_key === 'about_preview')?.body}
                </p>
                <Link href={sections.find((s: any) => s.section_key === 'about_preview')?.cta_url || '/about'} className="inline-block border-b-2 border-[#c9a84c] text-[#1a1a1a] font-bold pb-1 hover:text-[#c9a84c] transition-colors text-lg">
                  {sections.find((s: any) => s.section_key === 'about_preview')?.cta_text || 'Read Our Story'} &rarr;
                </Link>
              </div>
            </div>
          </section>
        )}
      </Suspense>

      <Suspense fallback={<div className="h-48 bg-[#1a1a1a] animate-pulse w-full"></div>}>
        {/* 9. NEWSLETTER SIGNUP */}
        {newsletterActive && (
          <section className="py-20 px-4 bg-[#1a1a1a] text-center text-[#faf7f2]">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {sections.find((s: any) => s.section_key === 'newsletter')?.title}
              </h2>
              <p className="text-[#faf7f2]/80 text-lg mb-8">
                {sections.find((s: any) => s.section_key === 'newsletter')?.subtitle}
              </p>
              <NewsletterForm />
            </div>
          </section>
        )}
      </Suspense>
    </main>
  );
}
