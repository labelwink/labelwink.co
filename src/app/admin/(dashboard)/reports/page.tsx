'use client'

import { useState, useEffect } from 'react'
import { FileText, TrendingUp, Package, Download, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { formatIndianCurrency } from '@/lib/invoice-helpers'

type Tab = 'gst' | 'sales' | 'stock'

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('gst')

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#1a1a1a]">Reports & Analytics</h1>
        <p className="text-muted-foreground mt-1 text-[#1a1a1a]/70">
          Generate compliance reports, sales insights, and manage inventory.
        </p>
      </div>

      <div className="flex space-x-1 border-b border-[#1a1a1a]/10">
        {[
          { id: 'gst', label: 'GST Report', icon: FileText },
          { id: 'sales', label: 'Sales Insights', icon: TrendingUp },
          { id: 'stock', label: 'Stock Report', icon: Package },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as Tab)}
            className={`flex items-center space-x-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === t.id
                ? 'border-[#c9a84c] text-[#c9a84c] font-medium'
                : 'border-transparent text-[#1a1a1a]/60 hover:text-[#1a1a1a] hover:bg-[#1a1a1a]/5'
            }`}
          >
            <t.icon className="h-4 w-4" />
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      <div className="pt-4">
        {activeTab === 'gst' && <GstReport />}
        {activeTab === 'sales' && <SalesReport />}
        {activeTab === 'stock' && <StockReport />}
      </div>
    </div>
  )
}

