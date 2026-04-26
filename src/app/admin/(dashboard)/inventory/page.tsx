'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Download, RefreshCw, AlertTriangle,
  Package, Search, TrendingDown,
} from 'lucide-react'
import { useToast } from '@/components/admin/Toast'

// ── Types ──────────────────────────────────────────────────────────────────────
interface Variant {
  id: string
  size: string
  stock_qty: number
  sku: string | null
  low_stock_threshold: number
}

interface ProductRow {
  id: string
  name: string
  category: string | null
  product_variants: Variant[]
  product_images: { url: string; is_cover: boolean; sort_order: number }[]
}

type FilterType = 'all' | 'low' | 'out'

const ALL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'Free Size']
const LOW_STOCK_DEFAULT = 5

function getStatus(variants: Variant[]): { label: string; cls: string } {
  const total = variants.reduce((s, v) => s + (v.stock_qty ?? 0), 0)
  if (total === 0) return { label: 'Out', cls: 'bg-red-100 text-red-700' }
  if (variants.some(v => v.stock_qty > 0 && v.stock_qty <= (v.low_stock_threshold ?? LOW_STOCK_DEFAULT)))
    return { label: 'Low', cls: 'bg-amber-100 text-amber-700' }
  return { label: 'OK', cls: 'bg-emerald-100 text-emerald-700' }
}

function getCellBg(qty: number, threshold: number) {
  if (qty === 0) return 'bg-red-50'
  if (qty <= threshold) return 'bg-amber-50'
  return ''
}

function getCover(imgs: ProductRow['product_images']) {
  if (!imgs?.length) return ''
  return (imgs.find(i => i.is_cover) ?? imgs.sort((a, b) => a.sort_order - b.sort_order)[0])?.url ?? ''
}

