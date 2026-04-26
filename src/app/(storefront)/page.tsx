import { createClient } from '@/lib/supabase/server';
import { Hero } from '@/components/home/Hero';
import { CollectionsShowcase } from '@/components/home/CollectionsShowcase';
import { NewArrivals } from '@/components/home/NewArrivals';
import { SaleBanner } from '@/components/home/SaleBanner';
import { BrandStory } from '@/components/home/BrandStory';
import { TrustBadges } from '@/components/home/TrustBadges';
import { readFileSync } from 'fs';
import { join } from 'path';

export default async function Home() {
  const supabase = await createClient();

  // Read home data
  let homeData: any = {};
  try {
    const raw = readFileSync(join(process.cwd(), 'data', 'pages', 'home.json'), 'utf-8');
    homeData = JSON.parse(raw);
  } catch {
    homeData = {
      hero: {
        headline: 'Better Together',
        subheadline: 'From coffee dates to weekend getaways — your perfect pair starts with what you wear',
        image_url: '',
      },
      hero_slides: [],
      trending: { product_ids: [] },
      brand_story: {
        headline: 'Crafted for the modern Indian woman',
        body: 'At Label Wink, we believe that every woman deserves to feel confident, comfortable, and completely herself.',
        image_url: '',
      },
      sale_banner: { enabled: false },
    };
  }

  // Build slides array — prefer hero_slides, fall back to hero object
  const heroSlides =
    homeData.hero_slides && homeData.hero_slides.length > 0
      ? homeData.hero_slides.map((s: any, idx: number) => ({
          id: `slide-${idx}`,
          title: s.headline || '',
          subheadline: s.subtext || '',
          badge: s.badge || '',
          cloudinary_public_id: s.image_url || '',
        }))
      : homeData.hero
      ? [
          {
            id: 'hero-1',
            title: homeData.hero.headline || homeData.hero.title || '',
            subheadline: homeData.hero.subheadline || '',
            badge: homeData.hero.badge || '',
            cloudinary_public_id: homeData.hero.image_url || 'labelwink/banners/hero_default',
          },
        ]
      : [];

  // Build product query for new arrivals
  let arrivalsQuery = supabase
    .from('products')
    .select('*, product_variants(*), product_images(*)')
    .eq('visible', true);

  if (homeData.trending?.product_ids?.length > 0) {
    arrivalsQuery = arrivalsQuery.in('id', homeData.trending.product_ids);
  } else {
    arrivalsQuery = arrivalsQuery.order('created_at', { ascending: false }).limit(8);
  }

  const { data: newArrivals } = await arrivalsQuery;

  return (
    <>
      {/* 1. Hero Slider */}
      <Hero banners={heroSlides} />

      {/* 2. Collections Showcase */}
      <CollectionsShowcase />

      {/* 3. New Arrivals */}
      {newArrivals && newArrivals.length > 0 && (
        <NewArrivals products={newArrivals} />
      )}

      {/* 4. Sale Banner (only if enabled) */}
      {homeData.sale_banner?.enabled && (
        <SaleBanner data={homeData.sale_banner} />
      )}

      {/* 5. Brand Story */}
      {homeData.brand_story && (
        <BrandStory data={homeData.brand_story} />
      )}

      {/* 6. Trust Badges */}
      <TrustBadges />
    </>
  );
}
