'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Printer, Package, MapPin, CreditCard,
  Truck, Clock, CheckCircle2, XCircle, FileText,
  ExternalLink, ChevronRight,
} from 'lucide-react'
import { useToast } from '@/components/admin/Toast'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils/format'
import { ORDER_STATUS_COLORS, ORDER_STATUSES } from '@/lib/utils/constants'
import type { OrderStatus } from '@/lib/utils/constants'

// ── Types ─────────────────────────────────────────────────────────────────────
interface OrderItem {
  id: string
  quantity: number
  price: number
  size: string
  color: string | null
  product_id: string | null
  products: { name: string; id: string } | null
}

interface StatusHistory {
  status: string
  note: string | null
  changed_by: string | null
  created_at: string
}

interface Invoice {
  invoice_number: string
  issued_at: string
  cgst: number
  sgst: number
  igst: number
  total: number
}

interface ShippingAddress {
  full_name?: string
  fullName?: string
  phone?: string
  address?: string
  line1?: string
  city?: string
  state?: string
  pincode?: string
}

interface Order {
  id: string
  status: string
  total: number
  subtotal: number
  shipping_amount: number
  discount_amount: number
  customer_name: string | null
  customer_email: string | null
  customer_phone: string | null
  payment_status: string | null
  payment_method: string | null
  razorpay_order_id: string | null
  razorpay_payment_id: string | null
  razorpay_signature: string | null
  shipping_carrier: string | null
  tracking_number: string | null
  tracking_url: string | null
  shiprocket_order_id: string | null
  shiprocket_awb: string | null
  admin_note: string | null
  shipping_address: ShippingAddress | null
  shipping_method: string | null
  created_at: string
  order_items: OrderItem[]
  status_history: StatusHistory[]
  invoice: Invoice | null
}


const STATUS_ICONS: Record<string, React.ElementType> = {
  delivered:  CheckCircle2,
  cancelled:  XCircle,
  shipped:    Truck,
  confirmed:  CheckCircle2,
  processing: Clock,
  pending:    Clock,
}

// ── Detail Field ──────────────────────────────────────────────────────────────
function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#9ca3af] mb-0.5">{label}</p>
      <p className="text-sm text-[#1a1a1a] font-medium">{value ?? '—'}</p>
    </div>
  )
}

