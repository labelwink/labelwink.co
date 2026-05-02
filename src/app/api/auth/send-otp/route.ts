import { NextResponse } from 'next/server';
import { sendOTP } from '@/lib/msg91';
 
declare global {
  var otpAttempts: Map<string, { count: number; resetAt: number }> | undefined;
}
 
const otpAttempts: Map<string, { count: number; resetAt: number }> = globalThis.otpAttempts ?? new Map();
globalThis.otpAttempts = otpAttempts;

export async function POST(request: Request) {
  try {
    const { phone } = await request.json();

    if (!phone || typeof phone !== 'string') {
      return NextResponse.json({ error: 'Invalid mobile number' }, { status: 400 });
    }

    const now = Date.now();
    const key = `otp_${phone}`;
    const record = otpAttempts.get(key);

    if (record && now < record.resetAt) {
      if (record.count >= 3) {
        return NextResponse.json(
          { error: 'Too many requests. Please wait 5 minutes before retrying.' },
          { status: 429 }
        );
      }
      otpAttempts.set(key, { count: record.count + 1, resetAt: record.resetAt });
    } else {
      otpAttempts.set(key, { count: 1, resetAt: now + 5 * 60 * 1000 });
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
