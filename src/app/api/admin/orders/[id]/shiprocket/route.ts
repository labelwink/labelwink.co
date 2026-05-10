import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { createShiprocketOrder, getShiprocketTracking } from '@/lib/shiprocket'
import { sendDispatchEmail } from '@/lib/brevo'
import { sendTelegramMessage } from '@/lib/telegram'
import { sendOrderDispatchedSMS } from '@/lib/sms-notifications'

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()

  // Fetch order (use actual schema columns)
  const { data: order, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('id', id)
    .single()

  if (error || !order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  let action: 'dispatch' | 'generate_awb' = 'dispatch'
  try {
    const body = await _.json()
    if (body.action === 'generate_awb') action = 'generate_awb'
  } catch {
    // Default to dispatch if no body
  }

  // Fetch store name from site_settings
  const { data: settingsRows } = await supabase
    .from('site_settings')
    .select('key, value')
    .eq('key', 'store_name')
  const storeName = settingsRows?.[0]?.value ?? 'LabelWink'

  const mode = process.env.SHIPROCKET_MODE || 'test'
  const invoice_number = order.invoice_number || `INV-${order.id.slice(0, 8).toUpperCase()}`

  // Customer info from shipping fields (schema uses shipping_name, shipping_phone)
  const customer_name = order.shipping_name || 'Customer'
  const customer_phone = order.shipping_phone || null
  const customer_email = order.customer_email || null

  try {
    if (mode === 'test') {
      // Test mode: generate a deterministic test AWB (not random)
      const test_awb = `TEST-${Date.now().toString(36).toUpperCase()}`
      const sr_order_id = `TEST-SR-${Date.now()}`

      await supabase.from('orders').update({
        shiprocket_order_id: sr_order_id,
        tracking_number: test_awb,
        shipping_carrier: 'Test Carrier (Shiprocket Test Mode)',
        tracking_url: null,
        ...(action === 'dispatch' ? { status: 'shipped' } : {}),
      }).eq('id', id)

      if (action === 'dispatch') {
        await supabase.from('system_logs').insert({
          level: 'info',
          category: 'shipping',
          message: `[TEST] Order ${invoice_number} dispatched. AWB: ${test_awb}`,
          context: { order_id: id, awb: test_awb, mode: 'test' },
        })

        if (customer_email) {
          sendDispatchEmail({
            customer_email,
            customer_name,
            invoice_number,
            order_id: id,
            tracking_number: test_awb,
            tracking_url: null,
            shipping_carrier: 'Test Carrier',
            estimated_delivery: new Date(Date.now() + 5 * 86400000).toLocaleDateString('en-IN'),
          }).catch(e => console.error('[shiprocket/test] dispatch email:', e.message))
        }

        if (customer_phone) {
          sendOrderDispatchedSMS(customer_phone, {
            customer_name,
            invoice_number,
            tracking_number: test_awb,
            store_name: storeName,
          }).catch(e => console.error('[shiprocket/test] SMS:', e.message))
        }

        const teleMsg = `📬 <b>Order Dispatched [TEST MODE]</b>\n📄 Invoice: ${invoice_number}\n🏷️ AWB: ${test_awb}\n👤 Customer: ${customer_name}\n📍 ${order.shipping_city ?? ''}, ${order.shipping_state ?? ''}`
        sendTelegramMessage(teleMsg).catch(e => console.error('[shiprocket/test] telegram:', e.message))
      }

      return NextResponse.json({ success: true, awb: test_awb, mode: 'test', shiprocket_order_id: sr_order_id })
    }

    // LIVE MODE
    const srData = await createShiprocketOrder(order)
    if (!srData.order_id || !srData.awb_code) {
      return NextResponse.json({ error: srData.message || 'Shiprocket error (No AWB/Order ID)', detail: srData }, { status: 400 })
    }

    await supabase.from('orders').update({
      shiprocket_order_id: String(srData.order_id),
      tracking_number: srData.awb_code,
      shipping_carrier: srData.courier_name || 'Shiprocket Partner',
      label_url: srData.label_url || null,
      ...(action === 'dispatch' ? { status: 'shipped' } : {}),
    }).eq('id', id)

    if (action === 'dispatch') {
      await supabase.from('system_logs').insert({
        level: 'info',
        category: 'shipping',
        message: `Order ${invoice_number} dispatched via Shiprocket LIVE. AWB: ${srData.awb_code}`,
        context: { order_id: id, awb: srData.awb_code, sr_order_id: srData.order_id },
      })

      if (customer_email) {
        sendDispatchEmail({
          customer_email,
          customer_name,
          invoice_number,
          order_id: id,
          tracking_number: srData.awb_code,
          tracking_url: srData.tracking_url || `https://shiprocket.co/tracking/${srData.awb_code}`,
          shipping_carrier: srData.courier_name || 'Shipping Partner',
        }).catch(e => console.error('[shiprocket/live] dispatch email:', e.message))
      }

      if (customer_phone) {
        sendOrderDispatchedSMS(customer_phone, {
          customer_name,
          invoice_number,
          tracking_number: srData.awb_code,
          store_name: storeName,
        }).catch(e => console.error('[shiprocket/live] SMS:', e.message))
      }

      const teleMsg = `📬 <b>Order Dispatched</b>\n📄 Invoice: ${invoice_number}\n🏷️ AWB: ${srData.awb_code}\n👤 Customer: ${customer_name}\n📍 ${order.shipping_city ?? ''}, ${order.shipping_state ?? ''}`
      sendTelegramMessage(teleMsg).catch(e => console.error('[shiprocket/live] telegram:', e.message))
    } else {
      await supabase.from('system_logs').insert({
        level: 'info',
        category: 'shipping',
        message: `AWB generated for order ${invoice_number}: ${srData.awb_code}`,
        context: { order_id: id, awb: srData.awb_code },
      })
    }

    return NextResponse.json({ success: true, awb: srData.awb_code, shiprocket_order_id: srData.order_id })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[shiprocket/route] POST error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
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
