'use client'

import { useState, useEffect, useCallback, useTransition } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Plus, Search, Pencil, Copy, Trash2, Download,
  RefreshCw, ChevronLeft, ChevronRight, Package,
  Eye, EyeOff,
} from 'lucide-react'
import { useToast } from '@/components/admin/Toast'
import { formatCurrency } from '@/lib/utils/format'

// ── Types ────────────────────────────────────────────────────────────────────
interface ProductVariant { id: string; size: string; stock_qty: number }
interface ProductImage   { url: string; is_cover: boolean; sort_order: number }

interface Product {
  id: string
  name: string
  slug: string
  category: string | null
  price: number
  mrp: number
  visible: boolean
  status: string | null
  created_at: string
  product_variants: ProductVariant[]
  product_images: ProductImage[]
}

const PAGE_SIZE = 25

function totalStock(v: ProductVariant[]) {
  return (v ?? []).reduce((s, x) => s + (x.stock_qty ?? 0), 0)
}

function getCover(imgs: ProductImage[]) {
  if (!imgs?.length) return ''
  const cover = imgs.find(i => i.is_cover) ?? imgs.sort((a, b) => a.sort_order - b.sort_order)[0]
  return cover?.url ?? ''
}

// ── Component ────────────────────────────────────────────────────────────────
export default function ProductsContent() {
  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()
  const { showToast, ToastComponent } = useToast()
  const [, startTransition] = useTransition()

  const [products,   setProducts]   = useState<Product[]>([])
  const [total,      setTotal]      = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading,    setLoading]    = useState(true)
  const [deleteId,   setDeleteId]   = useState<string | null>(null)
  const [deleteName, setDeleteName] = useState('')
  const [selected,   setSelected]   = useState<Set<string>>(new Set())
  const [categories, setCategories] = useState<{id:string;name:string;slug:string}[]>([])
  const [toggling,   setToggling]   = useState<Set<string>>(new Set())

  useEffect(() => {
    fetch('/api/storefront/categories').then(r => r.json()).then(d => setCategories(d.categories ?? []))
  }, [])

  // Derive state from URL
  const search   = searchParams.get('search')   ?? ''
  const category = searchParams.get('category') ?? ''
  const visible  = searchParams.get('visible')  ?? ''
  const page     = Number(searchParams.get('page') ?? '0')

  const updateUrl = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString())
    for (const [k, v] of Object.entries(updates)) {
      if (v) params.set(k, v)
      else params.delete(k)
    }
    startTransition(() => router.push(`${pathname}?${params}`))
  }

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const p = new URLSearchParams({ page: String(page) })
      if (search)   p.set('search',   search)
      if (category) p.set('category', category)
      if (visible)  p.set('visible',  visible)
      const res  = await fetch(`/api/admin/products?${p}`)
      const data = await res.json()
      setProducts(data.products ?? [])
      setTotal(data.total ?? 0)
      setTotalPages(data.totalPages ?? 0)
    } catch {
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [search, category, visible, page])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  // ── Actions ──────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/admin/products/${deleteId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      showToast('Product deleted', 'success')
      setDeleteId(null)
      fetchProducts()
    } catch {
      showToast('Delete failed', 'error')
    }
  }

  const handleDuplicate = async (p: Product) => {
    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${p.name} (Copy)`,
          slug: `${p.slug}-copy-${Date.now()}`,
          category: p.category,
          price: p.price,
          mrp: p.mrp,
          visible: false,
          variants: (p.product_variants ?? []).map(v => ({ size: v.size, stock_qty: v.stock_qty })),
        }),
      })
      if (!res.ok) throw new Error()
      showToast('Duplicated — edit to complete', 'success')
      fetchProducts()
    } catch {
      showToast('Duplicate failed', 'error')
    }
  }

  const toggleVisibility = async (p: Product) => {
    setToggling(prev => new Set(prev).add(p.id))
    try {
      const res = await fetch(`/api/admin/products/${p.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visible: !p.visible }),
      })
      if (!res.ok) throw new Error()
      setProducts(prev => prev.map(x => x.id === p.id ? { ...x, visible: !x.visible } : x))
      showToast(p.visible ? 'Product hidden' : 'Product visible', 'success')
    } catch {
      showToast('Toggle failed', 'error')
    } finally {
      setToggling(prev => { const n = new Set(prev); n.delete(p.id); return n })
    }
  }

  const exportCSV = () => {
    const h = ['ID', 'Name', 'Category', 'Price', 'MRP', 'Stock', 'Visible']
    const rows = products.map(p => [
      p.id, p.name, p.category ?? '',
      p.price, p.mrp,
      totalStock(p.product_variants),
      p.visible ? 'Yes' : 'No',
    ])
    const csv  = [h, ...rows].map(r => r.map(String).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = `products-${Date.now()}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  // ── Select all on page ───────────────────────────────────────────────────
  const allPageIds    = products.map(p => p.id)
  const allSelected   = allPageIds.length > 0 && allPageIds.every(id => selected.has(id))
  const toggleAll     = () => {
    setSelected(prev => {
      const n = new Set(prev)
      allSelected ? allPageIds.forEach(id => n.delete(id)) : allPageIds.forEach(id => n.add(id))
      return n
    })
  }

  return (
    <div className="space-y-5 max-w-[1400px]">
      {ToastComponent}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1b3a34]">Products</h1>
          <p className="text-xs text-[#6b7280] mt-0.5">{total.toLocaleString('en-IN')} total</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchProducts} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-[#e5e7eb] rounded-lg text-xs text-[#6b7280] hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button onClick={exportCSV} disabled={products.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-[#e5e7eb] rounded-lg text-xs text-[#6b7280] hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <Download size={13} /> Export
          </button>
          <Link
            href="/admin/products/new"
            className="flex items-center gap-1.5 px-4 py-1.5 bg-[#1b3a34] text-white rounded-lg text-xs font-semibold hover:bg-[#16312b] transition-colors"
          >
            <Plus size={13} /> Add Product
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
          <input
            type="text"
            defaultValue={search}
            onChange={e => {
              const val = e.target.value
              clearTimeout((window as unknown as { _pst?: ReturnType<typeof setTimeout> })._pst)
              ;(window as unknown as { _pst?: ReturnType<typeof setTimeout> })._pst = setTimeout(
                () => updateUrl({ search: val, page: '' }), 350
              )
            }}
            placeholder="Search products…"
            className="w-full pl-9 pr-4 py-2 border border-[#e5e7eb] rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#1b3a34]/20 focus:border-[#1b3a34]"
          />
        </div>

        {/* Category */}
        <select
          value={category}
          onChange={e => updateUrl({ category: e.target.value, page: '' })}
          className="px-3 py-2 border border-[#e5e7eb] rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#1b3a34]/20"
        >
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}
        </select>

        {/* Visibility */}
        <select
          value={visible}
          onChange={e => updateUrl({ visible: e.target.value, page: '' })}
          className="px-3 py-2 border border-[#e5e7eb] rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#1b3a34]/20"
        >
          <option value="">All Status</option>
          <option value="true">Visible</option>
          <option value="false">Hidden</option>
        </select>

        {/* Active filter pills */}
        {(search || category || visible) && (
          <button
            onClick={() => updateUrl({ search: '', category: '', visible: '', page: '' })}
            className="text-xs text-red-500 hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-2 bg-[#1b3a34]/5 border border-[#1b3a34]/20 rounded-lg text-xs">
          <span className="font-medium text-[#1b3a34]">{selected.size} selected</span>
          <button
            onClick={async () => {
              const ids = Array.from(selected)
              await Promise.all(ids.map(id => fetch(`/api/admin/products/${id}`, { method: 'DELETE' })))
              showToast(`${ids.length} products deleted`, 'success')
              setSelected(new Set())
              fetchProducts()
            }}
            className="text-red-600 hover:underline"
          >
            Delete selected
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-[#e5e7eb] rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af] border-b border-[#e5e7eb] bg-[#f9f9f9]">
                <th className="px-4 py-3 w-10">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} className="rounded border-gray-300" />
                </th>
                <th className="px-2 py-3 w-14" />
                <th className="text-left px-3 py-3">Product</th>
                <th className="text-left px-3 py-3">Category</th>
                <th className="text-right px-3 py-3">Price</th>
                <th className="text-right px-3 py-3">MRP</th>
                <th className="text-center px-3 py-3">Stock</th>
                <th className="text-center px-3 py-3">Visibility</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f3f4f6]">
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {[...Array(9)].map((_, j) => (
                      <td key={j} className="px-4 py-3.5">
                        <div className="h-3.5 bg-gray-100 rounded" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-16">
                    <Package size={32} className="mx-auto text-[#1a2e1e] mb-3" />
                    <p className="text-sm text-[#6b7280]">No products found</p>
                    <Link href="/admin/products/new" className="text-xs text-[#1b3a34] underline mt-1 inline-block">
                      Add your first product →
                    </Link>
                  </td>
                </tr>
              ) : (
                products.map(p => {
                  const stock   = totalStock(p.product_variants)
                  const cover   = getCover(p.product_images)
                  const sizes   = (p.product_variants ?? []).map(v => v.size).join(', ')
                  const isLow   = stock > 0 && stock <= 5
                  const isOut   = stock === 0
                  const isToggling = toggling.has(p.id)

                  return (
                    <tr key={p.id} className="hover:bg-[#f9fafb] transition-colors">
                      {/* Checkbox */}
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected.has(p.id)}
                          onChange={e => {
                            const n = new Set(selected)
                            e.target.checked ? n.add(p.id) : n.delete(p.id)
                            setSelected(n)
                          }}
                          className="rounded border-gray-300"
                        />
                      </td>

                      {/* Thumbnail */}
                      <td className="px-2 py-3">
                        <div className="w-10 h-12 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0 relative">
                          <img 
                            src={cover || '/placeholder-product.jpg'} 
                            alt={p.name || ''} 
                            className="w-full h-full object-cover" 
                          />
                        </div>
                      </td>

                      {/* Name + slug */}
                      <td className="px-3 py-3 max-w-[220px]">
                        <p className="font-medium text-[#1b3a34] text-xs truncate">{p.name}</p>
                        <p className="text-[10px] text-[#9ca3af] truncate">/products/{p.slug}</p>
                        {sizes && <p className="text-[10px] text-[#6b7280] mt-0.5">{sizes}</p>}
                      </td>

                      {/* Category */}
                      <td className="px-3 py-3 text-xs text-[#6b7280]">{p.category || '—'}</td>

                      {/* Price */}
                      <td className="px-3 py-3 text-right">
                        <span className="text-xs font-semibold text-[#1b3a34]">{formatCurrency(p.price)}</span>
                      </td>

                      {/* MRP */}
                      <td className="px-3 py-3 text-right">
                        <span className="text-xs text-[#9ca3af] line-through">{formatCurrency(p.mrp)}</span>
                      </td>

                      {/* Stock */}
                      <td className="px-3 py-3 text-center">
                        <span className={`text-xs font-semibold ${
                          isOut ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-emerald-600'
                        }`}>
                          {isOut ? 'Out' : stock}
                        </span>
                      </td>

                      {/* Visibility toggle */}
                      <td className="px-3 py-3 text-center">
                        <button
                          onClick={() => toggleVisibility(p)}
                          disabled={isToggling}
                          title={p.visible ? 'Click to hide' : 'Click to publish'}
                          className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-all ${
                            p.visible
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-gray-50 text-[#9aab9e] border-gray-200 hover:bg-gray-100'
                          } disabled:opacity-50`}
                        >
                          {p.visible
                            ? <><Eye size={9} /> Visible</>
                            : <><EyeOff size={9} /> Hidden</>
                          }
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/admin/products/${p.id}/edit`}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-[#6b7280] hover:text-[#1b3a34] hover:bg-[#1b3a34]/5 transition-colors"
                            title="Edit"
                          >
                            <Pencil size={13} />
                          </Link>
                          <button
                            onClick={() => handleDuplicate(p)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-[#6b7280] hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Duplicate"
                          >
                            <Copy size={13} />
                          </button>
                          <button
                            onClick={() => { setDeleteId(p.id); setDeleteName(p.name) }}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-[#6b7280] hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
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
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-[#e5e7eb] hover:bg-white disabled:opacity-40"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-xs text-[#6b7280] px-1">{page + 1} / {totalPages}</span>
              <button
                onClick={() => updateUrl({ page: String(Math.min(totalPages - 1, page + 1)) })}
                disabled={page >= totalPages - 1}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-[#e5e7eb] hover:bg-white disabled:opacity-40"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Trash2 size={18} className="text-red-600" />
            </div>
            <h3 className="font-semibold text-base text-[#1b3a34] mb-1">Delete Product</h3>
            <p className="text-sm text-[#6b7280] mb-5">
              Delete <strong>&ldquo;{deleteName}&rdquo;</strong>? All variants and images will also be removed. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 px-4 py-2.5 border border-[#e5e7eb] rounded-xl text-sm font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
