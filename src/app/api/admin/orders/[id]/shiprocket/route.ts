import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { createShiprocketOrder, cancelShiprocketOrder, generateShiprocketAWB, requestShiprocketPickup, getShiprocketTracking } from '@/lib/shiprocket'
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
  const invoice_number = order.invoice_number || (order.order_number ? `INV-${order.order_number}` : `INV-${order.id.slice(0, 8).toUpperCase()}`)

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

    // ── LIVE MODE ─────────────────────────────────────────────────────────────
    // Step 1: Reuse existing Shiprocket order if we already created one for this order
    let srOrderId: number | string | null = order.shiprocket_order_id || null
    let shipmentId: number | string | null = (order as any).shiprocket_shipment_id || null

    if (srOrderId && shipmentId) {
      console.log('[shiprocket/live] Reusing existing Shiprocket order:', srOrderId, 'shipment:', shipmentId)
    } else {
      // Create fresh order in Shiprocket
      console.log('[shiprocket/live] Creating new Shiprocket order for:', id)
      const srData = await createShiprocketOrder(order)
      console.log('[shiprocket/live] Create response:', JSON.stringify(srData))

      srOrderId  = srData.order_id
      shipmentId = srData.shipment_id

      if (!srOrderId || !shipmentId) {
        console.error('[shiprocket/live] Missing order_id or shipment_id:', JSON.stringify(srData))
        return NextResponse.json(
          { error: srData.message || 'Shiprocket: order creation failed', detail: srData },
          { status: 400 }
        )
      }

      // Handle CANCELED status (Shiprocket auto-cancels duplicate order_ids)
      if (srData.status === 'CANCELED' || srData.status_code === 5) {
        console.warn('[shiprocket/live] Order came back CANCELED — cancelling on their side')
        await cancelShiprocketOrder(srOrderId).catch(e =>
          console.error('[shiprocket/live] Cancel failed:', e.message)
        )
        return NextResponse.json(
          { error: 'Shiprocket rejected this order (duplicate). Click "Generate AWB & Mark Ready" once more — a new unique ID will be used.', retry: true },
          { status: 409 }
        )
      }

      // Store the Shiprocket IDs immediately so retries reuse them
      await supabase.from('orders').update({
        shiprocket_order_id: String(srOrderId),
        shiprocket_shipment_id: String(shipmentId),
      } as any).eq('id', id)
    }

    // Step 2: Assign AWB
    console.log('[shiprocket/live] Assigning AWB for shipment:', shipmentId)
    const awbData    = await generateShiprocketAWB(String(shipmentId))
    console.log('[shiprocket/live] AWB response:', JSON.stringify(awbData))
    const awb_code   = awbData.awb_code
    const courierName = awbData.courier_name || 'Shiprocket Partner'

    if (!awb_code) {
      console.error('[shiprocket/live] AWB assignment failed:', JSON.stringify(awbData))
      return NextResponse.json(
        { error: awbData.error || 'AWB assignment failed — check courier serviceability', detail: awbData.raw },
        { status: 400 }
      )
    }

    // Step 3: Request pickup (non-blocking — don't fail the response if this errors)
    console.log('[shiprocket/live] Requesting pickup for shipment:', shipmentId)
    requestShiprocketPickup(String(shipmentId))
      .then(p  => console.log('[shiprocket/live] Pickup response:', JSON.stringify(p)))
      .catch(e => console.error('[shiprocket/live] Pickup request error:', e.message))

    // Persist to DB
    await supabase.from('orders').update({
      shiprocket_order_id: String(srOrderId),
      tracking_number: awb_code,
      shipping_carrier: courierName,
      label_url: srData.label_url || null,
      ...(action === 'dispatch' ? { status: 'shipped' } : {}),
    }).eq('id', id)

    if (action === 'dispatch') {
      await supabase.from('system_logs').insert({
        level: 'info',
        category: 'shipping',
        message: `Order ${invoice_number} dispatched via Shiprocket LIVE. AWB: ${awb_code}`,
        context: { order_id: id, awb: awb_code, sr_order_id: srOrderId, shipment_id: shipmentId },
      })

      if (customer_email) {
        sendDispatchEmail({
          customer_email,
          customer_name,
          invoice_number,
          order_id: id,
          tracking_number: awb_code,
          tracking_url: `https://shiprocket.co/tracking/${awb_code}`,
          shipping_carrier: courierName,
        }).catch(e => console.error('[shiprocket/live] dispatch email:', e.message))
      }

      if (customer_phone) {
        sendOrderDispatchedSMS(customer_phone, {
          customer_name,
          invoice_number,
          tracking_number: awb_code,
          store_name: storeName,
        }).catch(e => console.error('[shiprocket/live] SMS:', e.message))
      }

      const teleMsg = `📬 <b>Order Dispatched</b>\n📄 Invoice: ${invoice_number}\n🏷️ AWB: ${awb_code}\n🚚 Courier: ${courierName}\n👤 Customer: ${customer_name}\n📍 ${order.shipping_city ?? ''}, ${order.shipping_state ?? ''}`
      sendTelegramMessage(teleMsg).catch(e => console.error('[shiprocket/live] telegram:', e.message))
    } else {
      await supabase.from('system_logs').insert({
        level: 'info',
        category: 'shipping',
        message: `AWB generated for order ${invoice_number}: ${awb_code}`,
        context: { order_id: id, awb: awb_code, shipment_id: shipmentId },
      })
    }

    return NextResponse.json({ success: true, awb: awb_code, shiprocket_order_id: srOrderId, shipment_id: shipmentId })

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
