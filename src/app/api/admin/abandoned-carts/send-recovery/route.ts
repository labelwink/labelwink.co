import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { sendAbandonedCartEmail } from '@/lib/brevo';

export async function POST(req: Request) {
  try {
    const supabaseAdmin = createAdminClient();

    // 1. Find carts to email
    // WHERE recovered=false
    // AND email_sent_count < 2
    // AND (
    //   (email_sent_count=0 AND updated_at < now() - interval '2 hours')
    //   OR (email_sent_count=1 AND email_sent_at < now() - interval '24 hours')
    // )
    
    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

    const { data: carts, error: cartsError } = await supabaseAdmin
      .from('abandoned_carts')
      .select('*')
      .eq('recovered', false)
      .lt('email_sent_count', 2)
      .or(`and(email_sent_count.eq.0,updated_at.lt.${twoHoursAgo}),and(email_sent_count.eq.1,email_sent_at.lt.${twentyFourHoursAgo})`)
      .limit(50);

    if (cartsError) throw cartsError;

    if (!carts || carts.length === 0) {
      return NextResponse.json({ processed: 0, emailed: 0 });
    }

    const { data: settings } = await supabaseAdmin.from('shop_settings').select('store_name, logo_url').single();
    const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://shop.hawklab.in';

    let emailedCount = 0;

    for (const cart of carts) {
      // Opt-in check: newsletter_subscriptions exists OR profile exists
      const { data: subscriber } = await supabaseAdmin
        .from('newsletter_subscriptions')
        .select('id')
        .eq('email', cart.email)
        .maybeSingle();

      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('full_name')
        .eq('email', cart.email)
        .maybeSingle();

      if (!subscriber && !profile) {
        // Skip users who haven't opted in or aren't registered
        continue;
      }

      const firstName = profile?.full_name ? profile.full_name.split(' ')[0] : undefined;

      // Send email
      await sendAbandonedCartEmail({
        email: cart.email,
        first_name: firstName,
        cart_items: cart.cart_items.map((item: any) => ({
          product_name: item.name,
          size: item.size,
          quantity: item.quantity,
          unit_price: item.price,
          product_image: item.image
        })),
        cart_total: cart.cart_total,
        recovery_url: `${SITE_URL}/api/storefront/cart/recover?token=${cart.recovery_token}`,
        store_name: settings?.store_name || 'LabelWink',
        logo_url: settings?.logo_url
      });

      // Update cart
      await supabaseAdmin
        .from('abandoned_carts')
        .update({
          email_sent_at: new Date().toISOString(),
          email_sent_count: cart.email_sent_count + 1
        })
        .eq('id', cart.id);

      emailedCount++;
    }

    return NextResponse.json({ processed: carts.length, emailed: emailedCount });

  } catch (error: any) {
    console.error('Abandoned cart recovery cron error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
