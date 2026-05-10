import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const revalidate = 300;

/**
 * GET /api/storefront/settings
 * Returns shop settings from site_settings table (key-value store).
 * Public settings only (no API keys or sensitive data).
 */
export async function GET() {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('site_settings')
    .select('key, value');

  if (error) {
    console.error('[Settings] site_settings query error:', error);
    // Return safe defaults so the storefront doesn't crash
    return NextResponse.json(
      {
        store_name: 'LabelWink',
        currency: 'INR',
        free_shipping_threshold: 3499,
        standard_shipping_rate: 99,
        return_window_days: 7,
      },
      {
        status: 200,
        headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
      }
    );
  }

  // Transform array of {key, value} rows → flat object
  const settings = (data ?? []).reduce((acc: Record<string, any>, row) => {
    // value is jsonb — unwrap single-value objects like {"v": "LabelWink"}
    // or return as-is if it's already a plain value
    const raw = row.value;
    acc[row.key] = raw !== null && typeof raw === 'object' && 'v' in raw ? raw.v : raw;
    return acc;
  }, {});

  return NextResponse.json(settings, {
    headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' },
  });
}
