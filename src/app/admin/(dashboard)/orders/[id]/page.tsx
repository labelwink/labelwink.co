'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Printer, Package, MapPin, CreditCard,
  Truck, Clock, CheckCircle2, XCircle, FileText,
  ExternalLink, ChevronRight, ChevronDown, ChevronUp, Edit3
} from 'lucide-react'
import { useToast } from '@/components/admin/Toast'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils/format'
import { ORDER_STATUS_COLORS, ORDER_STATUSES } from '@/lib/utils/constants'
import type { OrderStatus } from '@/lib/utils/constants'
import WorkflowButton from '@/components/admin/WorkflowButton'
import { createClient } from '@/lib/supabase/client'

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
  id: string
  invoice_number: string
  issued_at: string
  cgst: number
  sgst: number
  igst: number
  total: number
  shipping: number
  discount: number
  subtotal: number
  customer_name?: string
  shipping_address?: any
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
  const supabase = createClient()

  const [id,       setId]       = useState('')
  const [order,    setOrder]    = useState<Order | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [savingStatus,   setSavingStatus]   = useState(false)
  const [savingTracking, setSavingTracking] = useState(false)
  const [savingNote,     setSavingNote]     = useState(false)
  const [dispatching,    setDispatching]    = useState(false)
  const [generatingAWB,  setGeneratingAWB]  = useState(false)
  const [note,           setNote]           = useState('')
  
  const [tracking, setTracking] = useState({
    shipping_carrier: '',
    tracking_number: '',
    tracking_url: '',
  })

  // Returns and Invoices Extras
  const [returnReq, setReturnReq] = useState<any>(null)
  const [invoiceEdits, setInvoiceEdits] = useState<any[]>([])
  const [showInvoiceEdit, setShowInvoiceEdit] = useState(false)
  const [invoiceDiscount, setInvoiceDiscount] = useState<string>('')
  const [invoiceCustomerName, setInvoiceCustomerName] = useState<string>('')
  const [savingInvoice, setSavingInvoice] = useState(false)
  
  // Return Edit
  const [returnNote, setReturnNote] = useState('')
  const [refundAmount, setRefundAmount] = useState('')
  const [savingReturn, setSavingReturn] = useState(false)

  // Debounce Note
  const saveNoteTimeout = useRef<NodeJS.Timeout | null>(null)
  const [noteSavedSignal, setNoteSavedSignal] = useState(false)

  useEffect(() => {
    params.then(p => {
      setId(p.id)
      fetchData(p.id)
    })
  }, [params])

  const fetchData = async (orderId: string) => {
    try {
      const r = await fetch(`/api/admin/orders/${orderId}`)
      if (!r.ok) throw new Error('Not found')
      const data: Order = await r.json()
      setOrder(data)
      setNote(data.admin_note ?? '')
      setTracking({
        shipping_carrier: data.shipping_carrier ?? '',
        tracking_number:  data.tracking_number  ?? '',
        tracking_url:     data.tracking_url     ?? '',
      })
      if (data.invoice) {
        setInvoiceDiscount(data.invoice.discount?.toString() || '0')
        setInvoiceCustomerName(data.invoice.customer_name || data.customer_name || '')
      }

      // Fetch Returns
      const { data: ret } = await supabase.from('returns').select('*').eq('order_id', orderId).maybeSingle()
      setReturnReq(ret)
      if (ret) {
        setReturnNote(ret.admin_note || '')
        setRefundAmount(ret.refund_amount?.toString() || data.total.toString())
      }

      // Fetch Invoice Edits
      if (data.invoice?.invoice_number) {
        const { data: edits } = await supabase.from('invoice_edits').select('*').order('created_at', { ascending: false })
        // Need to join via id or something? 
        // We can just fetch invoice_edits and filter by invoice_number client-side if needed, but wait:
        // 'invoice_id' is the foreign key. I need data.invoice.id which I don't have if the api doesn't return invoice.id.
        // Actually, the api for [id] returns 'invoice_number, issued_at, cgst, sgst, igst, total'. It might not return id.
        // If it doesn't, we can fetch the invoice ID manually:
        const { data: inv } = await supabase.from('invoices').select('id').eq('invoice_number', data.invoice.invoice_number).single()
        if (inv) {
          const { data: editRows } = await supabase.from('invoice_edits').select('*').eq('invoice_id', inv.id).order('created_at', { ascending: false })
          setInvoiceEdits(editRows || [])
        }
      }

    } catch (e) {
      setOrder(null)
    } finally {
      setLoading(false)
    }
  }

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
      const res = await fetch(`/api/admin/orders/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: s }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed')
      const updated = await res.json()
      setOrder(prev => prev ? { ...prev, status: updated.new_status || updated.status } : null)
      showToast(`Status → ${s}`, 'success')
      await fetchData(id)
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

  const handleNoteBlur = () => {
    if (saveNoteTimeout.current) clearTimeout(saveNoteTimeout.current)
    saveNoteTimeout.current = setTimeout(async () => {
      setSavingNote(true)
      try {
        await patch({ admin_note: note })
        setNoteSavedSignal(true)
        setTimeout(() => setNoteSavedSignal(false), 2000)
      } catch {
        showToast('Failed to auto-save note', 'error')
      } finally {
        setSavingNote(false)
      }
    }, 1000)
  }

  const handleGenerateAWB = async () => {
    setGeneratingAWB(true)
    try {
      const res = await fetch(`/api/admin/orders/${id}/shiprocket`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate_awb' }) 
      })
      const data = await res.json()
      if (data.success) {
        showToast(`AWB Generated: ${data.awb}`, 'success')
        await updateStatus('packed')
      } else {
        showToast(data.error || 'Failed to generate AWB', 'error')
      }
    } catch {
      showToast('Network error', 'error')
    } finally {
      setGeneratingAWB(false)
    }
  }

  const handleDispatch = async () => {
    setDispatching(true)
    try {
      const res  = await fetch(`/api/admin/orders/${id}/shiprocket`, { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        showToast(`Dispatched! AWB: ${data.awb}`, 'success')
        await fetchData(id)
      } else {
        showToast(data.error ?? 'Shiprocket push failed', 'error')
      }
    } catch {
      showToast('Network error', 'error')
    } finally {
      setDispatching(false)
    }
  }

  const refreshTracking = async () => {
    try {
      const res = await fetch(`/api/admin/orders/${id}/shiprocket`)
      const data = await res.json()
      if (data.tracking_data || data.success || !data.error) {
        showToast('Tracking status checked', 'success')
      } else {
        showToast(data.error || 'No tracking info', 'error')
      }
    } catch {
      showToast('Error refreshing tracking', 'error')
    }
  }

  const handleInvoiceEdit = async () => {
    setSavingInvoice(true)
    try {
      const res = await fetch(`/api/admin/orders/${id}/invoice`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          discount: Number(invoiceDiscount),
          customer_name: invoiceCustomerName
        })
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed')
      showToast('Invoice updated successfully', 'success')
      await fetchData(id)
      setShowInvoiceEdit(false)
    } catch (e: any) {
      showToast(e.message, 'error')
    } finally {
      setSavingInvoice(false)
    }
  }

  const handleReturnAction = async (status: string) => {
    if (!returnReq) return
    setSavingReturn(true)
    try {
      const payload: any = { id: returnReq.id, status }
      if (status === 'approved') payload.refund_amount = Number(refundAmount)
      if (status === 'rejected') payload.admin_note = returnNote

      const res = await fetch(`/api/storefront/returns`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed')
      showToast(`Return ${status}`, 'success')
      await fetchData(id)
    } catch (e: any) {
      showToast(e.message, 'error')
    } finally {
      setSavingReturn(false)
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

  // Timeline render
  const renderTimeline = () => {
    if (order.status === 'cancelled') {
      return (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 text-center font-bold mb-6 no-print">
          CANCELLED
        </div>
      );
    }
    if (order.status === 'return_requested' || order.status === 'refunded') {
      return (
        <div className="bg-orange-50 border border-orange-200 text-orange-700 rounded-xl p-4 text-center font-bold mb-6 no-print">
          {order.status === 'return_requested' ? 'RETURN REQUESTED' : 'REFUNDED'}
        </div>
      );
    }

    const STEPS = [
      { key: 'pending', label: 'Placed' },
      { key: 'confirmed', label: 'Confirmed' },
      { key: 'packed', label: 'Packed' },
      { key: 'dispatched', label: 'Dispatched' },
      { key: 'delivered', label: 'Delivered' }
    ];

    const currentIndex = Math.max(0, STEPS.findIndex(s => s.key === order.status));

    return (
      <div className="bg-white border border-[#e5e7eb] rounded-xl p-6 mb-5 overflow-x-auto no-print">
        <div className="flex items-center justify-between min-w-[600px] relative">
          <div className="absolute left-6 right-6 top-5 h-1 bg-gray-200 z-0" />
          <div 
            className="absolute left-6 top-5 h-1 bg-[#c9a84c] z-0 transition-all duration-500"
            style={{ width: `calc(${currentIndex / (STEPS.length - 1) * 100}% - 3rem)` }}
          />

          {STEPS.map((step, i) => {
            const isCompleted = i < currentIndex || (i === currentIndex && order.status === 'delivered');
            const isCurrent = i === currentIndex && order.status !== 'delivered';
            const historyItem = order.status_history?.find(h => h.status === step.key);

            return (
              <div key={step.key} className="relative z-10 flex flex-col items-center gap-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${
                  isCompleted ? 'bg-[#c9a84c] text-[#1a1a1a]' : 
                  isCurrent ? 'bg-[#c9a84c] text-[#1a1a1a] ring-4 ring-[#c9a84c]/30 animate-pulse' : 
                  'bg-white border-2 border-gray-300 text-gray-300'
                }`}>
                  {isCompleted ? <CheckCircle2 size={20} /> : (i + 1)}
                </div>
                <div className="text-center">
                  <p className={`text-xs font-bold ${isCurrent || isCompleted ? 'text-[#1a1a1a]' : 'text-gray-400'}`}>
                    {step.label}
                  </p>
                  <p className="text-[10px] text-gray-500">
                    {historyItem ? formatDateTime(historyItem.created_at).split(',')[0] : ''}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

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

      {renderTimeline()}

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

          {/* Invoice Info & Quick Edit */}
          {order.invoice && (
            <Card title="Invoice" icon={FileText}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <Field label="Invoice No"  value={order.invoice.invoice_number} />
                <Field label="Issued"      value={formatDate(order.invoice.issued_at)} />
                {order.invoice.cgst > 0 && <Field label="CGST (6%)" value={formatCurrency(order.invoice.cgst)} />}
                {order.invoice.sgst > 0 && <Field label="SGST (6%)" value={formatCurrency(order.invoice.sgst)} />}
                {order.invoice.igst > 0 && <Field label="IGST (12%)" value={formatCurrency(order.invoice.igst)} />}
                <Field label="Total" value={formatCurrency(order.invoice.total)} />
              </div>

              {['confirmed', 'packed', 'dispatched', 'shipped', 'delivered'].includes(order.status) && (
                <div className="border border-gray-200 rounded-lg overflow-hidden no-print">
                  <button 
                    onClick={() => setShowInvoiceEdit(!showInvoiceEdit)}
                    className="w-full flex items-center justify-between bg-gray-50 px-4 py-3 text-xs font-bold text-gray-700 hover:bg-gray-100"
                  >
                    <span className="flex items-center gap-2"><Edit3 size={14} /> Edit Invoice Details</span>
                    {showInvoiceEdit ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  {showInvoiceEdit && (
                    <div className="p-4 bg-white border-t border-gray-200 space-y-4">
                      <div>
                        <label className="text-xs font-semibold text-gray-600">Customer Name Correction</label>
                        <input
                          value={invoiceCustomerName}
                          onChange={e => setInvoiceCustomerName(e.target.value)}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600">Discount Override (₹)</label>
                        <input
                          type="number"
                          value={invoiceDiscount}
                          onChange={e => setInvoiceDiscount(e.target.value)}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm mt-1"
                        />
                      </div>
                      <div className="text-[10px] text-gray-500 italic">Note: Changes logged for audit trail. Shipping address is fetched automatically from order JSON.</div>
                      <WorkflowButton color="gold" size="sm" onClick={handleInvoiceEdit} loading={savingInvoice}>
                        Save Invoice Changes
                      </WorkflowButton>

                      {invoiceEdits.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                          <p className="text-xs font-bold text-gray-600">Edit History</p>
                          {invoiceEdits.map((e, i) => (
                            <div key={i} className="text-[10px] text-gray-500 bg-gray-50 p-2 rounded">
                              <span className="font-semibold text-gray-700">{formatDateTime(e.created_at)}</span> by {e.changed_by}<br/>
                              Changed fields: {Object.keys(e.changes?.after || {}).join(', ')}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
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
          </Card>

        </div>

        {/* Right Column */}
        <div className="space-y-5 no-print">

          {/* Workflow Actions */}
          <Card title="Workflow Actions" icon={Package}>
            <div className="space-y-4">
              {order.status === 'pending' && (
                <div>
                  <WorkflowButton color="green" size="lg" className="w-full" onClick={() => updateStatus('confirmed')}>
                    ✅ Accept Order
                  </WorkflowButton>
                  <div className="mt-2" />
                  <WorkflowButton color="red" variant="outline" size="sm" className="w-full" onClick={() => updateStatus('cancelled')}>
                    ✕ Cancel Order
                  </WorkflowButton>
                  <p className="text-xs text-gray-500 text-center mt-3">Accepting will deduct stock from inventory</p>
                </div>
              )}

              {order.status === 'confirmed' && (
                <div>
                  <WorkflowButton color="blue" size="lg" className="w-full" onClick={() => updateStatus('packed')}>
                    📦 Mark as Packed
                  </WorkflowButton>
                  <p className="text-xs text-gray-500 text-center mt-3">Mark when all items are packed and ready for labelling</p>
                </div>
              )}

              {order.status === 'packed' && (
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-2 gap-2">
                    <WorkflowButton variant="outline" size="sm" onClick={() => window.open(`/admin/orders/${id}/invoice`, '_blank')}>
                      🖨️ Print GST Invoice
                    </WorkflowButton>
                    <WorkflowButton variant="outline" size="sm" onClick={() => window.open(`/admin/orders/${id}/label`, '_blank')}>
                      🏷️ Print Dispatch Label
                    </WorkflowButton>
                  </div>
                  
                  {!order.tracking_number ? (
                    <WorkflowButton color="green" size="lg" className="w-full" loading={generatingAWB} onClick={handleGenerateAWB}>
                      ✅ Generate AWB & Mark Ready
                    </WorkflowButton>
                  ) : (
                    <div>
                      <div className="bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase p-2 rounded border border-emerald-100 mb-3 text-center">
                        AWB Generated: {order.tracking_number}
                      </div>
                      <WorkflowButton color="gold" size="xl" className="w-full" loading={dispatching} onClick={handleDispatch}>
                        🚀 Dispatch via Shiprocket
                      </WorkflowButton>
                      <p className="text-xs text-gray-500 text-center mt-3">Final step: Creates shipment request and notifies customer.</p>
                      {process.env.NEXT_PUBLIC_SHIPROCKET_MODE === 'test' && (
                        <div className="mt-3 bg-yellow-50 text-yellow-800 text-xs text-center p-2 rounded border border-yellow-200">
                          Test Mode — No real shipment
                        </div>
                      )}
                    </div>
                  )}
                  
                  {!order.tracking_number && (
                    <p className="text-xs text-gray-500 text-center mt-1">Print invoice and label before generating AWB</p>
                  )}
                </div>
              )}

              {(order.status === 'dispatched' || order.status === 'shipped') && (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 text-center">
                    <p className="text-xs font-bold text-gray-500 uppercase">AWB / Tracking Number</p>
                    <p className="font-mono text-xl font-bold mt-1 tracking-wider">{order.tracking_number || 'N/A'}</p>
                    <p className="text-sm mt-1">{order.shipping_carrier || 'Shiprocket'}</p>
                    {order.tracking_url && (
                      <a href={order.tracking_url} target="_blank" rel="noopener noreferrer" className="text-[#1b3a34] font-bold text-xs hover:underline mt-2 inline-block">
                        Track Package →
                      </a>
                    )}
                  </div>
                  <WorkflowButton variant="outline" className="w-full" onClick={refreshTracking}>
                    🔄 Refresh Tracking Status
                  </WorkflowButton>
                  <WorkflowButton variant="outline" className="w-full" onClick={() => updateStatus('delivered')}>
                    ✅ Mark as Delivered (Manual)
                  </WorkflowButton>
                </div>
              )}

              {order.status === 'delivered' && (
                <div className="text-center">
                  <div className="bg-emerald-100 text-emerald-800 text-sm font-bold p-3 rounded-lg border border-emerald-200 mb-3">
                    DELIVERED
                  </div>
                  <p className="text-xs text-gray-500">
                    Delivered on: {history.find(h => h.status === 'delivered') ? formatDateTime(history.find(h => h.status === 'delivered')!.created_at) : 'Unknown'}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Return Request Details */}
          {returnReq && (
            <Card title="Return Request" icon={FileText} className="no-print border-orange-200">
              <div className="space-y-4">
                <Field label="Reason" value={returnReq.reason} />
                <Field label="Description" value={returnReq.description || 'None'} />
                {returnReq.photos && returnReq.photos.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-[#9ca3af] mb-1">Photos</p>
                    <div className="flex gap-2">
                      {returnReq.photos.map((p: string, i: number) => (
                        <a key={i} href={p} target="_blank" rel="noreferrer">
                          <img src={p} alt="Return photo" className="w-12 h-12 object-cover rounded border border-gray-200" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                {returnReq.status === 'requested' && (
                  <>
                    <hr className="border-gray-200" />
                    <div>
                      <label className="text-[10px] font-semibold uppercase tracking-wide text-[#9ca3af] block mb-1">Admin Note</label>
                      <input value={returnNote} onChange={e => setReturnNote(e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1 text-sm mb-2" />
                      <label className="text-[10px] font-semibold uppercase tracking-wide text-[#9ca3af] block mb-1">Refund Amount (₹)</label>
                      <input type="number" value={refundAmount} onChange={e => setRefundAmount(e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1 text-sm mb-3" />
                      <div className="flex gap-2">
                        <WorkflowButton color="green" size="sm" className="flex-1" loading={savingReturn} onClick={() => handleReturnAction('approved')}>
                          Approve Return
                        </WorkflowButton>
                        <WorkflowButton color="red" size="sm" variant="outline" className="flex-1" loading={savingReturn} onClick={() => handleReturnAction('rejected')}>
                          Reject Return
                        </WorkflowButton>
                      </div>
                    </div>
                  </>
                )}
                {returnReq.status !== 'requested' && (
                  <div className="bg-gray-50 p-3 rounded text-xs">
                    <p><strong>Status:</strong> {returnReq.status.toUpperCase()}</p>
                    {returnReq.admin_note && <p><strong>Note:</strong> {returnReq.admin_note}</p>}
                    {returnReq.refund_amount > 0 && <p><strong>Refunded:</strong> {formatCurrency(returnReq.refund_amount)}</p>}
                  </div>
                )}
              </div>
            </Card>
          )}

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

      {/* Admin Note Section at bottom */}
      <div className="mt-8 no-print">
        <Card title="Internal Note (not visible to customer)" icon={FileText}>
          <div className="relative">
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              onBlur={handleNoteBlur}
              rows={4}
              className="w-full border border-[#e5e7eb] rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b3a34]/20 resize-none bg-yellow-50"
              placeholder="Jot down internal notes here... Autosaves when you click away."
            />
            {noteSavedSignal && (
              <span className="absolute bottom-3 right-3 text-emerald-600 font-bold text-xs flex items-center gap-1 bg-white px-2 py-1 rounded shadow-sm">
                <CheckCircle2 size={14} /> Saved
              </span>
            )}
            {savingNote && (
              <span className="absolute bottom-3 right-3 text-gray-400 font-bold text-xs flex items-center gap-1">
                Saving...
              </span>
            )}
          </div>
        </Card>
      </div>

    </div>
  )
}
