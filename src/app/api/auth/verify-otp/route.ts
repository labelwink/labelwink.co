import { NextResponse } from 'next/server';
import { verifyOTP, normalizePhone } from '@/lib/msg91';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const { phone, otp } = await request.json();

    if (!phone || !otp) {
      return NextResponse.json({ error: 'Phone and OTP are required' }, { status: 400 });
    }

    const verifyResult = await verifyOTP(phone, otp);
    if (!verifyResult.success) {
      return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 });
    }

    const supabaseAdmin = createAdminSupabaseClient();
    const normalizedPhone = normalizePhone(phone);
    
    const { data: userProfile } = await supabaseAdmin
      .from('profiles')
      .select('id, email')
      .eq('phone', normalizedPhone)
      .maybeSingle();

    if (userProfile) {
      return NextResponse.json({ 
        action: 'login', 
        user_id: userProfile.id, 
        email: userProfile.email 
      });
    } else {
      return NextResponse.json({ 
        action: 'register', 
        phone: normalizedPhone 
      });
    }
  } catch (error: any) {
    console.error('Verify OTP error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
