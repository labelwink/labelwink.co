const SHIPROCKET_EMAIL = process.env.SHIPROCKET_EMAIL!
const SHIPROCKET_PASSWORD = process.env.SHIPROCKET_PASSWORD!
let cachedToken: string | null = null
let tokenExpiry: number = 0

export async function getShiprocketToken() {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken
  const res = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: SHIPROCKET_EMAIL, password: SHIPROCKET_PASSWORD }),
  })
  if (!res.ok) throw new Error(`Shiprocket auth failed: ${res.status}`)
  const data = await res.json()
  if (!data.token) throw new Error('Shiprocket auth returned no token')
  cachedToken = data.token
  tokenExpiry = Date.now() + 23 * 60 * 60 * 1000 // 23 hours
  return cachedToken
}

export async function cancelShiprocketOrder(srOrderId: number | string) {
  const t = await getShiprocketToken()
  const res = await fetch('https://apiv2.shiprocket.in/v1/external/orders/cancel', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
    body: JSON.stringify({ ids: [Number(srOrderId)] }),
  })
  const data = await res.json()
  console.log('[Shiprocket] Cancel order response:', JSON.stringify(data))
  return data
}

export async function createShiprocketOrder(order: any) {
  const t = await getShiprocketToken()
  const addr = order.shipping_address || {}

  // Shiprocket requires separate first/last name fields
  const fullName  = order.shipping_name || order.customer_name || addr.fullName || addr.full_name || 'Customer'
  const nameParts = fullName.trim().split(/\s+/)
  const firstName = nameParts[0] || 'Customer'
  const lastName  = nameParts.slice(1).join(' ') || '.'  // Shiprocket requires non-empty

  const billingAddress = order.shipping_address_line1 || addr.address || addr.line1 || 'NA'
  const billingCity    = order.shipping_city    || addr.city    || ''
  const billingPincode = String(order.shipping_pincode || addr.pincode || '')
  const billingState   = order.shipping_state   || addr.state   || ''
  const billingPhone   = order.shipping_phone   || order.customer_phone || addr.phone || ''

  // Use unique order_id per attempt to avoid Shiprocket duplicate-rejection
  const baseOrderId = order.order_number || order.id.slice(0, 8).toUpperCase()
  const uniqueSuffix = Date.now().toString(36).toUpperCase().slice(-4)
  const shiprocketOrderId = `${baseOrderId}-${uniqueSuffix}`

  const payload = {
    order_id:   shiprocketOrderId,
    order_date: new Date(order.created_at).toISOString().split('T')[0],
    pickup_location: 'Shop',

    // Billing (all required)
    billing_customer_name: firstName,
    billing_last_name:     lastName,
    billing_address:       billingAddress,
    billing_city:          billingCity,
    billing_pincode:       billingPincode,
    billing_state:         billingState,
    billing_country:       'India',
    billing_email:         order.customer_email || '',
    billing_phone:         billingPhone,

    // Shipping (copy billing; Shiprocket still wants these even with shipping_is_billing)
    shipping_is_billing:    true,
    shipping_customer_name: firstName,
    shipping_last_name:     lastName,
    shipping_address:       billingAddress,
    shipping_city:          billingCity,
    shipping_pincode:       billingPincode,
    shipping_state:         billingState,
    shipping_country:       'India',
    shipping_phone:         billingPhone,

    order_items: (Array.isArray(order.items) ? order.items : []).map((i: any) => ({
      name:          i.name || i.product_name || 'Item',
      selling_price: i.price,
      units:         i.qty || i.quantity || 1,
      sku:           i.sku || (i.product_id || i.variantId || 'SKU').toString().slice(0, 8),
    })),

    payment_method: 'Prepaid',
    sub_total: order.total_amount || order.total || 0,
    length: 20,
    breadth: 15,
    height: 5,
    weight: 0.5,
  }

  console.log('[Shiprocket] Creating order payload:', JSON.stringify(payload, null, 2))

  const res = await fetch('https://apiv2.shiprocket.in/v1/external/orders/create/adhoc', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
    body: JSON.stringify(payload),
  })
  const data = await res.json()
  if (!res.ok) {
    console.error('[Shiprocket] Order creation failed:', JSON.stringify(data))
  }
  return data
}

