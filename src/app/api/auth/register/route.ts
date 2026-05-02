import { NextResponse } from 'next/server';
import { verifyOTP, normalizePhone } from '@/lib/msg91';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/brevo';

export async function POST(request: Request) {
  try {
    const { phone, otp, first_name, last_name, email, alt_phone } = await request.json();

    if (!phone || !otp || !first_name || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const verifyResult = await verifyOTP(phone, otp);
    if (!verifyResult.success) {
      return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 });
    }

    const supabaseAdmin = createAdminSupabaseClient();
    const normalizedPhone = normalizePhone(phone);

    const { data: existingEmailProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email)
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

    const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://shop.hawklab.in';
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; color: #1a1a1a; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0;">
        <div style="background-color: #1a1a1a; padding: 20px; text-align: center;">
          <h1 style="color: #c9a84c; margin: 0;">LabelWink</h1>
        </div>
        <div style="padding: 20px; background-color: #faf7f2;">
          <h2>Welcome ${first_name}! 🎉</h2>
          <p>We're thrilled to have you join LabelWink. Your account has been successfully created.</p>
          <div style="text-align: center; margin-top: 30px;">
            <a href="${SITE_URL}" style="background-color: #c9a84c; color: #1a1a1a; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 4px; display: inline-block;">Start Shopping</a>
          </div>
        </div>
      </div>
    `;

    await sendEmail({
      to: email,
      subject: 'Welcome to LabelWink! 🎉',
      htmlContent: emailHtml
    });

    return NextResponse.json({ success: true, user_id, email });
  } catch (error: any) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
