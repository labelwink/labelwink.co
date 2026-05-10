import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('ref');

    if (!code) {
      return NextResponse.json({ found: false }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('referral_code', code.toUpperCase())
      .maybeSingle();

    if (!profile) {
      return NextResponse.json({ found: false });
    }

    const first_name = profile.full_name?.split(' ')[0] || 'A friend';

    return NextResponse.json({
      found: true,
      first_name
    });

  } catch (error: any) {
    console.error('Referral lookup error:', error);
    return NextResponse.json({ found: false }, { status: 500 });
  }
}
