'use client'

import { useState, useEffect, useCallback, useTransition } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  Search, Download, ChevronLeft, ChevronRight,
  ShoppingBag, RefreshCw,
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { ORDER_STATUS_COLORS, ORDER_STATUSES } from '@/lib/utils/constants'
import type { OrderStatus } from '@/lib/utils/constants'

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
}

const PAGE_SIZE = 25

export default function OrdersPage() {
  const router     = useRouter()
  const pathname   = usePathname()
  const searchParams = useSearchParams()

  const [orders,     setOrders]     = useState<Order[]>([])
  const [total,      setTotal]      = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading,    setLoading]    = useState(true)
  const [isPending,  startTransition] = useTransition()

  // Derive filter state from URL
  const status = searchParams.get('status') ?? ''
  const search = searchParams.get('search') ?? ''
  const page   = Number(searchParams.get('page') ?? '0')

  const updateUrl = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString())
    for (const [k, v] of Object.entries(updates)) {
      if (v) params.set(k, v)
      else params.delete(k)
    }
    startTransition(() => router.push(`${pathname}?${params}`))
  }

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page) })
      if (status) params.set('status', status)
      if (search) params.set('search', search)
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
  }, [status, search, page])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  // Export CSV
  const exportCSV = () => {
    const headers = ['Order ID', 'Customer', 'Email', 'Phone', 'Total', 'Status', 'Payment', 'Carrier', 'Tracking', 'Date']
    const rows = orders.map(o => [
      o.id.slice(0, 8).toUpperCase(),
      o.customer_name ?? '',
      o.customer_email ?? '',
      o.customer_phone ?? '',
      o.total,
      o.status,
      o.payment_status ?? '',
      o.shipping_carrier ?? '',
      o.tracking_number ?? '',
      new Date(o.created_at).toLocaleDateString('en-IN'),
    ])
    const csv = [headers, ...rows].map(r => r.map(String).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url
    a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
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

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1a1a1a]">Orders</h1>
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
            disabled={orders.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1b3a34] text-white rounded-lg text-xs font-medium hover:bg-[#16312b] disabled:opacity-50 transition-colors"
          >
            <Download size={13} /> Export CSV
          </button>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => updateUrl({ status: tab.value, page: '' })}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              status === tab.value
                ? 'bg-[#1b3a34] text-white shadow-sm'
                : 'bg-white border border-[#e5e7eb] text-[#6b7280] hover:border-[#1b3a34]/30 hover:text-[#1a1a1a]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
        <input
          type="text"
          defaultValue={search}
          onChange={e => {
            const val = e.target.value
            clearTimeout((window as unknown as { _st?: ReturnType<typeof setTimeout> })._st)
            ;(window as unknown as { _st?: ReturnType<typeof setTimeout> })._st = setTimeout(
              () => updateUrl({ search: val, page: '' }), 350
            )
          }}
          placeholder="Search by name, email, phone or tracking..."
          className="w-full pl-9 pr-4 py-2 border border-[#e5e7eb] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1b3a34]/30 focus:border-[#1b3a34]"
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-[#e5e7eb] rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af] border-b border-[#e5e7eb] bg-[#f9f9f9]">
                <th className="text-left px-5 py-3">Order</th>
                <th className="text-left px-4 py-3">Customer</th>
                <th className="text-left px-4 py-3">Phone</th>
                <th className="text-right px-4 py-3">Amount</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Payment</th>
                <th className="text-left px-4 py-3">Carrier</th>
                <th className="text-left px-4 py-3">Date</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f3f4f6]">
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {[...Array(9)].map((_, j) => (
                      <td key={j} className="px-4 py-3.5">
                        <div className="h-3.5 bg-gray-100 rounded w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-16">
                    <ShoppingBag size={32} className="mx-auto text-gray-200 mb-3" />
                    <p className="text-sm text-[#6b7280]">No orders found</p>
                    {(status || search) && (
                      <button
                        onClick={() => updateUrl({ status: '', search: '', page: '' })}
                        className="text-xs text-[#1b3a34] underline mt-2"
                      >
                        Clear filters
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                orders.map(o => {
                  const statusKey = (o.status ?? 'pending') as OrderStatus
                  const badgeCls = ORDER_STATUS_COLORS[statusKey] ?? 'bg-gray-100 text-gray-600'
                  const isPaid   = o.payment_status === 'paid'
                  return (
                    <tr
                      key={o.id}
                      className="hover:bg-[#f9fafb] transition-colors cursor-pointer"
                      onClick={() => router.push(`/admin/orders/${o.id}`)}
                    >
                      <td className="px-5 py-3.5">
                        <span className="font-mono font-semibold text-[#1b3a34] text-xs">
                          #{o.id.slice(0, 8).toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 max-w-[160px]">
                        <p className="font-medium text-[#1a1a1a] truncate text-xs">{o.customer_name || '—'}</p>
                        {o.customer_email && (
                          <p className="text-[10px] text-[#9ca3af] truncate">{o.customer_email}</p>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-[#6b7280] text-xs">{o.customer_phone || '—'}</td>
                      <td className="px-4 py-3.5 text-right">
                        <span className="font-semibold text-[#1a1a1a] text-xs">{formatCurrency(Number(o.total ?? 0))}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${badgeCls}`}>
                          {statusKey.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`text-[10px] font-semibold ${isPaid ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {o.payment_status ?? '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-[#6b7280] text-xs">
                        {o.shipping_carrier || (o.tracking_number ? '—' : '')}
                        {o.tracking_number && (
                          <span className="block font-mono text-[9px] text-[#9ca3af] truncate max-w-[80px]">
                            {o.tracking_number}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-[#9ca3af] text-xs whitespace-nowrap">
                        {formatDate(o.created_at)}
                      </td>
                      <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                        <Link
                          href={`/admin/orders/${o.id}`}
                          className="text-[#1b3a34] hover:underline text-xs font-medium whitespace-nowrap"
                        >
                          View →
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
