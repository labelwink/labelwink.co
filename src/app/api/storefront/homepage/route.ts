import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabaseAdmin = createAdminClient();
    const now = new Date().toISOString();

    const [
      { data: banners },
      { data: sections },
      { data: flash_sales },
      { data: collections },
      { data: occasions },
      { data: trust_badges },
      { data: new_arrivals },
      { data: settings },
      { data: announcement }
    ] = await Promise.all([
      supabaseAdmin
        .from('banners')
        .select('*')
        .eq('is_active', true)
        .eq('position', 'hero')
        .or(`starts_at.is.null,starts_at.lte.${now}`)
        .or(`ends_at.is.null,ends_at.gte.${now}`)
        .order('sort_order', { ascending: true }),

      supabaseAdmin
        .from('homepage_sections')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),

      supabaseAdmin
        .from('flash_sales')
        .select('*')
        .eq('is_active', true)
        .lte('starts_at', now)
        .gte('ends_at', now)
        .limit(1),

      supabaseAdmin
        .from('collections')
        .select('id, name, slug, image_url, banner_image_url, subtitle')
        .eq('is_featured', true)
        .eq('is_active', true)
        .order('homepage_sort_order', { ascending: true })
        .limit(8),

      supabaseAdmin
        .from('occasions')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),

      supabaseAdmin
        .from('trust_badges')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),

      supabaseAdmin
        .from('products')
        .select('id, name, slug, price, compare_at_price, product_images(url, alt, is_cover, sort_order)')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(8),

      supabaseAdmin
        .from('site_settings')
        .select('key, value'),

      supabaseAdmin
        .from('homepage_sections')
        .select('*')
        .eq('section_key', 'announcement_bar')
        .limit(1)
    ]);

    // Handle new arrivals where status was 'published' but fallback to 'is_active' if schema differs
    // We already query 'status'='published' per standard product schema.
    
    return NextResponse.json({
      banners: banners || [],
      sections: sections || [],
      flash_sale: flash_sales && flash_sales.length > 0 ? flash_sales[0] : null,
      collections: collections || [],
      occasions: occasions || [],
      trust_badges: trust_badges || [],
      new_arrivals: new_arrivals || [],
      settings: settings || null,
      announcement: announcement && announcement.length > 0 ? announcement[0] : null
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
      }
    });

  } catch (error: any) {
    console.error('Homepage GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
