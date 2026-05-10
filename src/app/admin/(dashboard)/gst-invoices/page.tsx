'use client'

import { useState, useEffect, useCallback } from 'react'
import { FileText, Download, Search, RefreshCw, ChevronLeft, ChevronRight, Eye, CheckCircle } from 'lucide-react'

interface GSTInvoice {
  id: string
  invoice_number: string
  order_id: string | null
  order_number: string | null
  customer_name: string | null
  customer_email: string | null
  invoice_date: string
  subtotal: number
  gst_rate: number
  gst_type: string
  cgst: number
  sgst: number
  igst: number
  total: number
  status: string
  notes: string | null
  template: string | null
  created_at: string
}

const STATUS_BADGE: Record<string, string> = {
  draft:    'bg-gray-100 text-gray-600',
  issued:   'bg-blue-100 text-blue-700',
  paid:     'bg-emerald-100 text-emerald-700',
  cancelled:'bg-red-100 text-red-600',
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n)
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function GSTInvoicesPage() {
  const [invoices, setInvoices] = useState<GSTInvoice[]>([])
  const [filtered, setFiltered] = useState<GSTInvoice[]>([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [status, setStatus]     = useState('')
  const [page, setPage]         = useState(1)
  const [selected, setSelected] = useState<string | null>(null)
  const PAGE_SIZE = 20

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch('/api/admin/gst-invoices')
      const data = await res.json()
      setInvoices(data.invoices ?? [])
    } catch {
      setInvoices([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // Client-side filter (API returns all, we filter locally)
  useEffect(() => {
    let list = invoices
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(inv =>
        inv.invoice_number.toLowerCase().includes(q) ||
        (inv.customer_name ?? '').toLowerCase().includes(q) ||
        (inv.customer_email ?? '').toLowerCase().includes(q) ||
        (inv.order_number ?? '').toLowerCase().includes(q)
      )
    }
    if (status) list = list.filter(inv => inv.status === status)
    setFiltered(list)
    setPage(1)
  }, [invoices, search, status])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const visible    = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const selectedInv = invoices.find(inv => inv.id === selected)

  // Summary stats
  const totalGST    = invoices.reduce((s, inv) => s + Number(inv.cgst || 0) + Number(inv.sgst || 0) + Number(inv.igst || 0), 0)
  const totalAmount = invoices.reduce((s, inv) => s + Number(inv.total || 0), 0)
  const issued      = invoices.filter(inv => inv.status === 'issued' || inv.status === 'paid').length

  const exportCSV = () => {
    const header = 'Invoice No,Date,Customer,Order,Subtotal,GST Rate,CGST,SGST,IGST,Total,Status\n'
    const rows   = filtered.map(inv =>
      `${inv.invoice_number},${fmtDate(inv.invoice_date)},"${inv.customer_name ?? ''}","${inv.order_number ?? ''}",${inv.subtotal},${inv.gst_rate}%,${inv.cgst},${inv.sgst},${inv.igst},${inv.total},${inv.status}`
    ).join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv' })
    const a    = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `gst-invoices-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div className="space-y-5 max-w-[1400px]">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1b3a34]">GST Invoices</h1>
          <p className="text-xs text-[#6b7280] mt-0.5">{invoices.length} total invoices</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-[#e5e7eb] rounded-lg text-xs text-[#6b7280] hover:bg-gray-50 disabled:opacity-50 transition-colors">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button onClick={exportCSV} disabled={filtered.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1b3a34] text-white rounded-lg text-xs font-medium hover:bg-[#16312b] disabled:opacity-50 transition-colors">
            <Download size={13} />
            Export CSV
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Invoices',  value: invoices.length.toLocaleString('en-IN'),  color: 'text-[#1b3a34]', bg: 'bg-[#eef5f1]' },
          { label: 'GST Collected',   value: fmt(totalGST),   color: 'text-amber-700', bg: 'bg-amber-50' },
          { label: 'Total Billed',    value: fmt(totalAmount), color: 'text-[#1b3a34]', bg: 'bg-blue-50' },
          { label: 'Issued / Paid',   value: issued.toString(), color: 'text-emerald-700', bg: 'bg-emerald-50' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white border border-[#e5e7eb] rounded-xl p-4">
            <p className="text-[10px] uppercase tracking-wider text-[#9ca3af] font-semibold mb-1">{kpi.label}</p>
            <p className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search invoice, customer, order…"
            className="w-full pl-9 pr-4 py-2 border border-[#e5e7eb] rounded-lg text-xs text-[#1b3a34] focus:outline-none focus:ring-2 focus:ring-[#c9a84c]/30"
          />
        </div>
        <select
          value={status}
          onChange={e => setStatus(e.target.value)}
          className="px-3 py-2 border border-[#e5e7eb] rounded-lg text-xs bg-white text-[#1b3a34] focus:outline-none focus:ring-2 focus:ring-[#1b3a34]/20"
        >
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="issued">Issued</option>
          <option value="paid">Paid</option>
          <option value="cancelled">Cancelled</option>
        </select>
        {(search || status) && (
          <button onClick={() => { setSearch(''); setStatus('') }} className="text-xs text-red-500 hover:underline">
            Clear filters
          </button>
        )}
      </div>

      <div className="flex gap-4">
        {/* Table */}
        <div className="flex-1 bg-white border border-[#e5e7eb] rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af] border-b border-[#e5e7eb] bg-[#f9f9f9]">
                  <th className="text-left px-4 py-3">Invoice #</th>
                  <th className="text-left px-4 py-3">Customer</th>
                  <th className="text-left px-4 py-3">Date</th>
                  <th className="text-right px-4 py-3">Subtotal</th>
                  <th className="text-center px-4 py-3">GST Rate</th>
                  <th className="text-right px-4 py-3">CGST</th>
                  <th className="text-right px-4 py-3">SGST</th>
                  <th className="text-right px-4 py-3">IGST</th>
                  <th className="text-right px-4 py-3">Total</th>
                  <th className="text-center px-4 py-3">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f3f4f6]">
                {loading ? (
                  [...Array(8)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {[...Array(11)].map((_, j) => (
                        <td key={j} className="px-4 py-3.5">
                          <div className="h-3 bg-gray-100 rounded" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : visible.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="text-center py-16">
                      <FileText size={32} className="mx-auto text-[#d4cebf] mb-3" />
                      <p className="text-sm text-[#6b7280]">
                        {search || status ? 'No invoices match your filters' : 'No GST invoices yet'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  visible.map(inv => (
                    <tr
                      key={inv.id}
                      onClick={() => setSelected(selected === inv.id ? null : inv.id)}
                      className={`hover:bg-[#fafaf9] transition-colors cursor-pointer ${selected === inv.id ? 'bg-[#fdf8f0]' : ''}`}
                    >
                      <td className="px-4 py-3 font-mono text-xs font-bold text-[#c9a84c]">
                        {inv.invoice_number}
                      </td>
                      <td className="px-4 py-3 max-w-[160px]">
                        <p className="text-xs font-medium text-[#1b3a34] truncate">{inv.customer_name || '—'}</p>
                        <p className="text-[10px] text-[#9ca3af] truncate">{inv.customer_email || ''}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-[#6b7280] whitespace-nowrap">
                        {fmtDate(inv.invoice_date)}
                      </td>
                      <td className="px-4 py-3 text-right text-xs font-medium text-[#1b3a34]">
                        {fmt(inv.subtotal)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-xs text-[#9ca3af]">{inv.gst_rate}%</span>
                        <span className="ml-1 text-[10px] text-[#c9a84c] font-semibold uppercase">{inv.gst_type}</span>
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-[#4b5563]">{fmt(inv.cgst)}</td>
                      <td className="px-4 py-3 text-right text-xs text-[#4b5563]">{fmt(inv.sgst)}</td>
                      <td className="px-4 py-3 text-right text-xs text-[#4b5563]">{fmt(inv.igst)}</td>
                      <td className="px-4 py-3 text-right font-bold text-xs text-[#1b3a34]">{fmt(inv.total)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_BADGE[inv.status] ?? 'bg-gray-100 text-gray-600'}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={e => { e.stopPropagation(); setSelected(selected === inv.id ? null : inv.id) }}
                          className="p-1 text-[#9aab9e] hover:text-[#1b3a34] hover:bg-[#eef5f1] rounded transition-colors"
                          title="View details"
                        >
                          <Eye size={13} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-[#e5e7eb] bg-[#f9f9f9]">
              <p className="text-xs text-[#6b7280]">
                {filtered.length} invoices · Page {page} of {totalPages}
              </p>
              <div className="flex items-center gap-1.5">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-[#e5e7eb] hover:bg-white disabled:opacity-40">
                  <ChevronLeft size={14} />
                </button>
                <span className="text-xs text-[#6b7280] px-1">{page} / {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-[#e5e7eb] hover:bg-white disabled:opacity-40">
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selectedInv && (
          <div className="w-72 flex-shrink-0 bg-white border border-[#e5e7eb] rounded-xl shadow-sm p-5 space-y-4 self-start sticky top-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#1b3a34]">Invoice Detail</h2>
              <button onClick={() => setSelected(null)} className="text-[#9ca3af] hover:text-[#1b3a34] text-lg leading-none">×</button>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] text-[#9ca3af] uppercase tracking-wider">Invoice Number</p>
              <p className="text-sm font-mono font-bold text-[#c9a84c]">{selectedInv.invoice_number}</p>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] text-[#9ca3af] uppercase tracking-wider">Customer</p>
              <p className="text-sm font-medium text-[#1b3a34]">{selectedInv.customer_name || '—'}</p>
              <p className="text-xs text-[#6b7280]">{selectedInv.customer_email || ''}</p>
            </div>

            {selectedInv.order_id && (
              <div className="space-y-1">
                <p className="text-[10px] text-[#9ca3af] uppercase tracking-wider">Order</p>
                <p className="text-xs font-mono text-[#1b3a34]">{selectedInv.order_number || selectedInv.order_id.slice(0, 8).toUpperCase()}</p>
              </div>
            )}

            <div className="bg-[#f9fafb] rounded-lg p-3 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#6b7280]">Subtotal</span>
                <span className="font-medium text-[#1b3a34]">{fmt(selectedInv.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6b7280]">GST ({selectedInv.gst_rate}% {selectedInv.gst_type.toUpperCase()})</span>
                <span className="font-medium text-amber-700">{fmt(Number(selectedInv.cgst) + Number(selectedInv.sgst) + Number(selectedInv.igst))}</span>
              </div>
              {selectedInv.gst_type === 'igst' ? (
                <div className="flex justify-between text-[10px] text-[#9ca3af] pl-2">
                  <span>IGST</span><span>{fmt(selectedInv.igst)}</span>
                </div>
              ) : (
                <>
                  <div className="flex justify-between text-[10px] text-[#9ca3af] pl-2">
                    <span>CGST</span><span>{fmt(selectedInv.cgst)}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-[#9ca3af] pl-2">
                    <span>SGST</span><span>{fmt(selectedInv.sgst)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between font-bold border-t border-[#e5e7eb] pt-2 text-[#1b3a34]">
                <span>Total</span>
                <span>{fmt(selectedInv.total)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${STATUS_BADGE[selectedInv.status] ?? 'bg-gray-100 text-gray-600'}`}>
                <CheckCircle size={10} className="mr-1" />
                {selectedInv.status}
              </span>
              {selectedInv.template && (
                <span className="text-[10px] text-[#9ca3af] capitalize">{selectedInv.template} template</span>
              )}
            </div>

            {selectedInv.notes && (
              <div className="space-y-1">
                <p className="text-[10px] text-[#9ca3af] uppercase tracking-wider">Notes</p>
                <p className="text-xs text-[#6b7280]">{selectedInv.notes}</p>
              </div>
            )}

            <p className="text-[10px] text-[#9ca3af]">Created {fmtDate(selectedInv.created_at)}</p>
          </div>
        )}
      </div>
    </div>
  )
}
