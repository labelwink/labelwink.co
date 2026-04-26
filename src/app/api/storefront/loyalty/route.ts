import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/storefront/loyalty
 * Returns the logged-in user's wink_points balance.
 *
 * POST /api/storefront/loyalty/redeem  (handled in checkout action)
 * Points are deducted in the createOrder server action after order is placed.
 */
export async function GET(_req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ points: 0 });

  const { data } = await supabase
    .from('profiles')
    .select('wink_points, loyalty_tier')
    .eq('id', user.id)
    .single();

  return NextResponse.json({
    points:       data?.wink_points || 0,
    loyalty_tier: data?.loyalty_tier || 'Bronze',
  });
}
