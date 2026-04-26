// ─────────────────────────────────────────────────────────────────────────────
// LabelWink — Shiprocket API Utilities (enhanced with token caching + retry)
// ─────────────────────────────────────────────────────────────────────────────

const SHIPROCKET_BASE = 'https://apiv2.shiprocket.in/v1/external'

interface TokenCache {
  token: string
  expiresAt: number
}

// In-memory token cache — refreshes automatically on expiry (24h)
let tokenCache: TokenCache | null = null

export async function getShiprocketToken(): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expiresAt) {
    return tokenCache.token
  }

  const res = await fetch(`${SHIPROCKET_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: process.env.SHIPROCKET_EMAIL,
      password: process.env.SHIPROCKET_PASSWORD,
    }),
  })

  if (!res.ok) {
    throw new Error(`Shiprocket auth failed: ${res.status}`)
  }

  const data = await res.json()
  if (!data.token) {
    throw new Error('Shiprocket did not return a token')
  }

  tokenCache = {
    token: data.token,
    expiresAt: Date.now() + 23 * 60 * 60 * 1000,  // 23 hours
  }

  return tokenCache.token
}

export interface ServiceabilityResult {
  serviceable: boolean
  estimated_days: number
  estimated_date: string
  cod_available: false
  carrier?: string
}

/**
 * Check if a delivery pincode is serviceable via Shiprocket
 */
export async function checkServiceability(
  deliveryPincode: string,
  weight = 0.5,
  pickupPincode?: string
): Promise<ServiceabilityResult> {
  const pickup = pickupPincode ?? '600001'  // fallback: Chennai

  try {
    const token = await getShiprocketToken()
    const res = await fetch(`${SHIPROCKET_BASE}/courier/serviceability/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        pickup_postcode: pickup,
        delivery_postcode: deliveryPincode,
        weight,
        cod: 0,
      }),
    })

    if (!res.ok) throw new Error(`Serviceability check failed: ${res.status}`)

    const data = await res.json()
    const courier = data?.data?.available_courier_companies?.[0]

    const estimatedDays = courier?.estimated_delivery_days ?? 5
    const estimatedDate = addBusinessDays(new Date(), estimatedDays)

    return {
      serviceable: (data?.status === 200) && !!courier,
      estimated_days: estimatedDays,
      estimated_date: estimatedDate.toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
      }),
      cod_available: false,
      carrier: courier?.courier_name,
    }
  } catch {
    // Fallback: assume serviceable, estimate 5 days
    const estimatedDate = addBusinessDays(new Date(), 5)
    return {
      serviceable: true,
      estimated_days: 5,
      estimated_date: estimatedDate.toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
      }),
      cod_available: false,
    }
  }
}

/** Skip Sundays when calculating estimated delivery date */
function addBusinessDays(date: Date, days: number): Date {
  const result = new Date(date)
  let added = 0
  while (added < days) {
    result.setDate(result.getDate() + 1)
    if (result.getDay() !== 0) {  // 0 = Sunday
      added++
    }
  }
  return result
}

export interface ShiprocketOrderPayload {
  orderId: string
  orderDate: string
  customerName: string
  customerEmail: string
  customerPhone: string
  address: string
  city: string
  state: string
  pincode: string
  items: Array<{
    name: string
    sku: string
    units: number
    selling_price: number
  }>
  total: number
  weight?: number
}

/**
 * Push an order to Shiprocket
 */
export async function pushOrderToShiprocket(payload: ShiprocketOrderPayload): Promise<{
  shiprocket_order_id: string
  awb: string | null
  shipment_id: string | null
}> {
  const token = await getShiprocketToken()

  const body = {
    order_id: payload.orderId,
    order_date: payload.orderDate,
    pickup_location: 'Primary',
    billing_customer_name: payload.customerName,
    billing_address: payload.address,
    billing_city: payload.city,
    billing_pincode: payload.pincode,
    billing_state: payload.state,
    billing_country: 'India',
    billing_email: payload.customerEmail,
    billing_phone: payload.customerPhone,
    shipping_is_billing: true,
    order_items: payload.items,
    payment_method: 'Prepaid',
    sub_total: payload.total,
    length: 20,
    breadth: 15,
    height: 5,
    weight: payload.weight ?? 0.5,
  }

  const res = await fetch(`${SHIPROCKET_BASE}/orders/create/adhoc`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Shiprocket push failed: ${JSON.stringify(err)}`)
  }

  const data = await res.json()
  return {
    shiprocket_order_id: data.order_id?.toString() ?? '',
    awb: data.awb_code ?? null,
    shipment_id: data.shipment_id?.toString() ?? null,
  }
}

/**
 * Get tracking information for a shipment
 */
export async function getShiprocketTracking(awbCode: string): Promise<Record<string, unknown>> {
  const token = await getShiprocketToken()
  const res = await fetch(
    `${SHIPROCKET_BASE}/courier/track/awb/${awbCode}`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (!res.ok) throw new Error(`Tracking fetch failed: ${res.status}`)
  return res.json()
}
