'use client'

import { useState, useEffect, useCallback } from 'react'
import { BarChart2, Download, TrendingUp, TrendingDown, Receipt, DollarSign } from 'lucide-react'
import { toast } from 'sonner'

interface AccountingStats {
  total_revenue: number
  total_refunds: number
  gst_collected: number
  net_revenue: number
}

interface LedgerEntry {
  id: string
  date: string
  type: 'revenue' | 'refund' | 'expense'
  reference: string
  description: string
  amount: number
}

const TYPE_BADGES: Record<string, string> = {
  revenue: 'bg-emerald-100 text-emerald-700',
  refund:  'bg-blue-100 text-blue-700',
  expense: 'bg-amber-100 text-amber-700',
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function AccountingPage() {
  const [stats, setStats]   = useState<AccountingStats | null>(null)
  const [entries, setEntries] = useState<LedgerEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState('')
  const [endDate,   setEndDate]   = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [page, setPage]   = useState(1)
  const [total, setTotal] = useState(0)

  const PAGE_SIZE = 25

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const sp = new URLSearchParams()
      if (startDate)          sp.set('startDate', startDate)
      if (endDate)            sp.set('endDate',   endDate)
      if (typeFilter !== 'all') sp.set('type', typeFilter)
      sp.set('page', String(page))

      const res  = await fetch(`/api/admin/accounting?${sp}`)
      const data = await res.json()
      setStats(data.stats   ?? null)
      setEntries(data.entries ?? [])
      setTotal(data.total   ?? 0)
    } catch {
      toast.error('Failed to load accounting data')
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate, typeFilter, page])

  useEffect(() => { load() }, [load])

  const exportCSV = () => {
    const header = 'Date,Type,Reference,Description,Amount\n'
    const rows   = entries.map(e =>
      `${fmtDate(e.date)},${e.type},${e.reference},"${e.description}",${e.amount}`
    ).join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url
    a.download = `labelwink-accounting-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const statCards = stats ? [
    { label: 'Revenue',       value: stats.total_revenue,  icon: TrendingUp,   color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Refunds',       value: stats.total_refunds,  icon: TrendingDown, color: 'text-blue-600',    bg: 'bg-blue-50' },
    { label: 'GST Collected', value: stats.gst_collected,  icon: Receipt,      color: 'text-amber-600',   bg: 'bg-amber-50' },
    { label: 'Net Revenue',   value: stats.net_revenue,    icon: DollarSign,   color: 'text-[#1C3829]',   bg: 'bg-[#1C3829]/10' },
  ] : []

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart2 size={22} className="text-[#1C3829]" />
          <h1 className="text-xl font-bold text-gray-900">Accounting</h1>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-[#1C3829] text-white text-sm font-semibold rounded-lg hover:bg-[#24472F] transition-colors"
        >
          <Download size={15} />
          Export CSV
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading && !stats
          ? [...Array(4)].map((_, i) => <div key={i} className="h-28 bg-gray-200 rounded-xl animate-pulse" />)
          : statCards.map(c => (
            <div key={c.label} className="bg-white border border-gray-200 rounded-xl p-5">
              <div className={`w-10 h-10 rounded-lg ${c.bg} flex items-center justify-center mb-3`}>
                <c.icon size={18} className={c.color} />
              </div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{c.label}</p>
              <p className={`text-2xl font-bold mt-1 ${c.color}`}>{fmt(c.value)}</p>
            </div>
          ))
        }
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">From</label>
          <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setPage(1) }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-[#1C3829] outline-none" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">To</label>
          <input type="date" value={endDate} onChange={e => { setEndDate(e.target.value); setPage(1) }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-[#1C3829] outline-none" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">Type</label>
          <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1) }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-[#1C3829] outline-none">
            <option value="all">All Types</option>
            <option value="revenue">Revenue</option>
            <option value="refund">Refund</option>
            <option value="expense">Expense</option>
          </select>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold uppercase tracking-wider text-gray-500">
                <th className="text-left px-4 py-3">Date</th>
                <th className="text-left px-4 py-3">Type</th>
                <th className="text-left px-4 py-3">Reference</th>
                <th className="text-left px-4 py-3">Description</th>
                <th className="text-right px-4 py-3">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(5)].map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                    No ledger entries found for the selected period
                  </td>
                </tr>
              ) : (
                entries.map(e => (
                  <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{fmtDate(e.date)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${TYPE_BADGES[e.type]}`}>
                        {e.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-700">{e.reference}</td>
                    <td className="px-4 py-3 text-gray-700 max-w-[240px] truncate">{e.description}</td>
                    <td className={`px-4 py-3 text-right font-semibold ${e.type === 'refund' ? 'text-blue-600' : e.type === 'expense' ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {e.type === 'refund' ? '−' : ''}{fmt(e.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-500">{total} total entries</span>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                className="px-3 py-1 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors">
                Prev
              </button>
              <span className="px-3 py-1 text-xs text-gray-600">{page} / {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
                className="px-3 py-1 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors">
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
