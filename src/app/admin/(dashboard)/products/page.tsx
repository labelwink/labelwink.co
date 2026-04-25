'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Plus, Search, Pencil, Copy, Trash2, Download, X } from 'lucide-react'
import { useToast } from '@/components/admin/Toast'

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
const PAGE_SIZE = 20

function getTotalStock(variants: any[]): number {
  return (variants || []).reduce((s: number, v: any) => s + (v.stock_qty || 0), 0)
}

function SkeletonRow() {
  return (
    <tr className="border-t border-[#e5e7eb] animate-pulse">
      {[...Array(9)].map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-gray-200 rounded w-full" />
        </td>
      ))}
    </tr>
  )
}

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(0)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteName, setDeleteName] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const { showToast, ToastComponent } = useToast()

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.set('search', searchQuery)
      if (category) params.set('category', category)
      if (status) params.set('status', status)
      const res = await fetch(`/api/admin/products?${params}`)
      const data = await res.json()
      setProducts(Array.isArray(data) ? data : [])
    } catch {
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [searchQuery, category, status])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setSearchQuery(search), 300)
    return () => clearTimeout(t)
  }, [search])

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await fetch(`/api/admin/products/${deleteId}`, { method: 'DELETE' })
      showToast('Product deleted', 'success')
      setDeleteId(null)
      fetchProducts()
    } catch {
      showToast('Delete failed', 'error')
    }
  }

  const handleDuplicate = async (product: any) => {
    const { id, product_variants, created_at, updated_at, ...rest } = product
    const copy = {
      ...rest,
      name: `${rest.name} (Copy)`,
      slug: `${rest.slug}-copy-${Date.now()}`,
      visible: false,
    }
    try {
      await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...copy, variants: product.product_variants }),
      })
      showToast('Product duplicated', 'success')
      fetchProducts()
    } catch {
      showToast('Duplicate failed', 'error')
    }
  }

  const exportCSV = () => {
    const rows = [
      ['ID', 'Name', 'Category', 'Price', 'MRP', 'Total Stock', 'Visible'],
      ...products.map(p => [p.id, p.name, p.category || '', p.price || '', p.mrp || '', getTotalStock(p.product_variants), p.visible ? 'Yes' : 'No']),
    ]
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'products.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const paged = products.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const totalPages = Math.ceil(products.length / PAGE_SIZE)

  return (
    <div className="space-y-6">
      {ToastComponent}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a1a]">Products</h1>
          <p className="text-[#6b7280] text-sm mt-0.5">{products.length} total</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 border border-[#e5e7eb] rounded-xl text-sm text-[#6b7280] hover:bg-gray-50 transition-colors">
            <Download size={16} /> Export CSV
          </button>
          <Link href="/admin/products/new" className="flex items-center gap-2 px-4 py-2 bg-[#1b3a34] hover:bg-[#234d44] text-white rounded-xl text-sm font-medium transition-colors">
            <Plus size={16} /> Add Product
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b7280]" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-9 pr-4 py-2 border border-[#e5e7eb] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1b3a34]"
          />
        </div>
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="px-3 py-2 border border-[#e5e7eb] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1b3a34] bg-white"
        >
          <option value="">All Categories</option>
          <option value="Kurtis">Kurtis</option>
          <option value="Co-ord Sets">Co-ord Sets</option>
          <option value="Festive">Festive</option>
          <option value="Casual">Casual</option>
        </select>
        <select
          value={status}
          onChange={e => setStatus(e.target.value)}
          className="px-3 py-2 border border-[#e5e7eb] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1b3a34] bg-white"
        >
          <option value="">All Status</option>
          <option value="visible">Visible</option>
          <option value="hidden">Hidden</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#e5e7eb] rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#1b3a34] text-white text-left">
                <th className="px-4 py-3 w-10"><input type="checkbox" className="rounded" /></th>
                <th className="px-4 py-3 w-14"></th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Price (₹)</th>
                <th className="px-4 py-3">MRP (₹)</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-16 text-[#6b7280]">
                    <Package className="mx-auto mb-2" />
                    <p className="text-sm font-medium">No products yet. <Link href="/admin/products/new" className="text-[#1b3a34] underline">Add your first product</Link></p>
                  </td>
                </tr>
              ) : paged.map((product, i) => {
                const images = (product.images || []) as any[]
                const thumb = images[0]?.url || images[0] || ''
                const stock = getTotalStock(product.product_variants)

                return (
                  <tr key={product.id} className={`border-t border-[#e5e7eb] hover:bg-[#f0fdf4] transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-[#f9f9f9]'}`}>
                    <td className="px-4 py-3">
                      <input type="checkbox" className="rounded" checked={selected.has(product.id)} onChange={e => {
                        const next = new Set(selected)
                        e.target.checked ? next.add(product.id) : next.delete(product.id)
                        setSelected(next)
                      }} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="w-10 h-12 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                        {thumb ? (
                          <img src={thumb} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-gray-300 text-xs">📷</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-[#1a1a1a] max-w-[200px]">
                      <span className="truncate block">{product.name}</span>
                      <span className="text-xs text-[#6b7280]">/products/{product.slug}</span>
                    </td>
                    <td className="px-4 py-3 text-[#6b7280]">{product.category || '—'}</td>
                    <td className="px-4 py-3 font-medium">₹{product.price?.toLocaleString('en-IN') || '—'}</td>
                    <td className="px-4 py-3 text-[#6b7280] line-through">₹{product.mrp?.toLocaleString('en-IN') || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`font-medium ${stock === 0 ? 'text-red-600' : stock <= 5 ? 'text-yellow-600' : 'text-[#16a34a]'}`}>
                        {stock}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${product.visible ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {product.visible ? 'Visible' : 'Hidden'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/products/${product.id}/edit`} className="p-1.5 text-[#6b7280] hover:text-[#1b3a34] hover:bg-green-50 rounded-lg transition-colors" title="Edit">
                          <Pencil size={15} />
                        </Link>
                        <button onClick={() => handleDuplicate(product)} className="p-1.5 text-[#6b7280] hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Duplicate">
                          <Copy size={15} />
                        </button>
                        <button
                          onClick={() => { setDeleteId(product.id); setDeleteName(product.name) }}
                          className="p-1.5 text-[#6b7280] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#e5e7eb] text-sm text-[#6b7280]">
            <span>Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, products.length)} of {products.length}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="px-3 py-1.5 border border-[#e5e7eb] rounded-lg hover:bg-gray-50 disabled:opacity-40">
                ← Prev
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="px-3 py-1.5 border border-[#e5e7eb] rounded-lg hover:bg-gray-50 disabled:opacity-40">
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4">
            <h3 className="font-semibold text-lg text-[#1a1a1a] mb-2">Delete Product</h3>
            <p className="text-[#6b7280] text-sm mb-6">
              Delete <strong>&ldquo;{deleteName}&rdquo;</strong>? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 px-4 py-2 border border-[#e5e7eb] rounded-xl text-sm font-medium hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleDelete} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Fix missing import
function Package({ className }: { className?: string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.29 7 12 12 20.71 7" /><line x1="12" x2="12" y1="22" y2="12" /></svg>
}
