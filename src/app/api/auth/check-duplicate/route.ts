import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { normalizePhone } from '@/lib/msg91';

export async function POST(request: Request) {
  try {
    const { email, phone } = await request.json();
    const supabaseAdmin = createAdminSupabaseClient();
    
    const results = {
      emailExists: false,
      phoneExists: false,
    };

    if (email) {
      const { data: existingEmail } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', email.trim().toLowerCase())
        .maybeSingle();
      if (existingEmail) {
        results.emailExists = true;
      }
    }

    if (phone) {
      const normalized = normalizePhone(phone);
      const { data: existingPhone } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('phone', normalized)
        .maybeSingle();
      if (existingPhone) {
        results.phoneExists = true;
      }
    }

    return NextResponse.json(results);
  } catch (error: any) {
    console.error('Check duplicate error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
