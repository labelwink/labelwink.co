import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getShiprocketToken } from '@/lib/shiprocket';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const pincode = searchParams.get('pincode');

  if (!pincode || !/^\d{6}$/.test(pincode)) {
    return NextResponse.json({ error: 'Invalid pincode' }, { status: 400 });
  }

  try {
    const token = await getShiprocketToken();
    const supabaseAdmin = createAdminClient();

    // Fetch store_pincode from site_settings (key-value store)
    const { data: rows } = await supabaseAdmin.from('site_settings').select('key, value').eq('key', 'store_pincode');
    const row = rows?.[0];
    const raw = row?.value;
    const store_pincode = (raw !== null && typeof raw === 'object' && 'v' in raw ? raw.v : raw) || null;

    if (!store_pincode) {
      console.warn('[check-pincode] store_pincode not set in site_settings — skipping serviceability check');
      return NextResponse.json({ 
        serviceable: true, 
        estimated_days: 5, 
        estimated_date: new Date(Date.now() + 5 * 86400000).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }),
        cod_available: false 
      });
    }

    const response = await fetch('https://apiv2.shiprocket.in/v1/external/courier/serviceability/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        pickup_postcode: store_pincode || '110001',
        delivery_postcode: pincode,
        cod: 0,
        weight: 0.5
      })
    });

    if (!response.ok) throw new Error('Shiprocket error');
    const data = await response.json();

    const couriers = data?.data?.available_courier_companies || [];
    const serviceable = couriers.length > 0;
    
    let estimated_days = 5;
    if (serviceable && couriers[0].estimated_delivery_days) {
      estimated_days = Number(couriers[0].estimated_delivery_days) || 5;
    } else if (serviceable && couriers[0].etd) {
      estimated_days = 5; 
    }

    const estimated_date = new Date(Date.now() + estimated_days * 86400000).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });

    return NextResponse.json({ serviceable, estimated_days, estimated_date, cod_available: false });
  } catch (error) {
    return NextResponse.json({ 
      serviceable: true, 
      estimated_days: 5, 
      estimated_date: new Date(Date.now() + 5 * 86400000).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }),
      cod_available: false
    });
  }
}
