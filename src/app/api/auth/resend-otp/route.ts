import { NextResponse } from 'next/server';
import { resendOTP } from '@/lib/msg91';
import { otpRatelimit, getClientIP } from '@/lib/ratelimit';

export async function POST(request: Request) {
  try {
    const { phone } = await request.json();

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    const ip = getClientIP(request);
    
    // Rate limit by both IP AND phone
    const [ipLimit, phoneLimit] = await Promise.all([
      otpRatelimit.limit(`ip_${ip}`),
      otpRatelimit.limit(`phone_${phone}`)
    ]);

    if (!ipLimit.success || !phoneLimit.success) {
      return NextResponse.json(
        { error: 'Too many OTP requests. Please wait 5 minutes before retrying.' },
        {
          status: 429,
          headers: { 'Retry-After': '300' }
        }
      );
    }

    const result = await resendOTP(phone);
    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to resend OTP' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Resend OTP error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
