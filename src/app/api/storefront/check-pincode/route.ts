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
    const { data: settings } = await supabaseAdmin.from('shop_settings').select('store_pincode').single();

    if (!settings?.store_pincode) {
      console.warn('[check-pincode] store_pincode not set in shop_settings — skipping serviceability check');
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
        pickup_postcode: settings?.store_pincode || '110001',
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
      // Sometimes etd is returned as a date or string, fallback safely
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
