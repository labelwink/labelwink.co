'use client'

import { useState, useEffect, useCallback, useTransition } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  Search, Download, ChevronLeft, ChevronRight,
  ShoppingBag, RefreshCw, Printer, Check, CheckCircle2, MoreHorizontal, Package, XCircle
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { ORDER_STATUS_COLORS, ORDER_STATUSES } from '@/lib/utils/constants'
import type { OrderStatus } from '@/lib/utils/constants'
import { useToast } from '@/components/admin/Toast'

interface Order {
  id: string
  status: string
  total: number
  customer_name: string | null
  customer_email: string | null
  customer_phone: string | null
  payment_status: string | null
  tracking_number: string | null
  shipping_carrier: string | null
  created_at: string
  invoices?: { invoice_number: string }[]
  order_items?: any[]
}

const PAGE_SIZE = 25

export default function OrdersPage() {
  const router     = useRouter()
  const pathname   = usePathname()
  const searchParams = useSearchParams()
  const { showToast, ToastComponent } = useToast()

  const [orders,     setOrders]     = useState<Order[]>([])
  const [total,      setTotal]      = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading,    setLoading]    = useState(true)
  const [isPending,  startTransition] = useTransition()

  // Derive filter state from URL
  const status = searchParams.get('status') ?? ''
  const search = searchParams.get('search') ?? ''
  const page   = Number(searchParams.get('page') ?? '0')
  const from   = searchParams.get('from') ?? ''
  const to     = searchParams.get('to') ?? ''

  // Bulk state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkProcessing, setBulkProcessing] = useState(false)
  const [bulkActionOpen, setBulkActionOpen] = useState(false)

  const updateUrl = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString())
    for (const [k, v] of Object.entries(updates)) {
      if (v) params.set(k, v)
      else params.delete(k)
    }
    startTransition(() => router.push(`${pathname}?${params}`))
  }

  const setDateRange = (preset: 'today' | 'week' | 'month') => {
    const dTo = new Date()
    let dFrom = new Date()
    if (preset === 'today') {
      dFrom = new Date()
    } else if (preset === 'week') {
      dFrom.setDate(dFrom.getDate() - 7)
    } else if (preset === 'month') {
      dFrom.setMonth(dFrom.getMonth() - 1)
    }
    updateUrl({
      from: dFrom.toISOString().split('T')[0],
      to: dTo.toISOString().split('T')[0],
      page: '0'
    })
  }

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page) })
      if (status) params.set('status', status)
      if (search) params.set('search', search)
      if (from) params.set('from', from)
      if (to) params.set('to', to)
      const res  = await fetch(`/api/admin/orders?${params}`)
      const data = await res.json()
      setOrders(data.orders ?? [])
      setTotal(data.total ?? 0)
      setTotalPages(data.totalPages ?? 0)
    } catch {
      setOrders([])
    } finally {
      setLoading(false)
    }
  }, [status, search, page, from, to])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(orders.map(o => o.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  const handleSelect = (id: string) => {
    const newSet = new Set(selectedIds)
    if (newSet.has(id)) newSet.delete(id)
    else newSet.add(id)
    setSelectedIds(newSet)
  }

  const executeBulkAction = async (action: string) => {
    if (selectedIds.size === 0) return
    if (action === 'export') {
      const ids = Array.from(selectedIds).join(',')
      const params = new URLSearchParams()
      if (status) params.set('status', status)
      if (search) params.set('search', search)
      if (from) params.set('from', from)
      if (to) params.set('to', to)
      params.set('ids', ids)
      window.open(`/api/admin/orders/export?${params}`, '_blank')
      setBulkActionOpen(false)
      return
    }

    if (action === 'cancel' && !confirm('Are you sure you want to cancel these orders?')) return

    setBulkProcessing(true)
    showToast(`Processing ${selectedIds.size} orders...`, 'success')
    try {
      const res = await fetch('/api/admin/orders/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, order_ids: Array.from(selectedIds) })
      })
      const data = await res.json()
      if (res.ok) {
        showToast(`Successfully processed ${data.success_count} orders`, 'success')
        setSelectedIds(new Set())
        fetchOrders()
      } else {
        showToast(data.error || 'Failed bulk action', 'error')
      }
    } catch (e: any) {
      showToast('Network error', 'error')
    } finally {
      setBulkProcessing(false)
      setBulkActionOpen(false)
    }
  }

  const quickAction = async (id: string, action: 'accept' | 'print') => {
    if (action === 'print') {
      window.open(`/admin/orders/${id}/invoice`, '_blank')
    } else if (action === 'accept') {
      try {
        const res = await fetch(`/api/admin/orders/${id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'confirmed' })
        })
        if (res.ok) {
          showToast('Order confirmed', 'success')
          fetchOrders()
        }
      } catch {
        showToast('Failed to accept order', 'error')
      }
    }
  }

  const exportCSV = () => {
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    if (search) params.set('search', search)
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    const url = `/api/admin/orders/export?${params}`
    const a = document.createElement('a')
    a.href = url
    a.download = `labelwink-orders-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
  }

  const STATUS_TABS: Array<{ label: string; value: string }> = [
    { label: 'All',       value: '' },
    ...ORDER_STATUSES.map(s => ({
      label: s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' '),
      value: s,
    })),
  ]

  return (
    <div className="space-y-5 max-w-[1400px]">
      {ToastComponent}
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1b3a34]">Orders</h1>
          <p className="text-[#6b7280] text-xs mt-0.5">{total.toLocaleString('en-IN')} total orders</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchOrders}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-[#e5e7eb] rounded-lg text-xs text-[#6b7280] hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1b3a34] text-white rounded-lg text-xs font-medium hover:bg-[#16312b] disabled:opacity-50 transition-colors"
          >
            <Download size={13} /> Export CSV
          </button>
        </div>
      </div>

      {/* Date & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#e5e7eb] flex flex-col md:flex-row gap-4 justify-between">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
          <input
            type="text"
            defaultValue={search}
            onChange={e => {
              const val = e.target.value
              clearTimeout((window as any)._st)
              ;(window as any)._st = setTimeout(() => updateUrl({ search: val, page: '0' }), 400)
            }}
            placeholder="Search by order ID, invoice, customer name, phone..."
            className="w-full pl-9 pr-4 py-2 border border-[#e5e7eb] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#c9a84c]"
          />
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="flex items-center gap-1 border border-gray-200 p-1 rounded-lg">
            <button onClick={() => setDateRange('today')} className="px-3 py-1 text-xs hover:bg-gray-100 rounded">Today</button>
            <button onClick={() => setDateRange('week')} className="px-3 py-1 text-xs hover:bg-gray-100 rounded">This Week</button>
            <button onClick={() => setDateRange('month')} className="px-3 py-1 text-xs hover:bg-gray-100 rounded">This Month</button>
          </div>
          <input 
            type="date" 
            value={from} 
            onChange={e => updateUrl({ from: e.target.value, page: '0' })}
            className="border border-gray-300 rounded px-2 py-1 text-xs text-gray-700" 
          />
          <span className="text-[#5a7060]">to</span>
          <input 
            type="date" 
            value={to} 
            onChange={e => updateUrl({ to: e.target.value, page: '0' })}
            className="border border-gray-300 rounded px-2 py-1 text-xs text-gray-700" 
          />
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-4 overflow-x-auto pb-1 scrollbar-hide border-b border-gray-200">
        {STATUS_TABS.map(tab => {
          const isActive = status === tab.value
          return (
            <button
              key={tab.value}
              onClick={() => updateUrl({ status: tab.value, page: '0' })}
              className={`pb-2 px-1 text-xs font-bold whitespace-nowrap transition-all border-b-2 flex items-center gap-1.5 ${
                isActive
                  ? 'border-[#c9a84c] text-[#c9a84c]'
                  : 'border-transparent text-[#9aab9e] hover:text-gray-900'
              }`}
            >
              {tab.label}
              {isActive && (
                <span className="bg-[#c9a84c]/10 text-[#c9a84c] py-0.5 px-1.5 rounded-full text-[10px]">
                  {total}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Table & Bulk Actions */}
      <div className="bg-white border border-[#e5e7eb] rounded-xl shadow-sm overflow-hidden">
        {/* Bulk action header */}
        {selectedIds.size > 0 && (
          <div className="bg-[#fdfbf6] border-b border-[#e5e7eb] px-4 py-2 flex items-center justify-between">
            <span className="text-xs font-bold text-[#c9a84c]">{selectedIds.size} selected</span>
            <div className="relative">
              <button 
                onClick={() => setBulkActionOpen(!bulkActionOpen)}
                className="bg-white border border-gray-300 px-3 py-1.5 rounded text-xs font-semibold hover:bg-gray-50 flex items-center gap-1"
              >
                Bulk Actions <ChevronRight size={14} className={bulkActionOpen ? 'rotate-90' : ''} />
              </button>
              {bulkActionOpen && (
                <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 shadow-xl rounded-lg py-1 z-10 text-xs font-medium">
                  <button onClick={() => executeBulkAction('confirm')} className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500" /> Accept Selected</button>
                  <button onClick={() => executeBulkAction('pack')} className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2"><Package size={14} className="text-blue-500" /> Mark as Packed</button>
                  <button onClick={() => executeBulkAction('export')} className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2"><Download size={14} /> Export CSV</button>
                  <hr className="my-1 border-gray-100" />
                  <button onClick={() => executeBulkAction('cancel')} className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2"><XCircle size={14} /> Cancel Selected</button>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af] border-b border-[#e5e7eb] bg-[#f9f9f9]">
                <th className="px-4 py-3 w-10">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.size > 0 && selectedIds.size === orders.length}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-[#c9a84c] focus:ring-[#c9a84c]"
                  />
                </th>
                <th className="text-left px-4 py-3">Invoice / Order</th>
                <th className="text-left px-4 py-3">Customer</th>
                <th className="text-left px-4 py-3">Items</th>
                <th className="text-right px-4 py-3">Total</th>
                <th className="text-center px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Date</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f3f4f6]">
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {[...Array(8)].map((_, j) => (
                      <td key={j} className="px-4 py-3.5"><div className="h-4 bg-gray-100 rounded w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16">
                    <ShoppingBag size={32} className="mx-auto text-[#1a2e1e] mb-3" />
                    <p className="text-sm text-[#6b7280]">No orders found</p>
                    {(status || search || from || to) && (
                      <button onClick={() => updateUrl({ status: '', search: '', from: '', to: '', page: '0' })} className="text-xs text-[#c9a84c] font-bold underline mt-2">
                        Clear filters
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                orders.map(o => {
                  const statusKey = (o.status ?? 'pending') as OrderStatus
                  let badgeCls = ORDER_STATUS_COLORS[statusKey] ?? 'bg-gray-100 text-gray-600'
                  
                  // Brand overrides
                  if (statusKey === 'pending') badgeCls = 'bg-amber-100 text-amber-700'
                  if (statusKey === 'confirmed') badgeCls = 'bg-sky-100 text-sky-700'
                  if (statusKey === 'packed') badgeCls = 'bg-indigo-100 text-indigo-700'
                  if (statusKey === 'shipped') badgeCls = 'bg-violet-100 text-violet-700'
                  if (statusKey === 'delivered') badgeCls = 'bg-green-100 text-green-700'
                  if (statusKey === 'cancelled') badgeCls = 'bg-red-100 text-red-700'
                  if (statusKey === 'return_requested') badgeCls = 'bg-orange-100 text-orange-700'

                  const isSelected = selectedIds.has(o.id)
                  const invoiceNum = o.invoices?.[0]?.invoice_number

                  return (
                    <tr
                      key={o.id}
                      className={`hover:bg-[#f9fafb] transition-colors cursor-pointer ${isSelected ? 'bg-[#fdfbf6]' : ''}`}
                      onClick={(e) => {
                        // Prevent row click when clicking on buttons or checkboxes
                        if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).tagName === 'INPUT') return;
                        router.push(`/admin/orders/${o.id}`)
                      }}
                    >
                      <td className="px-4 py-3.5 w-10">
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={() => handleSelect(o.id)}
                          className="rounded border-gray-300 text-[#c9a84c] focus:ring-[#c9a84c]"
                        />
                      </td>
                      <td className="px-4 py-3.5">
                        {invoiceNum && <p className="font-mono font-bold text-[#c9a84c] text-xs">{invoiceNum}</p>}
                        <span className="font-mono text-[#6b7280] text-[10px]">
                          #{o.id.slice(0, 8).toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 max-w-[160px]">
                        <p className="font-medium text-[#1b3a34] truncate text-xs">{o.customer_name || '—'}</p>
                        <p className="text-[10px] text-[#9ca3af] truncate">{o.customer_phone || o.customer_email || '—'}</p>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-[#9aab9e] max-w-[120px] truncate">
                        {o.order_items ? o.order_items.length + ' items' : '—'}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <span className="font-bold text-[#1b3a34] text-xs">{formatCurrency(Number(o.total ?? 0))}</span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${badgeCls}`}>
                          {o.status.replace(/_/g, ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-[#9ca3af] text-xs whitespace-nowrap">
                        {formatDate(o.created_at)}
                      </td>
                      <td className="px-4 py-3.5 text-right space-x-2">
                        {o.status === 'pending' && (
                          <button onClick={() => quickAction(o.id, 'accept')} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded" title="Accept Order">
                            <Check size={16} />
                          </button>
                        )}
                        {o.status === 'packed' && (
                          <button onClick={() => quickAction(o.id, 'print')} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded" title="Print Invoice">
                            <Printer size={16} />
                          </button>
                        )}
                        <Link
                          href={`/admin/orders/${o.id}`}
                          className="inline-block p-1.5 text-[#c9a84c] hover:bg-[#fdfbf6] rounded"
                        >
                          <MoreHorizontal size={16} />
                        </Link>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-[#e5e7eb] bg-[#f9f9f9]">
            <p className="text-xs text-[#6b7280]">
              Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total.toLocaleString('en-IN')}
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => updateUrl({ page: String(Math.max(0, page - 1)) })}
                disabled={page === 0}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-[#e5e7eb] hover:bg-white disabled:opacity-40 transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-xs text-[#6b7280] px-1">
                {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => updateUrl({ page: String(Math.min(totalPages - 1, page + 1)) })}
                disabled={page >= totalPages - 1}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-[#e5e7eb] hover:bg-white disabled:opacity-40 transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