/** Track a shipment by shipment_id — returns full activity log */
export async function getShiprocketTracking(shipmentId: string) {
  const t = await getShiprocketToken()
  const res = await fetch(
    `https://apiv2.shiprocket.in/v1/external/courier/track/shipment/${shipmentId}`,
    { headers: { Authorization: `Bearer ${t}` } }
  )
  return res.json()
}

/** Get full order details from Shiprocket by their order ID */
export async function getShiprocketOrderDetails(srOrderId: string) {
  const t = await getShiprocketToken()
  const res = await fetch(
    `https://apiv2.shiprocket.in/v1/external/orders/show/${srOrderId}`,
    { headers: { Authorization: `Bearer ${t}` } }
  )
  return res.json()
}

/** Track by AWB code — richer activity data */
export async function trackShiprocketAWB(awb: string) {
  const t = await getShiprocketToken()
  const res = await fetch(
    `https://apiv2.shiprocket.in/v1/external/courier/track/awb/${awb}`,
    { headers: { Authorization: `Bearer ${t}` } }
  )
  return res.json()
}

/** List all orders from Shiprocket (for bulk sync) */
export async function listShiprocketOrders(page = 1, perPage = 50) {
  const t = await getShiprocketToken()
  const res = await fetch(
    `https://apiv2.shiprocket.in/v1/external/orders?page=${page}&per_page=${perPage}&sort=DESC&sort_by=created_at`,
    { headers: { Authorization: `Bearer ${t}` } }
  )
  return res.json()
}

/**
 * Map Shiprocket status string → our internal order status
 * Shiprocket statuses: PICKUP SCHEDULED, PICKED UP, IN TRANSIT, OUT FOR DELIVERY,
 *   DELIVERED, CANCELLED, RTO INITIATED, RTO DELIVERED
 */
export function mapShiprocketStatus(srStatus: string): string | null {
  const s = (srStatus || '').toUpperCase()
  if (s.includes('DELIVERED') && !s.includes('RTO')) return 'delivered'
  if (s.includes('OUT FOR DELIVERY'))                  return 'shipped'
  if (s.includes('IN TRANSIT'))                        return 'shipped'
  if (s.includes('PICKED UP'))                         return 'shipped'
  if (s.includes('PICKUP SCHEDULED'))                  return 'packed'   // don't downgrade
  if (s.includes('CANCELLED') || s.includes('RTO'))   return 'cancelled'
  return null // unknown — leave as-is
}

export async function generateShiprocketAWB(shipmentId: string) {
  const t = await getShiprocketToken()
  const res = await fetch(
    'https://apiv2.shiprocket.in/v1/external/courier/assign/awb',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${t}`,
      },
      body: JSON.stringify({ shipment_id: shipmentId }),
    }
  )
  const data = await res.json()
  console.log('[Shiprocket] AWB assign raw response:', JSON.stringify(data))

  if (!res.ok) {
    // Don't throw — return structured error so the caller can surface it
    return {
      awb_code:     null,
      courier_name: null,
      shipment_id:  shipmentId,
      error:        data?.message || `AWB assign HTTP ${res.status}`,
      raw:          data,
    }
  }

  // Shiprocket wraps the AWB in response.data for some accounts
  const awb_code    = data?.response?.data?.awb_code    || data?.awb_code    || null
  const courier_name = data?.response?.data?.courier_name || data?.courier_name || null

  return {
    awb_code,
    courier_name,
    shipment_id: shipmentId,
    error: awb_code ? null : (data?.response?.data?.awb_assign_error || 'AWB not assigned'),
    raw: data,
  }
}

export async function requestShiprocketPickup(shipmentId: string) {
  const t = await getShiprocketToken()
  const res = await fetch(
    'https://apiv2.shiprocket.in/v1/external/courier/generate/pickup',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${t}`,
      },
      body: JSON.stringify({ shipment_id: [shipmentId] }),
    }
  )
  const data = await res.json()
  if (!res.ok) {
    console.error('[Shiprocket] Pickup request failed:', JSON.stringify(data))
  }
  return data
}
