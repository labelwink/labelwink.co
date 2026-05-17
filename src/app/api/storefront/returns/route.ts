import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/requireAdmin';
import { sendTelegramMessage } from '@/lib/telegram';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { order_id, reason, description, photos = [] } = body;

    const adminSupabase = createAdminClient();

    const { data: order, error: orderError } = await adminSupabase
      .from('orders')
      .select('id, user_id, status, updated_at, shipping_name, invoice_number')
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (order.status !== 'delivered') {
      return NextResponse.json({ error: 'Order must be delivered to request a return' }, { status: 400 });
    }

    // Fetch return_window_days from site_settings (key-value store)
    const { data: rows } = await adminSupabase.from('site_settings').select('key, value').eq('key', 'return_window_days');
    const row = rows?.[0];
    const raw = row?.value;
    const returnDays = Number((raw !== null && typeof raw === 'object' && 'v' in raw ? raw.v : raw) || 7);

    const deliveredAt = new Date(order.updated_at).getTime();
    const now = Date.now();
    if (now - deliveredAt > returnDays * 86400000) {
      return NextResponse.json({ error: 'Return window has expired' }, { status: 400 });
    }

    const { data: existingReturn } = await adminSupabase
      .from('returns')
      .select('id')
      .eq('order_id', order_id)
      .maybeSingle();

    if (existingReturn) {
      return NextResponse.json({ error: 'A return request already exists for this order' }, { status: 400 });
    }

    const { data: returnData, error: returnError } = await adminSupabase
      .from('returns')
      .insert({
        order_id,
        user_id: user.id,
        reason,
        description,
        photos,
        status: 'requested'
      })
      .select()
      .single();

    if (returnError) {
      return NextResponse.json({ error: 'Failed to create return request' }, { status: 500 });
    }

    await adminSupabase.from('orders').update({ status: 'return_requested' }).eq('id', order_id);

    const invoiceNumber = order.invoice_number || 'PENDING';
    const customerName = order.shipping_name || 'Customer';

    await adminSupabase.from('admin_notifications').insert({
      type: 'return_requested',
      title: 'Return Requested',
      message: `${customerName} requested return for ${invoiceNumber}`,
      metadata: { entity_id: order_id, order_id }
    });

    const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://labelwink.co';
    const message = `🔄 <b>Return Requested</b>\n📄 Invoice: ${invoiceNumber}\n👤 ${customerName}\n📦 Reason: ${reason}\n👉 <a href="${SITE_URL}/admin/orders/${order_id}">Review Return</a>`;
    await sendTelegramMessage(message).catch(console.error);

    return NextResponse.json({ success: true, return_id: returnData.id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('returns')
    .select('*, orders(id, order_number, total_amount, status, shipping_name), profiles:user_id(full_name, email)')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  const supabase = createAdminClient();

  try {
    const body = await req.json();
    const { id, status, admin_note, refund_amount, refund_status } = body;

    const updates: any = { updated_at: new Date().toISOString() };
    if (status !== undefined) updates.status = status;
    if (admin_note !== undefined) updates.admin_note = admin_note;
    if (refund_amount !== undefined) updates.refund_amount = refund_amount;
    if (refund_status !== undefined) updates.refund_status = refund_status;

    const { data, error } = await supabase
      .from('returns')
      .update(updates)
      .eq('id', id)
      .select('*, orders(id, order_number, customer_email, customer_name)')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (status !== undefined) {
      await supabase.from('admin_notifications').insert({
        type: 'return_status_update',
        title: 'Return Status Updated',
        message: `Return for order ${data.order_id} updated to ${status}`,
        entity_id: data.order_id
      });

      // Send customer email + Telegram on approval or rejection
      const order = Array.isArray(data.orders) ? data.orders[0] : data.orders;
      const customerEmail = order?.customer_email;
      const customerName  = order?.customer_name;
      const orderNumber   = order?.order_number;
      const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://labelwink.co';

      if (status === 'approved' || status === 'rejected') {
        // Customer storefront notification
        const { data: returnObj } = await supabase
          .from('returns')
          .select('user_id')
          .eq('id', id)
          .single();

        if (returnObj?.user_id) {
          try {
            await supabase.from('notifications').insert({
              user_id: returnObj.user_id,
              type: `return_${status}`,
              title: status === 'approved' ? 'Return Approved ✅' : 'Return Rejected ❌',
              message: status === 'approved'
                ? `Your return request for order #${orderNumber} has been approved. The refund is being processed.`
                : `Your return request for order #${orderNumber} has been rejected. Note: ${admin_note || 'N/A'}.`,
              data: { return_id: id, order_id: data.order_id, order_number: orderNumber }
            });
          } catch (custNotifErr) {
            console.error('[Returns PATCH] Customer return storefront notification failed:', custNotifErr);
          }
        }

        // Admin Telegram alert
        try {
          const emoji = status === 'approved' ? '✅' : '❌';
          const msg = `${emoji} <b>Return ${status === 'approved' ? 'Approved' : 'Rejected'}</b>\n` +
            `🆔 #${orderNumber || data.order_id.slice(0, 8).toUpperCase()}\n` +
            `👤 ${customerName || 'Customer'}\n` +
            `👉 <a href="${SITE_URL}/admin/orders/${data.order_id}">View Order</a>`;
          await sendTelegramMessage(msg);
        } catch { /* non-fatal */ }

        // Customer email
        if (customerEmail) {
          try {
            await fetch(`${SITE_URL}/api/send-email`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-internal-secret': process.env.INTERNAL_SECRET || '',
              },
              body: JSON.stringify({
                to:    customerEmail,
                type:  status === 'approved' ? 'return_approved' : 'return_rejected',
                title: '',
                body:  '',
                data: {
                  order_id:     data.order_id,
                  order_number: orderNumber,
                  customerName,
                },
              }),
            });
          } catch (emailErr) {
            console.error('[Returns PATCH] Customer email failed:', emailErr);
          }
        }
      }
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
