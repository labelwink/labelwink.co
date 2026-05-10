import { NextResponse } from 'next/server';
import { sendOTP } from '@/lib/msg91';
import { otpRatelimit, getClientIP } from '@/lib/ratelimit';

export async function POST(request: Request) {
  try {
    const { phone } = await request.json();

    if (!phone || typeof phone !== 'string') {
      return NextResponse.json({ error: 'Invalid mobile number' }, { status: 400 });
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

    let digits = phone.replace(/\D/g, '').replace(/^0+/, '');
    if (digits.startsWith('91') && digits.length === 12) {
      digits = digits.substring(2);
    }

    if (digits.length !== 10 || !/^[6-9]/.test(digits)) {
      return NextResponse.json({ error: 'Invalid mobile number' }, { status: 400 });
    }

    const result = await sendOTP(digits);
    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to send OTP' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Send OTP error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
