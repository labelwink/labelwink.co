import { createClient } from '@/lib/supabase/server';
import { Hero } from "@/components/home/Hero";
import { TrustStrip } from "@/components/home/TrustStrip";
import { CategoryHighlights } from "@/components/home/CategoryHighlights";
import { NewArrivals } from "@/components/home/NewArrivals";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { NewsletterSignup } from "@/components/home/NewsletterSignup";

export default async function Home() {
  const supabase = createClient();
  
  if (!supabase || typeof supabase.from !== 'function') {
    console.error('Failed to initialize Supabase client:', supabase);
    throw new Error('Supabase client initialization failed');
  }

  // Fetch CMS-driven data in parallel
  const [
    { data: banners },
    { data: announcements },
    { data: sections },
    { data: settings },
    { data: categories },
    { data: newArrivals },
  ] = await Promise.all([
    supabase.from('banners').select('*').eq('is_active', true).eq('position', 'hero').order('sort_order'),
    supabase.from('announcements').select('*').eq('is_active', true).order('sort_order'),
    supabase.from('homepage_sections').select('*').eq('is_active', true).order('sort_order'),
    supabase.from('site_settings').select('*'),
    supabase.from('categories').select('*').eq('is_active', true).order('sort_order').limit(4),
    supabase.from('products')
      .select('*, product_variants(*), product_images(*)')
      .eq('is_active', true)
      .contains('tags', ['new'])
      .order('created_at', { ascending: false })
      .limit(8),
  ]);

  const freeShippingThreshold = settings?.find(s => s.key === 'free_shipping_threshold')?.value?.amount ?? 999;
  const announcementSpeed = settings?.find(s => s.key === 'announcement_bar_speed')?.value?.ms ?? 3000;

  return (
    <main className="flex flex-col min-h-screen">
      {/* Only render sections that admin has activated */}
      {announcements && announcements.length > 0 && (
        <AnnouncementBar items={announcements} speed={announcementSpeed} />
      )}
      
      <Hero banners={banners || []} />

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