// ==========================================
// 1. GST REPORT
// ==========================================
function GstReport() {
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any>(null)

  const fetchGst = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/reports/gst?month=${month}&year=${year}`)
      const json = await res.json()
      setData(json)
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  useEffect(() => { fetchGst() }, [month, year])

  const handleExport = () => {
    window.location.href = `/api/admin/reports/gst?format=csv&month=${month}&year=${year}`
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div className="flex space-x-4 items-end">
          <div>
            <label className="block text-sm font-medium text-[#1a1a1a]/70 mb-1">Month</label>
            <select value={month} onChange={e => setMonth(Number(e.target.value))} className="border border-[#1a1a1a]/20 rounded-md px-3 py-2 bg-[#faf7f2] focus:outline-none focus:border-[#c9a84c]">
              {Array.from({ length: 12 }).map((_, i) => (
                <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1a1a1a]/70 mb-1">Year</label>
            <select value={year} onChange={e => setYear(Number(e.target.value))} className="border border-[#1a1a1a]/20 rounded-md px-3 py-2 bg-[#faf7f2] focus:outline-none focus:border-[#c9a84c]">
              {[2024, 2025, 2026, 2027].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <button onClick={fetchGst} className="bg-[#1a1a1a] text-white px-4 py-2 rounded-md hover:bg-[#1a1a1a]/90 transition-colors">
            Generate
          </button>
        </div>
        <button onClick={handleExport} className="flex items-center space-x-2 bg-white border border-[#1a1a1a]/20 px-4 py-2 rounded-md hover:bg-[#faf7f2] transition-colors">
          <Download className="h-4 w-4" />
          <span>Download CSV</span>
        </button>
      </div>

      {loading ? (
        <div className="h-40 flex items-center justify-center text-[#1a1a1a]/50">Loading GST data...</div>
      ) : data?.summary ? (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="bg-white p-6 rounded-xl border border-[#1a1a1a]/10 shadow-sm">
              <p className="text-sm font-medium text-[#1a1a1a]/60">Total Invoices</p>
              <h3 className="text-2xl font-bold text-[#1a1a1a] mt-1">{data.summary.total_invoices}</h3>
              <p className="text-xs text-[#1a1a1a]/50 mt-1">{data.summary.exempt_count} exempt</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-[#1a1a1a]/10 shadow-sm">
              <p className="text-sm font-medium text-[#1a1a1a]/60">Total Taxable</p>
              <h3 className="text-2xl font-bold text-[#1a1a1a] mt-1">{formatIndianCurrency(data.summary.total_taxable)}</h3>
            </div>
            <div className="bg-white p-6 rounded-xl border border-[#1a1a1a]/10 shadow-sm">
              <p className="text-sm font-medium text-[#1a1a1a]/60">Total GST Collected</p>
              <h3 className="text-2xl font-bold text-[#c9a84c] mt-1">{formatIndianCurrency(data.summary.total_gst)}</h3>
            </div>
            <div className="bg-white p-6 rounded-xl border border-[#1a1a1a]/10 shadow-sm">
              <p className="text-sm font-medium text-[#1a1a1a]/60">GST Split</p>
              <div className="mt-2 space-y-1 text-sm">
                <div className="flex justify-between"><span>CGST:</span> <span>{formatIndianCurrency(data.summary.total_cgst)}</span></div>
                <div className="flex justify-between"><span>SGST:</span> <span>{formatIndianCurrency(data.summary.total_sgst)}</span></div>
                <div className="flex justify-between"><span>IGST:</span> <span>{formatIndianCurrency(data.summary.total_igst)}</span></div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#1a1a1a]/10 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-[#faf7f2] border-b border-[#1a1a1a]/10 text-[#1a1a1a]/70 font-medium">
                  <tr>
                    <th className="px-4 py-3">Invoice #</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">State</th>
                    <th className="px-4 py-3 text-right">Taxable</th>
                    <th className="px-4 py-3 text-right">CGST</th>
                    <th className="px-4 py-3 text-right">SGST</th>
                    <th className="px-4 py-3 text-right">IGST</th>
                    <th className="px-4 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1a1a1a]/5">
                  {data.invoices.map((inv: any) => (
                    <tr key={inv.invoice_number} className="hover:bg-[#faf7f2]/50">
                      <td className="px-4 py-3 font-medium">{inv.invoice_number}</td>
                      <td className="px-4 py-3">{new Date(inv.date).toLocaleDateString()}</td>
                      <td className="px-4 py-3">{inv.customer_name}</td>
                      <td className="px-4 py-3">
                        {inv.customer_state}
                        <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded ${inv.igst > 0 ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                          {inv.igst > 0 ? 'INTER' : 'INTRA'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">{formatIndianCurrency(inv.taxable_value)}</td>
                      <td className="px-4 py-3 text-right">{formatIndianCurrency(inv.cgst)}</td>
                      <td className="px-4 py-3 text-right">{formatIndianCurrency(inv.sgst)}</td>
                      <td className="px-4 py-3 text-right">{formatIndianCurrency(inv.igst)}</td>
                      <td className="px-4 py-3 text-right font-medium">{formatIndianCurrency(inv.invoice_total)}</td>
                    </tr>
                  ))}
                  {data.invoices.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center text-[#1a1a1a]/50">No invoices found for this period.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}

// ==========================================
// 2. SALES REPORT
// ==========================================
function SalesReport() {
  const [period, setPeriod] = useState<'month' | 'quarter' | 'year'>('month')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any>(null)

  const fetchSales = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/reports/sales?period=${period}`)
      const json = await res.json()
      setData(json)
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  useEffect(() => { fetchSales() }, [period])

  const handleExport = () => {
    window.location.href = `/api/admin/reports/sales?format=csv&period=${period}`
  }

  const DOW_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  let bestDay = 'N/A'
  if (data?.orders_by_dow?.length > 0) {
    const max = [...data.orders_by_dow].sort((a, b) => b.count - a.count)[0]
    bestDay = DOW_NAMES[max.dow]
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <label className="block text-sm font-medium text-[#1a1a1a]/70 mb-1">Period</label>
          <select value={period} onChange={e => setPeriod(e.target.value as any)} className="border border-[#1a1a1a]/20 rounded-md px-3 py-2 bg-[#faf7f2] focus:outline-none focus:border-[#c9a84c]">
            <option value="month">Last 30 Days</option>
            <option value="quarter">Last 90 Days</option>
            <option value="year">Last 365 Days</option>
          </select>
        </div>
        <button onClick={handleExport} className="flex items-center space-x-2 bg-white border border-[#1a1a1a]/20 px-4 py-2 rounded-md hover:bg-[#faf7f2] transition-colors">
          <Download className="h-4 w-4" />
          <span>Download CSV</span>
        </button>
      </div>

      {loading ? (
        <div className="h-40 flex items-center justify-center text-[#1a1a1a]/50">Loading sales data...</div>
      ) : data ? (
        <div className="grid gap-6 md:grid-cols-2">
          
          {/* Revenue by Collection */}
          <div className="bg-white p-6 rounded-xl border border-[#1a1a1a]/10 shadow-sm md:col-span-2">
            <h3 className="font-semibold text-[#1a1a1a] mb-4">Revenue by Collection</h3>
            <div className="space-y-3">
              {data.revenue_by_collection.length > 0 ? data.revenue_by_collection.map((c: any, i: number) => {
                const maxRev = Math.max(...data.revenue_by_collection.map((x: any) => x.revenue))
                const pct = maxRev > 0 ? (c.revenue / maxRev) * 100 : 0
                return (
                  <div key={i} className="flex items-center space-x-4">
                    <div className="w-32 text-sm text-[#1a1a1a]/80 truncate">{c.name}</div>
                    <div className="flex-1 bg-[#faf7f2] h-6 rounded-md overflow-hidden relative">
                      <div className="absolute top-0 left-0 h-full bg-[#c9a84c] rounded-md transition-all duration-1000" style={{ width: `${pct}%` }}></div>
                    </div>
                    <div className="w-24 text-right text-sm font-medium">{formatIndianCurrency(c.revenue)}</div>
                  </div>
                )
              }) : <div className="text-sm text-[#1a1a1a]/50">No collection data for this period.</div>}
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-white p-6 rounded-xl border border-[#1a1a1a]/10 shadow-sm">
            <h3 className="font-semibold text-[#1a1a1a] mb-4">Top Products</h3>
            <div className="space-y-3">
              {data.top_products.slice(0, 5).map((p: any, i: number) => (
                <div key={i} className="flex justify-between items-center text-sm border-b border-[#1a1a1a]/5 pb-2 last:border-0">
                  <div className="flex items-center space-x-2 truncate pr-4">
                    <span className="text-[#1a1a1a]/40 font-mono w-4">{i + 1}.</span>
                    <span className="truncate">{p.name}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-medium text-[#1a1a1a]">{formatIndianCurrency(p.revenue)}</div>
                    <div className="text-xs text-[#1a1a1a]/50">{p.units_sold} units</div>
                  </div>
                </div>
              ))}
              {data.top_products.length === 0 && <div className="text-sm text-[#1a1a1a]/50">No product sales yet.</div>}
            </div>
          </div>

          {/* Highlights */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-[#1a1a1a]/10 shadow-sm flex items-center space-x-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-full">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#1a1a1a]/60">Returns & Cancellations</p>
                <div className="flex space-x-4 mt-1 text-sm">
                  <div><span className="font-semibold">{data.returns_cancellations.cancelled_count}</span> Cancelled ({formatIndianCurrency(data.returns_cancellations.cancelled_value)})</div>
                  <div><span className="font-semibold">{data.returns_cancellations.return_count}</span> Returns ({formatIndianCurrency(data.returns_cancellations.return_value)})</div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-[#1a1a1a]/10 shadow-sm">
              <h3 className="font-semibold text-[#1a1a1a] mb-1">Coupon Performance</h3>
              <div className="mt-4 text-sm divide-y divide-[#1a1a1a]/5">
                {data.coupon_performance.length > 0 ? data.coupon_performance.map((c: any, i: number) => (
                  <div key={i} className="py-2 flex justify-between items-center">
                    <div className="font-mono bg-[#faf7f2] px-2 py-1 rounded text-xs">{c.coupon_code}</div>
                    <div className="text-right">
                      <div><span className="font-medium">{c.uses}</span> uses</div>
                      <div className="text-[#1a1a1a]/60 text-xs">-{formatIndianCurrency(c.total_discount)}</div>
                    </div>
                  </div>
                )) : <div className="text-[#1a1a1a]/50 py-2">No coupons used in this period.</div>}
              </div>
            </div>

            <div className="bg-[#faf7f2] p-4 rounded-xl border border-[#c9a84c]/30 flex items-center space-x-3">
              <span className="text-2xl">📅</span>
              <p className="text-sm text-[#1a1a1a]">
                Your busiest sales day historically is <strong>{bestDay}</strong>. Consider running campaigns around this day!
              </p>
            </div>
          </div>

        </div>
      ) : null}
    </div>
  )
}

// ==========================================
// 3. STOCK REPORT
// ==========================================
function StockReport() {
  const [status, setStatus] = useState<'all' | 'low' | 'out'>('all')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editVal, setEditVal] = useState<string>('')

  const fetchStock = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/reports/stock?status=${status}`)
      const json = await res.json()
      setData(json)
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  useEffect(() => { fetchStock() }, [status])

  const handleExport = () => {
    window.location.href = `/api/admin/reports/stock?format=csv&status=${status}`
  }

  const handleSaveStock = async (variantId: string) => {
    const qty = parseInt(editVal, 10)
    if (isNaN(qty) || qty < 0) {
      setEditingId(null)
      return
    }

    try {
      await fetch(`/api/admin/inventory/${variantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock_qty: qty })
      })
      // Update local state without full refetch
      setData((prev: any) => ({
        ...prev,
        variants: prev.variants.map((v: any) => v.variant_id === variantId ? { ...v, stock_qty: qty, status: qty === 0 ? 'out' : qty <= v.low_stock_threshold ? 'low' : 'ok' } : v)
      }))
    } catch (err) {
      console.error(err)
    }
    setEditingId(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div className="flex space-x-2">
          {[
            { id: 'all', label: 'All SKUs' },
            { id: 'low', label: 'Low Stock ⚠️' },
            { id: 'out', label: 'Out of Stock 🔴' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setStatus(t.id as any)}
              className={`px-4 py-2 rounded-md text-sm transition-colors ${status === t.id ? 'bg-[#1a1a1a] text-white' : 'bg-[#faf7f2] border border-[#1a1a1a]/10 hover:bg-[#1a1a1a]/5 text-[#1a1a1a]/70'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <button onClick={handleExport} className="flex items-center space-x-2 bg-white border border-[#1a1a1a]/20 px-4 py-2 rounded-md hover:bg-[#faf7f2] transition-colors">
          <Download className="h-4 w-4" />
          <span>Download CSV</span>
        </button>
      </div>

      {loading ? (
        <div className="h-40 flex items-center justify-center text-[#1a1a1a]/50">Loading stock data...</div>
      ) : data ? (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="bg-white p-4 rounded-xl border border-[#1a1a1a]/10 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-[#1a1a1a]/60">Total SKUs</p>
                <p className="text-xl font-bold mt-1">{data.summary.total_skus}</p>
              </div>
              <Package className="h-8 w-8 text-[#1a1a1a]/20" />
            </div>
            <div className="bg-red-50 p-4 rounded-xl border border-red-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-red-600/80">Out of Stock</p>
                <p className="text-xl font-bold text-red-600 mt-1">{data.summary.out_of_stock}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-200" />
            </div>
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-amber-600/80">Low Stock</p>
                <p className="text-xl font-bold text-amber-600 mt-1">{data.summary.low_stock}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-amber-200" />
            </div>
            <div className="bg-white p-4 rounded-xl border border-[#1a1a1a]/10 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-[#1a1a1a]/60">Total Stock Value</p>
                <p className="text-xl font-bold text-[#c9a84c] mt-1">{formatIndianCurrency(data.summary.total_stock_value)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-[#c9a84c]/20" />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#1a1a1a]/10 shadow-sm overflow-hidden">
            <div className="p-3 bg-red-50 border-b border-red-100 text-sm text-red-800 flex justify-between items-center">
              <span>Restock Reminder: {data.summary.out_of_stock} SKUs require immediate attention.</span>
              <span className="text-xs opacity-70">Last updated: {new Date().toLocaleTimeString()}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-[#faf7f2] border-b border-[#1a1a1a]/10 text-[#1a1a1a]/70 font-medium">
                  <tr>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">Variant (Size/Color)</th>
                    <th className="px-4 py-3">SKU</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-right">Threshold</th>
                    <th className="px-4 py-3 text-right">Stock Qty</th>
                    <th className="px-4 py-3 text-right">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1a1a1a]/5">
                  {data.variants.map((v: any) => (
                    <tr key={v.variant_id} className="hover:bg-[#faf7f2]/50">
                      <td className="px-4 py-3 font-medium truncate max-w-[200px]">{v.product_name}</td>
                      <td className="px-4 py-3 text-[#1a1a1a]/70">{v.size} {v.color ? `/ ${v.color}` : ''}</td>
                      <td className="px-4 py-3 font-mono text-xs">{v.sku}</td>
                      <td className="px-4 py-3 text-center">
                        {v.status === 'out' ? (
                          <span className="inline-flex items-center space-x-1 text-red-600 bg-red-50 px-2 py-0.5 rounded text-xs font-medium border border-red-100"><XCircle className="h-3 w-3" /><span>Out</span></span>
                        ) : v.status === 'low' ? (
                          <span className="inline-flex items-center space-x-1 text-amber-600 bg-amber-50 px-2 py-0.5 rounded text-xs font-medium border border-amber-100"><AlertTriangle className="h-3 w-3" /><span>Low</span></span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 text-green-600 bg-green-50 px-2 py-0.5 rounded text-xs font-medium border border-green-100"><CheckCircle className="h-3 w-3" /><span>OK</span></span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-[#1a1a1a]/50">{v.low_stock_threshold}</td>
                      <td className="px-4 py-3 text-right">
                        {editingId === v.variant_id ? (
                          <input
                            autoFocus
                            type="number"
                            className="w-16 px-1 py-0.5 border border-[#c9a84c] rounded text-right focus:outline-none"
                            value={editVal}
                            onChange={e => setEditVal(e.target.value)}
                            onBlur={() => handleSaveStock(v.variant_id)}
                            onKeyDown={e => { if (e.key === 'Enter') handleSaveStock(v.variant_id) }}
                          />
                        ) : (
                          <div
                            className="cursor-pointer hover:bg-[#c9a84c]/10 hover:text-[#c9a84c] px-2 py-0.5 rounded transition-colors inline-block"
                            onClick={() => { setEditingId(v.variant_id); setEditVal(String(v.stock_qty)) }}
                            title="Click to edit stock"
                          >
                            <span className={v.stock_qty === 0 ? 'text-red-600 font-bold' : v.stock_qty <= v.low_stock_threshold ? 'text-amber-600 font-bold' : ''}>
                              {v.stock_qty}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">{formatIndianCurrency(v.stock_value)}</td>
                    </tr>
                  ))}
                  {data.variants.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-[#1a1a1a]/50">No products found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}
