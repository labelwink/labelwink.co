import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from('shop_settings').select('*').eq('id', 1).single();
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function PATCH(req: Request) {
  const supabase = createAdminClient();
  const body = await req.json();

  const allowedFields = [
    'store_name', 'store_tagline', 'store_email', 'store_phone', 'store_address',
    'store_city', 'store_state', 'store_pincode', 'gst_number', 'hsn_code',
    'logo_url', 'favicon_url', 'free_shipping_threshold', 'standard_shipping_charge',
    'express_shipping_charge', 'loyalty_enabled', 'loyalty_points_per_rupee',
    'loyalty_redemption_ratio', 'return_window_days', 'invoice_footer_note',
    'invoice_terms', 'label_warning_text', 'shiprocket_mode'
  ];

  const updates: Record<string, any> = {};
  for (const field of allowedFields) {
    if (field in body) {
      updates[field] = body[field];
    }
  }

  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('shop_settings')
    .update(updates)
    .eq('id', 1)
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}
