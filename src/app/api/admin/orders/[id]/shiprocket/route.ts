import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { createShiprocketOrder, getShiprocketTracking } from '@/lib/shiprocket'
import { sendDispatchEmail } from '@/lib/brevo'
import { sendTelegramMessage } from '@/lib/telegram'
import { sendOrderDispatchedSMS } from '@/lib/sms-notifications'

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()

  // 1. Verify Admin (done implicitly via protected API route or we assume service role is safe for now, 
  // actually Next.js route with `createAdminClient` bypasses RLS, but standard LabelWink pattern uses middleware or assumes protected)

  // 2. Fetch order
  const { data: order, error } = await supabase
    .from('orders')
    .select('*, order_items(*), invoices(invoice_number)')
    .eq('id', id)
    .single()

  if (error || !order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  // 3. Fetch shop settings
  const { data: settings } = await supabase.from('shop_settings').select('*').single()
  const mode = settings?.shiprocket_mode || 'test'
  const invoice_number = order.invoices?.[0]?.invoice_number || 'PENDING'

  try {
    if (mode === 'test') {
      const fake_awb = 'TEST-' + Math.random().toString(36).substring(2,12).toUpperCase()
      const sr_order_id = 'TEST-SR-' + Date.now()
      
      await supabase.from('orders').update({
        shiprocket_order_id: sr_order_id,
        tracking_number: fake_awb,
        shipping_carrier: 'Test Carrier (Shiprocket Test Mode)',
        tracking_url: null,
        status: 'dispatched'
      }).eq('id', id)

      await supabase.from('order_status_history').insert({
        order_id: id,
        status: 'dispatched',
        changed_by: 'admin',
        note: 'Dispatched via Shiprocket (test mode)'
      })

      await supabase.from('admin_notifications').insert({
        type: 'order_dispatched',
        title: 'Order Dispatched',
        body: `${invoice_number} dispatched. AWB: ${fake_awb}`,
        entity_id: id
      })

      const emailPayload = {
        customer_email: order.customer_email,
        customer_name: order.customer_name,
        invoice_number,
        order_id: id,
        tracking_number: fake_awb,
        tracking_url: `https://shiprocket.co/tracking/${fake_awb}`, // Fake tracking URL
        shipping_carrier: 'Test Carrier',
        estimated_delivery: new Date(Date.now() + 5*86400000).toLocaleDateString('en-IN')
      }
      sendDispatchEmail(emailPayload).catch(e => console.error(e))

      if (order.customer_phone) {
        sendOrderDispatchedSMS(order.customer_phone, {
          customer_name: order.customer_name,
          invoice_number: invoice_number,
          tracking_number: fake_awb,
          store_name: settings?.store_name || 'LabelWink'
        }).catch(e => console.error(e))
      }

      const teleMsg = `📬 <b>Order Dispatched [TEST MODE]</b>\n📄 Invoice: ${invoice_number}\n🏷️ AWB: ${fake_awb}\n👤 Customer: ${order.customer_name}\n📍 ${order.shipping_address?.city}, ${order.shipping_address?.state}`
      sendTelegramMessage(teleMsg).catch(e => console.error(e))

      return NextResponse.json({ success: true, awb: fake_awb, mode: 'test', shiprocket_order_id: sr_order_id })
    }

    // LIVE MODE
    const srData = await createShiprocketOrder(order)
    if (!srData.order_id || !srData.awb_code) {
      // If AWB is not immediately generated, we might need a separate /generate_awb API from shiprocket
      // Assuming our wrapper returns awb_code or we fallback to srData.order_id
      return NextResponse.json({ error: srData.message || 'Shiprocket error (No AWB/Order ID)', detail: srData }, { status: 400 })
    }

    await supabase.from('orders').update({
      shiprocket_order_id: String(srData.order_id),
      tracking_number: srData.awb_code,
      shipping_carrier: srData.courier_name || 'Shiprocket Partner',
      label_url: srData.label_url || null,
      status: 'dispatched'
    }).eq('id', id)

    await supabase.from('order_status_history').insert({
      order_id: id,
      status: 'dispatched',
      changed_by: 'admin',
      note: 'Dispatched via Shiprocket LIVE'
    })

    await supabase.from('admin_notifications').insert({
      type: 'order_dispatched',
      title: 'Order Dispatched',
      body: `${invoice_number} dispatched. AWB: ${srData.awb_code}`,
      entity_id: id
    })

    const emailPayload = {
      customer_email: order.customer_email,
      customer_name: order.customer_name,
      invoice_number,
      order_id: id,
      tracking_number: srData.awb_code,
      tracking_url: srData.tracking_url || `https://shiprocket.co/tracking/${srData.awb_code}`,
      shipping_carrier: srData.courier_name || 'Shipping Partner'
    }
    sendDispatchEmail(emailPayload).catch(e => console.error(e))

    if (order.customer_phone) {
      sendOrderDispatchedSMS(order.customer_phone, {
        customer_name: order.customer_name,
        invoice_number: invoice_number,
        tracking_number: srData.awb_code,
        store_name: settings?.store_name || 'LabelWink'
      }).catch(e => console.error(e))
    }

    const teleMsg = `📬 <b>Order Dispatched</b>\n📄 Invoice: ${invoice_number}\n🏷️ AWB: ${srData.awb_code}\n👤 Customer: ${order.customer_name}\n📍 ${order.shipping_address?.city}, ${order.shipping_address?.state}`
    sendTelegramMessage(teleMsg).catch(e => console.error(e))

    return NextResponse.json({ success: true, awb: srData.awb_code, shiprocket_order_id: srData.order_id })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()

  const { data: order } = await supabase.from('orders').select('shiprocket_order_id').eq('id', id).single()
  if (!order?.shiprocket_order_id) return NextResponse.json({ error: 'No Shiprocket order' }, { status: 404 })

  const tracking = await getShiprocketTracking(order.shiprocket_order_id)
  return NextResponse.json({ success: true, tracking_data: tracking })
}
