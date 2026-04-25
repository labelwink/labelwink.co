'use client'

import { useState, useEffect } from 'react'
import { Download } from 'lucide-react'
import { useToast } from '@/components/admin/Toast'

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
const LOW_STOCK = 5

type Filter = 'all' | 'low' | 'out'

function getCellStyle(qty: number | null) {
  if (qty === null) return ''
  if (qty === 0) return 'bg-red-50 text-red-700'
  if (qty <= LOW_STOCK) return 'bg-yellow-50 text-yellow-700'
  return 'bg-green-50 text-green-700'
}

function getStatus(variants: any[]): { label: string; cls: string } {
  const total = variants.reduce((s: number, v: any) => s + (v.stock_qty || 0), 0)
  const out = variants.every((v: any) => v.stock_qty === 0)
  if (out || total === 0) return { label: 'Out of Stock', cls: 'bg-red-100 text-red-700' }
  if (variants.some((v: any) => v.stock_qty > 0 && v.stock_qty <= LOW_STOCK)) return { label: 'Low Stock', cls: 'bg-yellow-100 text-yellow-700' }
  return { label: 'In Stock', cls: 'bg-green-100 text-green-700' }
}

export default function InventoryPage() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')
  const [saving, setSaving] = useState<string | null>(null)
  const { showToast, ToastComponent } = useToast()

  useEffect(() => {
    fetch('/api/admin/products')
      .then(r => r.json())
      .then(data => setProducts(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false))
  }, [])

  const filtered = products.filter(p => {
    if (filter === 'out') return (p.product_variants || []).every((v: any) => v.stock_qty === 0)
    if (filter === 'low') return (p.product_variants || []).some((v: any) => v.stock_qty > 0 && v.stock_qty <= LOW_STOCK)
    return true
  })

  const updateStock = async (productId: string, size: string, qty: number) => {
    const key = `${productId}-${size}`
    setSaving(key)
    try {
      await fetch(`/api/admin/products/${productId}/variants/${encodeURIComponent(size)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock_qty: qty }),
      })
      setProducts(prev => prev.map(p =>
        p.id === productId
          ? { ...p, product_variants: (p.product_variants || []).map((v: any) => v.size === size ? { ...v, stock_qty: qty } : v) }
          : p
      ))
      showToast('Stock updated', 'success')
    } catch {
      showToast('Update failed', 'error')
    } finally {
      setSaving(null)
    }
  }

  const exportCSV = () => {
    const rows = [['Product', ...SIZES, 'Total', 'Status']]
    for (const p of products) {
      const varMap = Object.fromEntries((p.product_variants || []).map((v: any) => [v.size, v.stock_qty]))
      const total = SIZES.reduce((s, sz) => s + (varMap[sz] ?? 0), 0)
      const status = getStatus(p.product_variants || []).label
      rows.push([p.name, ...SIZES.map(sz => varMap[sz] ?? '—'), String(total), status])
    }
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'inventory.csv'
    a.click()
  }

  return (
    <div className="space-y-6">
      {ToastComponent}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1a1a1a]">Inventory Management</h1>
        <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 border border-[#e5e7eb] rounded-xl text-sm text-[#6b7280] hover:bg-gray-50">
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {(['all', 'low', 'out'] as Filter[]).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === f ? 'bg-white shadow text-[#1a1a1a]' : 'text-[#6b7280] hover:text-[#1a1a1a]'}`}>
            {f === 'all' ? 'All' : f === 'low' ? 'Low Stock' : 'Out of Stock'}
          </button>
        ))}
      </div>

      <div className="bg-white border border-[#e5e7eb] rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#1b3a34] text-white">
                <th className="px-4 py-3 text-left">Product</th>
                {SIZES.map(s => <th key={s} className="px-3 py-3 text-center">{s}</th>)}
                <th className="px-4 py-3 text-center">Total</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-t border-[#e5e7eb] animate-pulse">
                    {[...Array(SIZES.length + 3)].map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-200 rounded" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={SIZES.length + 3} className="text-center py-12 text-[#6b7280]">No products found</td></tr>
              ) : filtered.map((p, pi) => {
                const varMap = Object.fromEntries((p.product_variants || []).map((v: any) => [v.size, v]))
                const total = SIZES.reduce((s, sz) => s + (varMap[sz]?.stock_qty || 0), 0)
                const status = getStatus(p.product_variants || [])
                const images = p.images || []
                const thumb = images[0]?.url || images[0] || ''

                return (
                  <tr key={p.id} className={`border-t border-[#e5e7eb] ${pi % 2 === 0 ? 'bg-white' : 'bg-[#f9f9f9]'}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-10 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                          {thumb && <img src={thumb} alt="" className="w-full h-full object-cover" />}
                        </div>
                        <span className="font-medium text-[#1a1a1a] max-w-[180px] truncate">{p.name}</span>
                      </div>
                    </td>
                    {SIZES.map(sz => {
                      const variant = varMap[sz]
                      const key = `${p.id}-${sz}`
                      if (!variant) return <td key={sz} className="px-3 py-3 text-center text-[#6b7280]">—</td>
                      return (
                        <td key={sz} className={`px-1 py-2 text-center ${getCellStyle(variant.stock_qty)}`}>
                          <input
                            type="number" min="0"
                            defaultValue={variant.stock_qty}
                            onBlur={e => {
                              const val = Number(e.target.value)
                              if (val !== variant.stock_qty) updateStock(p.id, sz, val)
                            }}
                            className={`w-16 text-center text-sm border-0 bg-transparent focus:outline-none focus:ring-2 focus:ring-[#1b3a34] rounded p-1 ${saving === key ? 'opacity-50' : ''}`}
                          />
                        </td>
                      )
                    })}
                    <td className="px-4 py-3 text-center font-bold text-[#1a1a1a]">{total}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${status.cls}`}>{status.label}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
