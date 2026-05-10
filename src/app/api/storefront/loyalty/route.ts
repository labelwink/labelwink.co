import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(_req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ points: 0 });

  const { data: loyaltyData } = await supabase
    .from('loyalty_points')
    .select('balance, lifetime_earned')
    .eq('user_id', user.id)
    .maybeSingle();

  const { data: profileData } = await supabase
    .from('profiles')
    .select('loyalty_tier')
    .eq('id', user.id)
    .single();

  // Fetch loyalty settings from site_settings key-value store
  const adminSupabase = createAdminClient();
  const keys = ['loyalty_tiers', 'loyalty_points_per_rupee', 'points_to_rupee_ratio'];
  const { data: rows } = await adminSupabase.from('site_settings').select('key, value').in('key', keys);
  const settings = (rows ?? []).reduce((acc: Record<string, any>, row) => {
    const raw = row.value;
    acc[row.key] = raw !== null && typeof raw === 'object' && 'v' in raw ? raw.v : raw;
    return acc;
  }, {});

  return NextResponse.json({
    points:           loyaltyData?.balance || 0,
    lifetime_earned:  loyaltyData?.lifetime_earned || 0,
    loyalty_tier:     (profileData as any)?.loyalty_tier || 'Bronze',
    tiers:            settings.loyalty_tiers || [],
    points_per_rupee: settings.loyalty_points_per_rupee || 1,
    redeem_ratio:     settings.points_to_rupee_ratio || 100
  });
}
