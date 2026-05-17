import { NextResponse } from 'next/server';
import { verifyOTP, normalizePhone } from '@/lib/msg91';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/brevo';
import { templateWelcomeEmail } from '@/lib/email-templates';
// ✅ AUDIT FIX #3 - Zod Input Validation
import { z } from 'zod';
// ✅ AUDIT FIX #4 - Rate Limiting on Auth Endpoints
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const RegisterSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile').optional(),
  otp: z.string().min(4).max(6),
  first_name: z.string().min(2).max(100).trim(),
  last_name: z.string().max(100).trim().optional().nullable(),
  alt_phone: z.string().optional().nullable(),
  ref_code: z.string().optional().nullable(),
});

export async function POST(request: Request) {
  try {
    // ✅ AUDIT FIX #4 - Rate Limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? '127.0.0.1';
    
    // Only ratelimit if Redis env vars are present to avoid crashing
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      const ratelimit = new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(5, '1 m'),
        analytics: true,
      });
      const { success } = await ratelimit.limit(`register:${ip}`);
      if (!success) {
        return NextResponse.json(
          { error: 'Too many attempts. Please wait and try again.' },
          { status: 429, headers: { 'Retry-After': '60' } }
        );
      }
    }

    const body = await request.json();
    
    // ✅ AUDIT FIX #3 - Validation
    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { phone, otp, first_name, last_name, email, alt_phone, ref_code } = parsed.data;

    if (!phone || !otp || !first_name || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const verifyResult = await verifyOTP(phone, otp);
    if (!verifyResult.success) {
      return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 });
    }

    const supabaseAdmin = createAdminSupabaseClient();
    const normalizedPhone = normalizePhone(phone);

    // 1. Check duplicate phone
    const { data: existingPhoneProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('phone', normalizedPhone)
      .maybeSingle();

    if (existingPhoneProfile) {
      return NextResponse.json({ error: 'An account with this phone number already exists' }, { status: 400 });
    }

    // 2. Check duplicate email
    const { data: existingEmailProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email.trim().toLowerCase())
      .maybeSingle();

    if (existingEmailProfile) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      phone: '+' + normalizedPhone,
      email_confirm: true,
      phone_confirm: true,
      user_metadata: { first_name, last_name, full_name: `${first_name} ${last_name || ''}`.trim() }
    });

    if (authError || !authData.user) {
      return NextResponse.json({ error: authError?.message || 'Failed to create user' }, { status: 500 });
    }

    const user_id = authData.user.id;

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: user_id,
        first_name,
        last_name,
        email,
        phone: normalizedPhone,
        alt_phone: alt_phone || null
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      await supabaseAdmin
        .from('profiles')
        .update({
          first_name,
          last_name,
          phone: normalizedPhone,
          alt_phone: alt_phone || null
        }).eq('id', user_id);
    }

    // --- Referral Handling ---
    if (ref_code) {
      try {
        const { data: referrer } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('referral_code', ref_code.toUpperCase())
          .maybeSingle();

        if (referrer && referrer.id !== user_id) {
          // Link referred user
          await supabaseAdmin.from('referrals').insert({
            referrer_id: referrer.id,
            referred_id: user_id,
            status: 'pending'
          });

          await supabaseAdmin.from('profiles')
            .update({ referred_by: referrer.id })
            .eq('id', user_id);

          // Award points to referred user
          const { data: settings } = await supabaseAdmin.from('shop_settings').select('referral_referred_points').single();
          const points = settings?.referral_referred_points || 100;

          const { data: lp } = await supabaseAdmin.from('loyalty_points').select('balance, lifetime_earned').eq('user_id', user_id).maybeSingle();
          if (lp) {
            await supabaseAdmin.from('loyalty_points').update({
              balance: lp.balance + points,
              lifetime_earned: lp.lifetime_earned + points,
              updated_at: new Date().toISOString()
            }).eq('user_id', user_id);
          } else {
            await supabaseAdmin.from('loyalty_points').insert({
              user_id: user_id,
              balance: points,
              lifetime_earned: points
            });
          }

          await supabaseAdmin.from('loyalty_transactions').insert({
            user_id: user_id,
            points: points,
            type: 'referral_signup',
            reason: 'Welcome bonus for joining via referral'
          });
        }
      } catch (err) {
        console.error('Referral handling failed:', err);
        // Silently ignore referral errors to not block registration
      }
    }
    // --- End Referral Handling ---

    await sendEmail({
      to: email,
      subject: 'Welcome to LabelWink! 🎉',
      htmlContent: templateWelcomeEmail(`${first_name} ${last_name || ''}`.trim())
    });

    // Insert welcome storefront notification
    try {
      await supabaseAdmin.from('notifications').insert({
        user_id,
        type: 'welcome',
        title: 'Welcome to LabelWink! 🎉',
        message: `Hi ${first_name}, thank you for joining LabelWink! Explore our exclusive collections and enjoy grace in every thread.`,
        data: { welcome: true }
      });
    } catch (custNotifErr) {
      console.error('Welcome storefront notification failed:', custNotifErr);
    }

    return NextResponse.json({ success: true, user_id, email });
  } catch (error: any) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
