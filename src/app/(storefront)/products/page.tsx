'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { SlidersHorizontal, X, Search, LayoutGrid, List, ChevronDown } from 'lucide-react'
import { ProductCatalogCard } from '@/components/product/ProductCatalogCard'
import { CatalogFilterSidebar } from '@/components/storefront/CatalogFilterSidebar'

// ── Types ──────────────────────────────────────────────────────────────────────
interface Variant { id: string; size: string; color: string | null; stock_qty: number; price: number; mrp: number | null; is_active: boolean }
interface Product { id: string; name: string; slug: string; price: number; mrp: number | null; compare_at_price: number | null; images: any; created_at: string; fabric_material: string | null; sleeve_type: string | null; occasion_tags: string[] | null; product_variants: Variant[] }
interface FilterOptions { sizes: string[]; colors: string[]; price_range: { min: number; max: number }; fabrics: string[]; sleeve_types: string[]; occasions: string[] }

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'top_rated', label: 'Top Rated' },
]

const SLEEVE_LABELS: Record<string, string> = {
  sleeveless: 'Sleeveless', half_sleeve: 'Half Sleeve',
  full_sleeve: 'Full Sleeve', '3/4_sleeve': '3/4 Sleeve',
}

function buildParams(raw: Record<string, string | string[] | number | undefined>) {
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(raw)) {
    if (!v || (Array.isArray(v) && !v.length)) continue
    p.set(k, Array.isArray(v) ? v.join(',') : String(v))
  }
  return p
}

function SkeletonCard() {
  return (
    <div className="flex flex-col gap-3 animate-pulse">
      <div className="aspect-[3/4] bg-[#1a1a1a]/10 rounded-sm" />
      <div className="h-3 bg-[#1a1a1a]/10 rounded w-3/4" />
      <div className="h-3 bg-[#1a1a1a]/8 rounded w-1/2" />
    </div>
  )
}

