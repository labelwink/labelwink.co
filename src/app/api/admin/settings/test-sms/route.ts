import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/requireAdmin';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  const supabase = createAdminClient();
  
  try {
    const body = await req.json();
    const { phone } = body;

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    // Fetch store_name from site_settings (key-value store)
    const { data: rows } = await supabase.from('site_settings').select('key, value').eq('key', 'store_name');
    const storeNameRow = rows?.[0];
    const raw = storeNameRow?.value;
    const store_name = (raw !== null && typeof raw === 'object' && 'v' in raw ? raw.v : raw) || 'LabelWink';

    const { sendSMS } = await import('@/lib/msg91');
    const message = `Test SMS from ${store_name} admin panel. SMS notifications are working! ✓`;
    await sendSMS(phone, { message });

    // Log the test
    await supabase.from('sms_logs').insert({
      phone,
      message_type: 'test',
      status: 'sent',
      provider_response: { via: 'Test Route' }
    });

    return NextResponse.json({ success: true, message: `✅ Sent to ${phone}` });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('Test SMS error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
