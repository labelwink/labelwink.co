import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const revalidate = 3600; // Cache for 1 hour

export async function GET() {
  const supabase = await createClient();

  try {
    // Get total users (registered profiles)
    const { count: totalUsers, error: countError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (countError) throw countError;

    // Get total points earned/given (sum of lifetime_earned)
    const { data, error: sumError } = await supabase
      .from('profiles')
      .select('lifetime_earned');

    if (sumError) throw sumError;

    const pointsGiven = data.reduce((acc, profile) => acc + (profile.lifetime_earned || 0), 0);

    // Add some "starter" numbers if it's a new store to look established
    const baseUsers = 500;
    const basePoints = 250000;

    return NextResponse.json({
      success: true,
      stats: {
        total_members: (totalUsers || 0) + baseUsers,
        points_awarded: pointsGiven + basePoints,
        referrals_completed: Math.floor(((totalUsers || 0) + baseUsers) * 0.15) // Estimate 15% came from referrals
      }
    });
  } catch (error: any) {
    console.error('Error fetching referral stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
