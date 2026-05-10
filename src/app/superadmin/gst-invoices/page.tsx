'use client'

import { useState, useEffect, useCallback } from 'react'
import { FileText, Plus, X, Search, Printer, Download } from 'lucide-react'
import { toast } from 'sonner'

interface GSTInvoice {
  id: string
  invoice_number: string
  order_id: string
  order_number: string
  customer_name: string
  customer_email: string
  invoice_date: string
  subtotal: number
  gst_rate: number
  gst_type: 'CGST+SGST' | 'IGST'
  cgst: number
  sgst: number
  igst: number
  total: number
  status: 'draft' | 'sent' | 'paid' | 'cancelled'
  notes: string
}

const TABS = ['All', 'Draft', 'Sent', 'Paid', 'Cancelled'] as const
const STATUS_COLORS: Record<string, string> = {
  draft:     'bg-gray-100 text-gray-600',
  sent:      'bg-blue-100 text-blue-700',
  paid:      'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
}
const GST_RATES = [5, 12, 18, 28]

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n)
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

interface GenerateModalProps {
  onClose: () => void
  onGenerated: () => void
}

function GenerateModal({ onClose, onGenerated }: GenerateModalProps) {
  const [orderSearch, setOrderSearch] = useState('')
  const [orders, setOrders] = useState<any[]>([])
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [gstType, setGstType] = useState<'CGST+SGST' | 'IGST'>('CGST+SGST')
  const [gstRate, setGstRate] = useState(12)
  const [notes, setNotes] = useState('')
  const [template, setTemplate] = useState('standard')
  const [saving, setSaving] = useState(false)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    if (orderSearch.length < 3) return
    const t = setTimeout(async () => {
      const res = await fetch(`/api/admin/orders?search=${orderSearch}&page=1&per_page=5`)
      const data = await res.json()
      setOrders(data.orders || [])
    }, 300)
    return () => clearTimeout(t)
  }, [orderSearch])

  const calcGST = (subtotal: number) => {
    const rate = gstRate / 100
    if (gstType === 'CGST+SGST') {
      return { cgst: subtotal * rate / 2, sgst: subtotal * rate / 2, igst: 0 }
    }
    return { cgst: 0, sgst: 0, igst: subtotal * rate }
  }

  const generateNumber = () => {
    const d = new Date()
    const date = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`
    const seq  = String(Math.floor(Math.random() * 9000) + 1000)
    return `LW-INV-${date}-${seq}`
  }

  const save = async (andDownload = false) => {
    if (!selectedOrder) { toast.error('Please select an order'); return }
    setSaving(true)
    try {
      const subtotal = Number(selectedOrder.total_amount || selectedOrder.total || 0)
      const gst      = calcGST(subtotal)
      const payload  = {
        invoice_number: generateNumber(),
        order_id:       selectedOrder.id,
        order_number:   selectedOrder.order_number,
        customer_name:  selectedOrder.customer_name || '',
        customer_email: selectedOrder.customer_email || '',
        subtotal,
        gst_rate:   gstRate,
        gst_type:   gstType,
        ...gst,
        total:  subtotal + gst.cgst + gst.sgst + gst.igst,
        notes,
        template,
        status: andDownload ? 'sent' : 'draft',
      }
      const res = await fetch('/api/admin/gst-invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      const inv = await res.json()
      toast.success(andDownload ? 'Invoice generated' : 'Draft saved')
      if (andDownload) window.open(`/superadmin/gst-invoices/${inv.id}/print`, '_blank')
      onGenerated()
      onClose()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  const subtotal = selectedOrder ? Number(selectedOrder.total_amount || selectedOrder.total || 0) : 0
  const gst      = calcGST(subtotal)
  const total    = subtotal + gst.cgst + gst.sgst + gst.igst

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-bold text-gray-900">Generate GST Invoice</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Order search */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Search Order</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={orderSearch}
                onChange={e => setOrderSearch(e.target.value)}
                placeholder="Order number or customer name..."
                className="w-full pl-9 px-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 text-sm bg-white focus:ring-2 focus:ring-[#1C3829] focus:border-transparent outline-none"
              />
            </div>
            {orders.length > 0 && !selectedOrder && (
              <div className="mt-1 border border-gray-200 rounded-lg overflow-hidden">
                {orders.map(o => (
                  <button key={o.id} onClick={() => { setSelectedOrder(o); setOrders([]) }}
                    className="w-full text-left px-3 py-2.5 hover:bg-gray-50 text-sm border-b border-gray-100 last:border-0 transition-colors">
                    <span className="font-mono font-semibold text-[#1C3829]">{o.order_number}</span>
                    <span className="text-gray-500 ml-2">{o.customer_name}</span>
                    <span className="float-right text-gray-700 font-semibold">{fmt(o.total_amount || o.total)}</span>
                  </button>
                ))}
              </div>
            )}
            {selectedOrder && (
              <div className="mt-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2.5 flex items-center justify-between">
                <div>
                  <span className="font-mono font-semibold text-emerald-700">{selectedOrder.order_number}</span>
                  <span className="text-gray-600 text-sm ml-2">{selectedOrder.customer_name}</span>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600">
                  <X size={14} />
                </button>
              </div>
            )}
          </div>

          {/* GST settings */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">GST Type</label>
              <select value={gstType} onChange={e => setGstType(e.target.value as any)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 text-sm bg-white focus:ring-2 focus:ring-[#1C3829] outline-none">
                <option value="CGST+SGST">CGST + SGST (Intra-state)</option>
                <option value="IGST">IGST (Inter-state)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">GST Rate</label>
              <select value={gstRate} onChange={e => setGstRate(Number(e.target.value))}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 text-sm bg-white focus:ring-2 focus:ring-[#1C3829] outline-none">
                {GST_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Template</label>
            <select value={template} onChange={e => setTemplate(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 text-sm bg-white focus:ring-2 focus:ring-[#1C3829] outline-none">
              <option value="standard">Standard</option>
              <option value="detailed">Detailed with Line Items</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              placeholder="Optional notes on invoice..."
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 text-sm bg-white focus:ring-2 focus:ring-[#1C3829] outline-none resize-none" />
          </div>

          {/* Summary */}
          {selectedOrder && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span><span className="font-medium text-gray-900">{fmt(subtotal)}</span>
              </div>
              {gst.cgst > 0 && <div className="flex justify-between text-gray-600"><span>CGST ({gstRate/2}%)</span><span>{fmt(gst.cgst)}</span></div>}
              {gst.sgst > 0 && <div className="flex justify-between text-gray-600"><span>SGST ({gstRate/2}%)</span><span>{fmt(gst.sgst)}</span></div>}
              {gst.igst > 0 && <div className="flex justify-between text-gray-600"><span>IGST ({gstRate}%)</span><span>{fmt(gst.igst)}</span></div>}
              <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-1.5 mt-1.5">
                <span>Total</span><span>{fmt(total)}</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-gray-200">
          <button onClick={() => save(false)} disabled={saving}
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors">
            {saving ? 'Saving…' : 'Save Draft'}
          </button>
          <button onClick={() => save(true)} disabled={saving || downloading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1C3829] text-white rounded-lg text-sm font-semibold hover:bg-[#24472F] disabled:opacity-50 transition-colors">
            <Printer size={15} />
            Generate &amp; Download
          </button>
        </div>
      </div>
    </div>
  )
}

export default function GSTInvoicesPage() {
  const [invoices, setInvoices]   = useState<GSTInvoice[]>([])
  const [loading,  setLoading]    = useState(true)
  const [tab,      setTab]        = useState<typeof TABS[number]>('All')
  const [showModal, setShowModal] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch('/api/admin/gst-invoices')
      const data = await res.json()
      setInvoices(data.invoices || [])
    } catch {
      toast.error('Failed to load invoices')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = invoices.filter(inv =>
    tab === 'All' ? true : inv.status === tab.toLowerCase()
  )

  return (
    <div className="space-y-6">
      {showModal && <GenerateModal onClose={() => setShowModal(false)} onGenerated={load} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText size={22} className="text-[#1C3829]" />
          <h1 className="text-xl font-bold text-gray-900">GST Invoices</h1>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#1C3829] text-white text-sm font-semibold rounded-lg hover:bg-[#24472F] transition-colors">
          <Plus size={15} />
          Generate Invoice
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-all ${
              tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {t}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold uppercase tracking-wider text-gray-500">
                <th className="text-left px-4 py-3">Invoice #</th>
                <th className="text-left px-4 py-3">Order</th>
                <th className="text-left px-4 py-3">Customer</th>
                <th className="text-left px-4 py-3">Date</th>
                <th className="text-right px-4 py-3">Amount</th>
                <th className="text-right px-4 py-3">GST</th>
                <th className="text-center px-4 py-3">Status</th>
                <th className="text-center px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(8)].map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-400">No invoices found</td>
                </tr>
              ) : (
                filtered.map(inv => {
                  const gstTotal = inv.cgst + inv.sgst + inv.igst
                  return (
                    <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-[#1C3829]">{inv.invoice_number}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-700">{inv.order_number}</td>
                      <td className="px-4 py-3 text-gray-700 max-w-[160px] truncate">{inv.customer_name}</td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{fmtDate(inv.invoice_date)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">{fmt(inv.subtotal)}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{fmt(gstTotal)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${STATUS_COLORS[inv.status]}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => window.open(`/superadmin/gst-invoices/${inv.id}/print`, '_blank')}
                          className="text-[#1C3829] hover:underline text-xs font-medium flex items-center gap-1 mx-auto">
                          <Printer size={12} /> Print
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
