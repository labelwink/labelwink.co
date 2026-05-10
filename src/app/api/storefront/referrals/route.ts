import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('referral_code')
      .eq('id', user.id)
      .single();

    const { count: totalReferrals } = await supabase
      .from('referrals')
      .select('*', { count: 'exact', head: true })
      .eq('referrer_id', user.id);

    const { count: successfulReferrals } = await supabase
      .from('referrals')
      .select('*', { count: 'exact', head: true })
      .eq('referrer_id', user.id)
      .eq('status', 'completed');

    const { count: pendingReferrals } = await supabase
      .from('referrals')
      .select('*', { count: 'exact', head: true })
      .eq('referrer_id', user.id)
      .eq('status', 'pending');

    const { data: pointsData } = await supabase
      .from('referrals')
      .select('referrer_points_awarded')
      .eq('referrer_id', user.id)
      .eq('status', 'completed');

    const pointsEarned = pointsData?.reduce((sum, r) => sum + (r.referrer_points_awarded || 0), 0) || 0;

    const { data: referredUsers } = await supabase
      .from('referrals')
      .select(`
        created_at,
        status,
        referred:profiles!referrals_referred_id_fkey(full_name)
      `)
      .eq('referrer_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    const formattedReferredUsers = referredUsers?.map((r: any) => ({
      first_name: r.referred?.full_name?.split(' ')[0] || 'User',
      joined_at: r.created_at,
      status: r.status
    })) || [];

    const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    return NextResponse.json({
      my_referral_code: profile?.referral_code,
      referral_link: `${SITE_URL}/join?ref=${profile?.referral_code}`,
      total_referrals: totalReferrals || 0,
      successful_referrals: successfulReferrals || 0,
      pending_referrals: pendingReferrals || 0,
      points_earned: pointsEarned,
      referred_users: formattedReferredUsers
    });

  } catch (error: any) {
    console.error('Referrals GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
