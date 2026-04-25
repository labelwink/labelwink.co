import { createClient } from '@/lib/supabase/server';
import { Hero } from "@/components/home/Hero";
import { TrustStrip } from "@/components/home/TrustStrip";
import { CategoryHighlights } from "@/components/home/CategoryHighlights";
import { NewArrivals } from "@/components/home/NewArrivals";
import { NewsletterSignup } from "@/components/home/NewsletterSignup";
import { readFileSync } from 'fs';
import { join } from 'path';

export default async function Home() {
  const supabase = createClient();
  
  // Read home data
  let homeData;
  try {
    const raw = readFileSync(join(process.cwd(), 'data', 'pages', 'home.json'), 'utf-8');
    homeData = JSON.parse(raw);
  } catch (error) {
    homeData = {
      hero: { title: "Grace In Every Thread", cta_text: "EXPLORE", cta_link: "/collections", image_url: "" },
      trending: { product_ids: [] },
      trust_badges: []
    };
  }

  // Build product query for trending/new arrivals based on product_ids
  let trendingQuery = supabase.from('products')
    .select('*, product_variants(*), product_images(*)')
    .eq('visible', true);

  if (homeData.trending?.product_ids && homeData.trending.product_ids.length > 0) {
    trendingQuery = trendingQuery.in('id', homeData.trending.product_ids);
  } else {
    trendingQuery = trendingQuery.order('created_at', { ascending: false }).limit(8);
  }

  const [
    { data: settings },
    { data: categories },
    { data: newArrivals },
  ] = await Promise.all([
    supabase.from('site_settings').select('*'),
    supabase.from('categories').select('*').eq('is_active', true).order('sort_order').limit(4),
    trendingQuery
  ]);

  const freeShippingThreshold = settings?.find(s => s.key === 'free_shipping_threshold')?.value?.amount ?? 999;

  // Construct banner for Hero using homeData.hero
  const banners = [{
    id: 'hero-1',
    title: homeData.hero.headline || homeData.hero.title || '',
    cta_text: homeData.hero.cta_text,
    cta_link: homeData.hero.cta_link,
    cloudinary_public_id: homeData.hero.image_url || 'labelwink/banners/hero_default',
    subheadline: homeData.hero.subheadline
  }];

  return (
    <main className="flex flex-col min-h-screen">
      <Hero banners={banners as any} />

      <TrustStrip threshold={freeShippingThreshold} />

      {categories && categories.length > 0 && (
        <CategoryHighlights categories={categories} />
      )}

      {newArrivals && newArrivals.length > 0 && (
        <NewArrivals products={newArrivals} />
      )}

      <NewsletterSignup threshold={freeShippingThreshold} />
    </main>
  );
}
