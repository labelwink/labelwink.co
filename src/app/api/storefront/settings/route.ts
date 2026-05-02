import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const revalidate = 300;

export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('shop_settings')
    .select(`
      store_name, store_tagline, store_email, store_phone,
      store_address, store_city, store_state, store_pincode,
      logo_url, favicon_url, currency, free_shipping_threshold,
      standard_shipping_charge, express_shipping_charge,
      loyalty_enabled, return_window_days, announcement_bar_bg,
      announcement_bar_text_color, announcement_bar_link,
      social_links
    `)
    .eq('id', 1)
    .single();

  if (error) {
    console.error('Error fetching storefront settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }

  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
    },
  });
}