export default function InventoryPage() {
  const { showToast, ToastComponent } = useToast()

  const [products, setProducts] = useState<ProductRow[]>([])
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState<FilterType>('all')
  const [search,   setSearch]   = useState('')
  const [saving,   setSaving]   = useState<Set<string>>(new Set())

  const fetchInventory = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch all products (max 500) with variants + images
      const res  = await fetch('/api/admin/products?page=0')
      const data = await res.json()
      setProducts(data.products ?? [])
    } catch {
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchInventory() }, [fetchInventory])

  // Derive the sizes actually used across all products
  const usedSizes = ALL_SIZES.filter(sz =>
    products.some(p => p.product_variants?.some(v => v.size === sz))
  )

  // Filter + search
  const displayed = products.filter(p => {
    const vs = p.product_variants ?? []
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase())
    if (!matchSearch) return false
    if (filter === 'out') return vs.every(v => v.stock_qty === 0) || vs.length === 0
    if (filter === 'low') return vs.some(v => v.stock_qty > 0 && v.stock_qty <= (v.low_stock_threshold ?? LOW_STOCK_DEFAULT))
    return true
  })

  const lowStockCount = products.filter(p =>
    p.product_variants?.some(v => v.stock_qty > 0 && v.stock_qty <= (v.low_stock_threshold ?? LOW_STOCK_DEFAULT))
  ).length

  const outOfStockCount = products.filter(p =>
    (p.product_variants?.every(v => v.stock_qty === 0)) || p.product_variants?.length === 0
  ).length

  const updateStock = async (productId: string, size: string, qty: number) => {
    const key = `${productId}-${size}`
    setSaving(prev => new Set(prev).add(key))
    try {
      const res = await fetch(
        `/api/admin/products/${productId}/variants/${encodeURIComponent(size)}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stock_qty: qty }),
        }
      )
      if (!res.ok) throw new Error()
      setProducts(prev => prev.map(p =>
        p.id !== productId ? p : {
          ...p,
          product_variants: p.product_variants.map(v =>
            v.size === size ? { ...v, stock_qty: qty } : v
          ),
        }
      ))
      showToast('Stock updated', 'success')
    } catch {
      showToast('Update failed', 'error')
    } finally {
      setSaving(prev => { const n = new Set(prev); n.delete(key); return n })
    }
  }

  const exportCSV = () => {
    const h    = ['Product', 'Category', ...usedSizes, 'Total', 'Status']
    const rows = products.map(p => {
      const varMap = Object.fromEntries((p.product_variants ?? []).map(v => [v.size, v.stock_qty]))
      const total  = usedSizes.reduce((s, sz) => s + (varMap[sz] ?? 0), 0)
      return [
        p.name,
        p.category ?? '',
        ...usedSizes.map(sz => varMap[sz] !== undefined ? String(varMap[sz]) : '—'),
        String(total),
        getStatus(p.product_variants ?? []).label,
      ]
    })
    const csv  = [h, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a    = document.createElement('a')
    a.href = URL.createObjectURL(blob); a.download = `inventory-${Date.now()}.csv`; a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div className="space-y-5">
      {ToastComponent}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1a1a1a]">Inventory</h1>
          <p className="text-xs text-[#6b7280] mt-0.5">{products.length} products</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchInventory} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-[#e5e7eb] rounded-lg text-xs text-[#6b7280] hover:bg-gray-50 disabled:opacity-50 transition-colors">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button onClick={exportCSV} disabled={products.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-[#e5e7eb] rounded-lg text-xs text-[#6b7280] hover:bg-gray-50 disabled:opacity-50 transition-colors">
            <Download size={13} /> Export
          </button>
        </div>
      </div>

      {/* Alert strip */}
      {(lowStockCount > 0 || outOfStockCount > 0) && (
        <div className="flex gap-3 flex-wrap">
          {outOfStockCount > 0 && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs font-semibold">
              <AlertTriangle size={12} /> {outOfStockCount} product{outOfStockCount !== 1 ? 's' : ''} out of stock
            </div>
          )}
          {lowStockCount > 0 && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 px-3 py-2 rounded-lg text-xs font-semibold">
              <TrendingDown size={12} /> {lowStockCount} product{lowStockCount !== 1 ? 's' : ''} low on stock
            </div>
          )}
        </div>
      )}

      {/* Filters + search */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          {([
            { value: 'all', label: `All (${products.length})` },
            { value: 'low', label: `Low (${lowStockCount})` },
            { value: 'out', label: `Out (${outOfStockCount})` },
          ] as { value: FilterType; label: string }[]).map(f => (
            <button key={f.value} onClick={() => setFilter(f.value)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === f.value ? 'bg-white shadow text-[#1a1a1a]' : 'text-[#6b7280] hover:text-[#1a1a1a]'
              }`}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Filter by product name…"
            className="w-full pl-8 pr-3 py-2 border border-[#e5e7eb] rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#1b3a34]/20"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#e5e7eb] rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af] border-b border-[#e5e7eb] bg-[#f9f9f9]">
                <th className="text-left px-4 py-3 min-w-[180px]">Product</th>
                {usedSizes.map(sz => (
                  <th key={sz} className="px-2 py-3 text-center min-w-[68px]">{sz}</th>
                ))}
                <th className="px-3 py-3 text-center">Total</th>
                <th className="px-3 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f3f4f6]">
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {[...Array(usedSizes.length + 3)].map((_, j) => (
                      <td key={j} className="px-3 py-3.5">
                        <div className="h-3.5 bg-gray-100 rounded" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : displayed.length === 0 ? (
                <tr>
                  <td colSpan={usedSizes.length + 3} className="text-center py-16">
                    <Package size={28} className="mx-auto text-gray-200 mb-3" />
                    <p className="text-sm text-[#6b7280]">
                      {search ? `No products matching "${search}"` : 'No products found'}
                    </p>
                  </td>
                </tr>
              ) : displayed.map(p => {
                const varMap = Object.fromEntries((p.product_variants ?? []).map(v => [v.size, v]))
                const total  = usedSizes.reduce((s, sz) => s + (varMap[sz]?.stock_qty ?? 0), 0)
                const status = getStatus(p.product_variants ?? [])
                const cover  = getCover(p.product_images)

                return (
                  <tr key={p.id} className="hover:bg-[#f9fafb] transition-colors">
                    {/* Product name */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center">
                          {cover
                            ? <img src={cover} alt="" className="w-full h-full object-cover" />
                            : <Package size={12} className="text-gray-300" />
                          }
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-[#1a1a1a] truncate max-w-[160px]">{p.name}</p>
                          <p className="text-[10px] text-[#9ca3af]">{p.category || '—'}</p>
                        </div>
                      </div>
                    </td>

                    {/* Size cells */}
                    {usedSizes.map(sz => {
                      const variant  = varMap[sz]
                      const key      = `${p.id}-${sz}`
                      const isSaving = saving.has(key)

                      if (!variant) return (
                        <td key={sz} className="px-2 py-3.5 text-center text-[10px] text-[#d1d5db]">—</td>
                      )

                      const threshold = variant.low_stock_threshold ?? LOW_STOCK_DEFAULT
                      return (
                        <td key={sz} className={`px-1 py-2 text-center ${getCellBg(variant.stock_qty, threshold)}`}>
                          <input
                            type="number" min="0"
                            defaultValue={variant.stock_qty}
                            disabled={isSaving}
                            onBlur={e => {
                              const val = Number(e.target.value)
                              if (val !== variant.stock_qty) updateStock(p.id, sz, val)
                            }}
                            className={`w-14 text-center text-xs border border-transparent rounded-lg py-1 bg-transparent focus:outline-none focus:ring-2 focus:ring-[#1b3a34]/30 focus:bg-white focus:border-[#1b3a34]/20 transition-all ${
                              isSaving ? 'opacity-40' : ''
                            } ${
                              variant.stock_qty === 0 ? 'font-bold text-red-600' :
                              variant.stock_qty <= threshold ? 'font-semibold text-amber-600' :
                              'text-[#1a1a1a]'
                            }`}
                          />
                        </td>
                      )
                    })}

                    {/* Total */}
                    <td className="px-3 py-3.5 text-center text-xs font-bold text-[#1a1a1a]">{total}</td>

                    {/* Status badge */}
                    <td className="px-3 py-3.5 text-center">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${status.cls}`}>
                        {status.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-[#e5e7eb] bg-[#f9f9f9]">
          <p className="text-[10px] text-[#9ca3af]">
            Click on any stock number and change it, then click away to save instantly.
          </p>
        </div>
      </div>
    </div>
  )
}