export default function ProductsPage() {
  const router = useRouter()
  const pathname = usePathname()
  const sp = useSearchParams()

  // ── URL → state ──────────────────────────────────────────────────────────
  const getParam = (k: string) => sp.get(k) ?? ''
  const getArray = (k: string) => sp.get(k)?.split(',').filter(Boolean) ?? []

  const [q, setQ] = useState(getParam('q'))
  const [sort, setSort] = useState(getParam('sort') || 'newest')
  const [sizes, setSizes] = useState<string[]>(getArray('size'))
  const [colors, setColors] = useState<string[]>(getArray('color'))
  const [occasions, setOccasions] = useState<string[]>(getArray('occasion'))
  const [fabrics, setFabrics] = useState<string[]>(getArray('fabric'))
  const [sleeve, setSleeve] = useState(getParam('sleeve'))
  const [minPrice, setMinPrice] = useState(Number(getParam('min_price')) || 0)
  const [maxPrice, setMaxPrice] = useState(Number(getParam('max_price')) || 0)
  const [page, setPage] = useState(1)

  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [gridView, setGridView] = useState<'grid' | 'list'>('grid')
  const [sortOpen, setSortOpen] = useState(false)

  const debounceRef = useRef<ReturnType<typeof setTimeout>>()
  const PER_PAGE = 20

  // ── Sync URL ───────────────────────────────────────────────────────────────
  const pushURL = useCallback((overrides: Record<string, any> = {}) => {
    const params = buildParams({
      q, sort, size: sizes, color: colors, occasion: occasions,
      fabric: fabrics, sleeve, min_price: minPrice || undefined,
      max_price: maxPrice || undefined, ...overrides,
    })
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }, [q, sort, sizes, colors, occasions, fabrics, sleeve, minPrice, maxPrice, pathname, router])

  // ── Fetch filters once ────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/storefront/products/filters')
      .then(r => r.json())
      .then(setFilterOptions)
      .catch(() => {})
  }, [])

  // ── Fetch products ────────────────────────────────────────────────────────
  const fetchProducts = useCallback(async (append = false) => {
    const currentPage = append ? page + 1 : 1
    if (!append) setLoading(true); else setLoadingMore(true)

    const params = buildParams({
      q, sort, size: sizes, color: colors, occasion: occasions[0] ?? undefined,
      fabric: fabrics[0] ?? undefined, sleeve, min_price: minPrice || undefined,
      max_price: maxPrice || undefined, page: currentPage, per_page: PER_PAGE,
    })

    try {
      const res = await fetch(`/api/storefront/products?${params}`)
      const data = await res.json()
      if (append) {
        setProducts(prev => [...prev, ...(data.products ?? [])])
        setPage(currentPage)
      } else {
        setProducts(data.products ?? [])
        setPage(1)
      }
      setTotal(data.total ?? 0)
    } catch { /* silent */ } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [q, sort, sizes, colors, occasions, fabrics, sleeve, minPrice, maxPrice, page])

  // q debounce
  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      pushURL({ q })
      fetchProducts()
    }, 400)
    return () => clearTimeout(debounceRef.current)
  }, [q]) // eslint-disable-line

  // other filters trigger immediate fetch + URL sync
  useEffect(() => {
    pushURL()
    fetchProducts()
  }, [sort, sizes, colors, occasions, fabrics, sleeve, minPrice, maxPrice]) // eslint-disable-line

  // ── Active filter pills ───────────────────────────────────────────────────
  const pills: { label: string; remove: () => void }[] = [
    ...sizes.map(s => ({ label: `Size: ${s}`, remove: () => setSizes(prev => prev.filter(x => x !== s)) })),
    ...colors.map(c => ({ label: `Color: ${c}`, remove: () => setColors(prev => prev.filter(x => x !== c)) })),
    ...occasions.map(o => ({ label: `Occasion: ${o}`, remove: () => setOccasions(prev => prev.filter(x => x !== o)) })),
    ...fabrics.map(f => ({ label: `Fabric: ${f}`, remove: () => setFabrics(prev => prev.filter(x => x !== f)) })),
    ...(sleeve ? [{ label: SLEEVE_LABELS[sleeve] ?? sleeve, remove: () => setSleeve('') }] : []),
    ...(minPrice ? [{ label: `From ₹${minPrice}`, remove: () => setMinPrice(0) }] : []),
    ...(maxPrice ? [{ label: `To ₹${maxPrice}`, remove: () => setMaxPrice(0) }] : []),
  ]

  const clearAll = () => {
    setSizes([]); setColors([]); setOccasions([]); setFabrics([])
    setSleeve(''); setMinPrice(0); setMaxPrice(0); setQ(''); setSort('newest')
  }

  const activeCount = pills.length

  const filterProps = {
    options: filterOptions,
    sizes, colors, occasions, fabrics, sleeve, minPrice, maxPrice, sort,
    onSizes: setSizes, onColors: setColors, onOccasions: setOccasions,
    onFabrics: setFabrics, onSleeve: setSleeve,
    onMinPrice: setMinPrice, onMaxPrice: setMaxPrice,
    onSort: setSort, onClear: clearAll,
  }

  const hasMore = products.length < total

  return (
    <div className="min-h-screen bg-[#faf7f2]">
      {/* ── Sticky Search Bar ──────────────────────────────────────────── */}
      <div className="sticky top-16 z-30 bg-[#faf7f2]/95 backdrop-blur-sm border-b border-[#c9a84c]/20 px-4 py-3">
        <div className="max-w-7xl mx-auto">
          <div className="relative max-w-xl">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1a1a1a]/40" />
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search dresses, fabrics, occasions..."
              className="w-full pl-9 pr-8 py-2.5 bg-white border border-[#c9a84c]/30 rounded-full text-sm text-[#1a1a1a] placeholder:text-[#1a1a1a]/40 focus:outline-none focus:border-[#c9a84c] transition-colors"
            />
            {q && (
              <button onClick={() => setQ('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1a1a1a]/40 hover:text-[#1a1a1a]">
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <p className="text-xs text-[#1a1a1a]/50 uppercase tracking-widest mb-4">Home / Products</p>
        <div className="flex items-baseline justify-between mb-6 border-b border-[#c9a84c]/20 pb-4">
          <h1 className="text-3xl font-serif text-[#1a1a1a]">All Products</h1>
          <span className="text-sm text-[#1a1a1a]/60">{total} products</span>
        </div>

        <div className="flex gap-8">
          {/* ── Desktop Sidebar ──────────────────────────────────────────── */}
          <aside className="hidden lg:block w-[260px] flex-shrink-0">
            <div className="sticky top-36 self-start">
              <CatalogFilterSidebar {...filterProps} />
            </div>
          </aside>

          {/* ── Main Content ─────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              {/* Left: count + pills + mobile filter btn */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Mobile filter button */}
                <button
                  onClick={() => setDrawerOpen(true)}
                  className="lg:hidden flex items-center gap-1.5 px-3 py-2 border border-[#c9a84c]/40 rounded-full text-sm font-medium text-[#1a1a1a] bg-white"
                >
                  <SlidersHorizontal size={14} className="text-[#c9a84c]" />
                  Filters {activeCount > 0 && <span className="bg-[#c9a84c] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">{activeCount}</span>}
                </button>

                {/* Active filter chips */}
                {pills.map((pill, i) => (
                  <span key={i} className="flex items-center gap-1 bg-[#c9a84c]/10 border border-[#c9a84c]/40 text-[#1a1a1a] text-xs rounded-full px-2.5 py-1">
                    {pill.label}
                    <button onClick={pill.remove} className="hover:text-red-500 transition-colors"><X size={11} /></button>
                  </span>
                ))}
                {activeCount > 0 && (
                  <button onClick={clearAll} className="text-xs text-[#1a1a1a]/50 hover:text-[#c9a84c] transition-colors underline">Clear all</button>
                )}
              </div>

              {/* Right: sort + view toggle */}
              <div className="flex items-center gap-2">
                {/* Sort dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setSortOpen(o => !o)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-white border border-[#c9a84c]/30 rounded-full text-sm text-[#1a1a1a] hover:border-[#c9a84c] transition-colors"
                  >
                    {SORT_OPTIONS.find(s => s.value === sort)?.label ?? 'Sort'}
                    <ChevronDown size={14} className={`transition-transform ${sortOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {sortOpen && (
                    <div className="absolute right-0 top-full mt-1 bg-white border border-[#c9a84c]/20 rounded-xl shadow-lg py-1 z-20 min-w-[180px]">
                      {SORT_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => { setSort(opt.value); setSortOpen(false) }}
                          className={`w-full text-left px-4 py-2 text-sm transition-colors ${sort === opt.value ? 'text-[#c9a84c] font-medium bg-[#c9a84c]/5' : 'text-[#1a1a1a] hover:bg-[#faf7f2]'}`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Grid/List toggle */}
                <div className="hidden sm:flex border border-[#c9a84c]/30 rounded-full overflow-hidden">
                  <button onClick={() => setGridView('grid')} className={`p-2 transition-colors ${gridView === 'grid' ? 'bg-[#c9a84c] text-white' : 'bg-white text-[#1a1a1a]/50 hover:text-[#1a1a1a]'}`}><LayoutGrid size={14} /></button>
                  <button onClick={() => setGridView('list')} className={`p-2 transition-colors ${gridView === 'list' ? 'bg-[#c9a84c] text-white' : 'bg-white text-[#1a1a1a]/50 hover:text-[#1a1a1a]'}`}><List size={14} /></button>
                </div>
              </div>
            </div>

            {/* Results info */}
            {!loading && (
              <p className="text-xs text-[#1a1a1a]/50 mb-4">
                Showing {products.length} of {total} products
              </p>
            )}

            {/* Grid */}
            {loading ? (
              <div className={`grid gap-4 ${gridView === 'list' ? 'grid-cols-1' : 'grid-cols-2 sm:grid-cols-3 xl:grid-cols-4'}`}>
                {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : products.length === 0 ? (
              /* Empty state */
              <div className="py-24 text-center flex flex-col items-center gap-4">
                <div className="text-6xl">🪡</div>
                <h3 className="text-lg font-medium text-[#1a1a1a]">No products found</h3>
                <p className="text-sm text-[#1a1a1a]/50">Try adjusting your filters or search term</p>
                <button onClick={clearAll} className="mt-2 px-6 py-2.5 border border-[#c9a84c] text-[#c9a84c] rounded-full text-sm font-medium hover:bg-[#c9a84c] hover:text-white transition-colors">
                  Clear All Filters
                </button>
              </div>
            ) : (
              <>
                <div className={`grid gap-4 ${gridView === 'list' ? 'grid-cols-1' : 'grid-cols-2 sm:grid-cols-3 xl:grid-cols-4'}`}>
                  {products.map(p => (
                    <ProductCatalogCard key={p.id} product={p} listView={gridView === 'list'} />
                  ))}
                  {/* Loading more skeletons */}
                  {loadingMore && Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={`sk-${i}`} />)}
                </div>

                {/* Load More */}
                {hasMore && !loadingMore && (
                  <div className="mt-10 flex flex-col items-center gap-2">
                    <button
                      onClick={() => fetchProducts(true)}
                      className="px-8 py-3 border-2 border-[#c9a84c] text-[#c9a84c] rounded-full text-sm font-semibold hover:bg-[#c9a84c] hover:text-white transition-all duration-200"
                    >
                      Load More
                    </button>
                    <p className="text-xs text-[#1a1a1a]/40">Showing {products.length} of {total}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile Filter Drawer ─────────────────────────────────────────── */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDrawerOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-[#faf7f2] rounded-t-2xl max-h-[90vh] flex flex-col shadow-2xl" style={{ animation: 'slideUp 0.3s ease' }}>
            <div className="flex-shrink-0 flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-[#1a1a1a]/20 rounded-full" />
            </div>
            <div className="flex items-center justify-between px-5 py-3 border-b border-[#c9a84c]/20 flex-shrink-0">
              <h2 className="font-semibold text-[#1a1a1a]">
                Filter & Sort {activeCount > 0 && <span className="text-[#c9a84c]">({activeCount})</span>}
              </h2>
              <button onClick={() => setDrawerOpen(false)} className="p-1 text-[#1a1a1a]/50 hover:text-[#1a1a1a]"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <CatalogFilterSidebar {...filterProps} />
            </div>
            <div className="flex-shrink-0 flex gap-3 px-5 py-4 border-t border-[#c9a84c]/20">
              <button onClick={() => { clearAll(); setDrawerOpen(false) }} className="flex-1 py-3 border border-[#1a1a1a]/20 rounded-full text-sm font-medium text-[#1a1a1a]">Clear All</button>
              <button onClick={() => setDrawerOpen(false)} className="flex-1 py-3 bg-[#c9a84c] text-white rounded-full text-sm font-semibold">Apply Filters</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }
      `}</style>
    </div>
  )
}
