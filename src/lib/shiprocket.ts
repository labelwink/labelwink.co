const SHIPROCKET_EMAIL = process.env.SHIPROCKET_EMAIL!
const SHIPROCKET_PASSWORD = process.env.SHIPROCKET_PASSWORD!
let token: string | null = null

export async function getShiprocketToken() {
  if (token) return token
  const res = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: SHIPROCKET_EMAIL, password: SHIPROCKET_PASSWORD }),
  })
  const data = await res.json()
  token = data.token
  return token
}

export async function createShiprocketOrder(order: any) {
  const t = await getShiprocketToken()
  const addr = order.shipping_address || {}
  const payload = {
    order_id: order.id.slice(0, 8).toUpperCase(),
    order_date: new Date(order.created_at).toISOString().split('T')[0],
    pickup_location: 'Primary',
    billing_customer_name: order.customer_name || addr.fullName || addr.full_name || '',
    billing_address: addr.address || '',
    billing_city: addr.city || '',
    billing_pincode: addr.pincode || '',
    billing_state: addr.state || '',
    billing_country: 'India',
    billing_email: order.customer_email || '',
    billing_phone: order.customer_phone || addr.phone || '',
    shipping_is_billing: true,
    order_items: (Array.isArray(order.items) ? order.items : []).map((i: any) => ({
      name: i.name || i.product_name || 'Item',
      selling_price: i.price,
      units: i.qty || i.quantity || 1,
      sku: i.sku || (i.product_id || i.variantId || 'SKU').toString().slice(0, 8),
    })),
    payment_method: 'Prepaid',
    sub_total: order.total || order.total_amount || 0,
    length: 20,
    breadth: 15,
    height: 5,
    weight: 0.5,
  }
  const res = await fetch('https://apiv2.shiprocket.in/v1/external/orders/create/adhoc', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
    body: JSON.stringify(payload),
  })
  return res.json()
}

export async function getShiprocketTracking(shipmentId: string) {
  const t = await getShiprocketToken()
  const res = await fetch(
    `https://apiv2.shiprocket.in/v1/external/courier/track/shipment/${shipmentId}`,
    { headers: { Authorization: `Bearer ${t}` } }
  )
  return res.json()
}