// ── Section Card ──────────────────────────────────────────────────────────────
function Card({ title, icon: Icon, children, className = '' }: {
  title: string
  icon: React.ElementType
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`bg-white border border-[#e5e7eb] rounded-xl overflow-hidden ${className}`}>
      <div className="flex items-center gap-2 px-5 py-4 border-b border-[#e5e7eb]">
        <Icon size={14} className="text-[#1b3a34]" />
        <h2 className="font-semibold text-sm text-[#1a1a1a]">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { showToast, ToastComponent } = useToast()

  const [id,       setId]       = useState('')
  const [order,    setOrder]    = useState<Order | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [savingStatus,   setSavingStatus]   = useState(false)
  const [savingTracking, setSavingTracking] = useState(false)
  const [savingNote,     setSavingNote]     = useState(false)
  const [srLoading,      setSrLoading]      = useState(false)
  const [note,           setNote]           = useState('')
  const [tracking, setTracking] = useState({
    shipping_carrier: '',
    tracking_number: '',
    tracking_url: '',
  })

  useEffect(() => {
    params.then(p => {
      setId(p.id)
      fetch(`/api/admin/orders/${p.id}`)
        .then(r => r.json())
        .then((data: Order) => {
          setOrder(data)
          setNote(data.admin_note ?? '')
          setTracking({
            shipping_carrier: data.shipping_carrier ?? '',
            tracking_number:  data.tracking_number  ?? '',
            tracking_url:     data.tracking_url     ?? '',
          })
        })
        .catch(() => setOrder(null))
        .finally(() => setLoading(false))
    })
  }, [params])

  const patch = async (body: Record<string, unknown>) => {
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) throw new Error((await res.json()).error ?? 'Failed')
    return res.json() as Promise<Order>
  }

  const updateStatus = async (s: OrderStatus) => {
    if (s === order?.status) return
    setSavingStatus(true)
    try {
      const updated = await patch({ status: s })
      setOrder(prev => prev ? { ...prev, ...updated } : updated)
      showToast(`Status → ${s}`, 'success')
    } catch (e) {
      showToast(String(e), 'error')
    } finally {
      setSavingStatus(false)
    }
  }

  const saveTracking = async () => {
    setSavingTracking(true)
    try {
      const updated = await patch(tracking)
      setOrder(prev => prev ? { ...prev, ...updated } : updated)
      showToast('Tracking saved', 'success')
    } catch {
      showToast('Failed to save tracking', 'error')
    } finally {
      setSavingTracking(false)
    }
  }

  const saveNote = async () => {
    setSavingNote(true)
    try {
      await patch({ admin_note: note })
      showToast('Note saved', 'success')
    } catch {
      showToast('Failed to save note', 'error')
    } finally {
      setSavingNote(false)
    }
  }

  const pushToShiprocket = async () => {
    setSrLoading(true)
    try {
      const res  = await fetch(`/api/admin/orders/${id}/shiprocket`, { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        setOrder(prev => prev ? { ...prev, shiprocket_order_id: data.shiprocket_order_id } : prev)
        showToast('Pushed to Shiprocket ✓', 'success')
      } else {
        showToast(data.error ?? 'Shiprocket push failed', 'error')
      }
    } catch {
      showToast('Network error', 'error')
    } finally {
      setSrLoading(false)
    }
  }

  // ── Loading / Not Found ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="animate-pulse space-y-4 max-w-[1200px]">
        <div className="h-8 w-64 bg-gray-100 rounded" />
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-40 bg-gray-100 rounded-xl" />)}
        </div>
      </div>
    )
  }
  if (!order) {
    return (
      <div className="text-center py-20">
        <p className="text-lg font-semibold text-red-500">Order not found</p>
        <Link href="/admin/orders" className="text-sm text-[#1b3a34] underline mt-2 inline-block">← Back to orders</Link>
      </div>
    )
  }

  const addr     = order.shipping_address ?? {}
  const items    = order.order_items ?? []
  const history  = order.status_history ?? []
  const statusKey = (order.status ?? 'pending') as OrderStatus
  const badgeCls  = ORDER_STATUS_COLORS[statusKey] ?? 'bg-gray-100 text-gray-600'
  const addrStr   = [addr.line1 ?? addr.address, addr.city, addr.state, addr.pincode]
    .filter(Boolean).join(', ')

  return (
    <div className="space-y-5 max-w-[1200px]">
      {ToastComponent}
      <style>{`@media print { .no-print { display: none !important; } }`}</style>

      {/* Breadcrumb + Actions */}
      <div className="no-print flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.back()}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#e5e7eb] hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft size={15} />
          </button>
          <nav className="text-xs text-[#9ca3af] flex items-center gap-1">
            <Link href="/admin/orders" className="hover:text-[#1a1a1a]">Orders</Link>
            <ChevronRight size={11} />
            <span className="font-mono font-semibold text-[#1a1a1a]">#{id.slice(0, 8).toUpperCase()}</span>
          </nav>
          <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${badgeCls}`}>
            {statusKey.replace(/_/g, ' ')}
          </span>
        </div>
        <div className="flex gap-2">
          {order.invoice && (
            <button
              onClick={() => window.open(`/admin/orders/${id}/label`, '_blank')}
              className="no-print flex items-center gap-1.5 px-3 py-1.5 border border-[#e5e7eb] rounded-lg text-xs hover:bg-gray-50"
            >
              <Package size={13} /> Label
            </button>
          )}
          <button
            onClick={() => window.print()}
            className="no-print flex items-center gap-1.5 px-3 py-1.5 border border-[#e5e7eb] rounded-lg text-xs hover:bg-gray-50"
          >
            <Printer size={13} /> Print
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5">

        {/* Left Column */}
        <div className="space-y-5">

          {/* Customer & Address */}
          <Card title="Customer Information" icon={MapPin}>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Name"  value={order.customer_name || addr.full_name || addr.fullName} />
              <Field label="Email" value={order.customer_email} />
              <Field label="Phone" value={order.customer_phone || addr.phone} />
              <Field label="Method" value={order.shipping_method} />
              <div className="col-span-2">
                <Field label="Shipping Address" value={addrStr || '—'} />
              </div>
            </div>
          </Card>

          {/* Order Items */}
          <Card title="Order Items" icon={Package}>
            {items.length === 0 ? (
              <p className="text-sm text-[#9ca3af] text-center py-4">No items recorded</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af] border-b border-[#f3f4f6]">
                    <th className="text-left pb-2">Product</th>
                    <th className="text-center pb-2">Size</th>
                    <th className="text-center pb-2">Qty</th>
                    <th className="text-right pb-2">Unit</th>
                    <th className="text-right pb-2">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f3f4f6]">
                  {items.map(item => (
                    <tr key={item.id}>
                      <td className="py-2.5 font-medium text-[#1a1a1a]">
                        {item.products?.name ?? '—'}
                        {item.color && <span className="text-xs text-[#9ca3af] ml-1">· {item.color}</span>}
                      </td>
                      <td className="py-2.5 text-center text-[#6b7280]">{item.size || '—'}</td>
                      <td className="py-2.5 text-center">{item.quantity}</td>
                      <td className="py-2.5 text-right text-[#6b7280]">{formatCurrency(item.price)}</td>
                      <td className="py-2.5 text-right font-semibold">
                        {formatCurrency(item.price * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-[#e5e7eb] text-sm">
                  <tr><td colSpan={4} className="pt-2.5 text-[#6b7280]">Subtotal</td><td className="pt-2.5 text-right">{formatCurrency(order.subtotal ?? 0)}</td></tr>
                  <tr><td colSpan={4} className="text-[#6b7280]">Shipping</td><td className="text-right">{formatCurrency(order.shipping_amount ?? 0)}</td></tr>
                  {(order.discount_amount ?? 0) > 0 && (
                    <tr><td colSpan={4} className="text-emerald-600">Discount</td><td className="text-right text-emerald-600">−{formatCurrency(order.discount_amount)}</td></tr>
                  )}
                  <tr className="font-bold text-base"><td colSpan={4} className="pt-2">Total</td><td className="pt-2 text-right">{formatCurrency(order.total ?? 0)}</td></tr>
                </tfoot>
              </table>
            )}
          </Card>

          {/* Invoice Info */}
          {order.invoice && (
            <Card title="Invoice" icon={FileText}>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Invoice No"  value={order.invoice.invoice_number} />
                <Field label="Issued"      value={formatDate(order.invoice.issued_at)} />
                {order.invoice.cgst > 0 && <Field label="CGST (6%)" value={formatCurrency(order.invoice.cgst)} />}
                {order.invoice.sgst > 0 && <Field label="SGST (6%)" value={formatCurrency(order.invoice.sgst)} />}
                {order.invoice.igst > 0 && <Field label="IGST (12%)" value={formatCurrency(order.invoice.igst)} />}
                <Field label="Total" value={formatCurrency(order.invoice.total)} />
              </div>
            </Card>
          )}

          {/* Tracking */}
          <Card title="Shipping & Tracking" icon={Truck} className="no-print">
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wide text-[#9ca3af] block mb-1">Carrier</label>
                  <input
                    value={tracking.shipping_carrier}
                    onChange={e => setTracking(f => ({ ...f, shipping_carrier: e.target.value }))}
                    className="w-full border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b3a34]/20"
                    placeholder="Delhivery, BlueDart…"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wide text-[#9ca3af] block mb-1">Tracking #</label>
                  <input
                    value={tracking.tracking_number}
                    onChange={e => setTracking(f => ({ ...f, tracking_number: e.target.value }))}
                    className="w-full border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#1b3a34]/20"
                    placeholder="AWB / tracking number"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wide text-[#9ca3af] block mb-1">Tracking URL</label>
                  <input
                    value={tracking.tracking_url}
                    onChange={e => setTracking(f => ({ ...f, tracking_url: e.target.value }))}
                    className="w-full border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b3a34]/20"
                    placeholder="https://..."
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={saveTracking}
                  disabled={savingTracking}
                  className="bg-[#1b3a34] text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-[#16312b] disabled:opacity-60 transition-colors"
                >
                  {savingTracking ? 'Saving…' : 'Save Tracking'}
                </button>
                {tracking.tracking_url && (
                  <a href={tracking.tracking_url} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-[#1b3a34] underline flex items-center gap-1"
                  >
                    Track <ExternalLink size={11} />
                  </a>
                )}
              </div>
            </div>

            {/* Shiprocket */}
            <div className="mt-5 border border-[#e5e7eb] rounded-lg p-4">
              <h3 className="text-xs font-semibold text-[#1a1a1a] mb-3">Shiprocket</h3>
              {order.shiprocket_order_id ? (
                <div className="space-y-2">
                  <Field label="SR Order ID" value={<span className="font-mono">{order.shiprocket_order_id}</span>} />
                  {order.shiprocket_awb && <Field label="AWB" value={<span className="font-mono">{order.shiprocket_awb}</span>} />}
                </div>
              ) : (
                <button
                  onClick={pushToShiprocket}
                  disabled={srLoading}
                  className="bg-[#1b3a34] text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-[#16312b] disabled:opacity-60 transition-colors"
                >
                  {srLoading ? 'Pushing…' : 'Push to Shiprocket'}
                </button>
              )}
            </div>
          </Card>

          {/* Admin Note */}
          <Card title="Admin Notes" icon={FileText} className="no-print">
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={3}
              className="w-full border border-[#e5e7eb] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b3a34]/20 resize-none"
              placeholder="Internal notes (not visible to customer)…"
            />
            <button
              onClick={saveNote}
              disabled={savingNote}
              className="mt-2 bg-[#1b3a34] text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-[#16312b] disabled:opacity-60 transition-colors"
            >
              {savingNote ? 'Saving…' : 'Save Note'}
            </button>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-5 no-print">

          {/* Status Management */}
          <Card title="Order Status" icon={Clock}>
            <div className="space-y-1.5">
              {ORDER_STATUSES.map(s => {
                const isActive = order.status === s
                const SIcon = STATUS_ICONS[s] ?? Clock
                return (
                  <button
                    key={s}
                    onClick={() => updateStatus(s)}
                    disabled={savingStatus}
                    className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-sm transition-all ${
                      isActive
                        ? 'bg-[#1b3a34] text-white font-semibold'
                        : 'border border-[#e5e7eb] text-[#374151] hover:bg-gray-50 hover:border-[#1b3a34]/30'
                    } disabled:opacity-60`}
                  >
                    <SIcon size={13} className={isActive ? 'text-white' : 'text-[#9ca3af]'} />
                    {s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ')}
                  </button>
                )
              })}
            </div>
          </Card>

          {/* Payment Details */}
          <Card title="Payment" icon={CreditCard}>
            <div className="space-y-3">
              <Field label="Method" value={order.payment_method ?? 'Razorpay'} />
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#9ca3af] mb-0.5">Status</p>
                <span className={`text-sm font-semibold ${
                  order.payment_status === 'paid' ? 'text-emerald-600' : 'text-amber-600'
                }`}>
                  {order.payment_status ?? '—'}
                </span>
              </div>
              {order.razorpay_order_id && (
                <Field label="Razorpay Order" value={<span className="font-mono text-xs break-all">{order.razorpay_order_id}</span>} />
              )}
              {order.razorpay_payment_id && (
                <Field label="Payment ID" value={<span className="font-mono text-xs break-all">{order.razorpay_payment_id}</span>} />
              )}
            </div>
          </Card>

          {/* Status Timeline */}
          {history.length > 0 && (
            <Card title="Status Timeline" icon={Clock}>
              <div className="relative space-y-3">
                {history.map((h, i) => {
                  const HIcon = STATUS_ICONS[h.status] ?? Clock
                  return (
                    <div key={i} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                          i === 0 ? 'bg-[#1b3a34] text-white' : 'bg-gray-100 text-[#9ca3af]'
                        }`}>
                          <HIcon size={13} />
                        </div>
                        {i < history.length - 1 && <div className="w-px flex-1 bg-[#e5e7eb] my-1" />}
                      </div>
                      <div className="flex-1 pb-2">
                        <p className="text-xs font-semibold text-[#1a1a1a] capitalize">
                          {h.status.replace(/_/g, ' ')}
                        </p>
                        {h.note && <p className="text-xs text-[#6b7280] mt-0.5">{h.note}</p>}
                        <p className="text-[10px] text-[#9ca3af] mt-0.5">{formatDateTime(h.created_at)}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}

          {/* Order Meta */}
          <Card title="Order Details" icon={FileText}>
            <div className="space-y-3">
              <Field label="Order ID"   value={<span className="font-mono text-xs">{order.id}</span>} />
              <Field label="Placed"     value={formatDateTime(order.created_at)} />
              <Field label="Items"      value={items.length} />
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
