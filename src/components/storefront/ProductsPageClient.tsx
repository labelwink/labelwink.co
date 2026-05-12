'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { SlidersHorizontal, X, Search, LayoutGrid, List, ChevronDown } from 'lucide-react'
import { ProductCatalogCard } from '@/components/product/ProductCatalogCard'
import { CatalogFilterSidebar } from '@/components/storefront/CatalogFilterSidebar'

interface Variant { id: string; size: string; color: string | null; stock_qty: number; price: number; mrp: number | null; compare_at_price: number | null; is_active: boolean }
interface Product { id: string; name: string; slug: string; price: number; mrp: number | null; compare_at_price: number | null; product_images: any; created_at: string; fabric: string | null; occasion: string | null; tags: string[] | null; product_variants: Variant[] }
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', animation: 'pulse 2s infinite' }}>
      <div style={{ aspectRatio: '3/4', background: '#FAF5E9', borderRadius: '8px' }} />
      <div style={{ height: '12px', background: '#FAF5E9', borderRadius: '4px', width: '75%' }} />
      <div style={{ height: '12px', background: '#FAF5E9', borderRadius: '4px', width: '50%' }} />
    </div>
  )
}

export function ProductsPageClient({ initialTitle }: { initialTitle?: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const sp = useSearchParams()

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

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const PER_PAGE = 20

  const pushURL = useCallback((overrides: Record<string, any> = {}) => {
    const params = buildParams({
      q, sort, size: sizes, color: colors, occasion: occasions,
      fabric: fabrics, sleeve, min_price: minPrice || undefined,
      max_price: maxPrice || undefined, ...overrides,
    })
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }, [q, sort, sizes, colors, occasions, fabrics, sleeve, minPrice, maxPrice, pathname, router])

  useEffect(() => {
    fetch('/api/storefront/products/filters')
      .then(r => r.json())
      .then(setFilterOptions)
      .catch(() => {})
  }, [])

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

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      pushURL({ q })
      fetchProducts()
    }, 400)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [q])

  useEffect(() => {
    pushURL()
    fetchProducts()
  }, [sort, sizes, colors, occasions, fabrics, sleeve, minPrice, maxPrice])

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
    <div style={{ minHeight: '100vh', background: '#FDF8F0' }}>
      <div style={{ position: 'sticky', top: '64px', zIndex: 30, background: 'rgba(253,248,240,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #FAF5E9', padding: '12px 24px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ position: 'relative', maxWidth: '480px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6B6B5A' }} />
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search products..."
              style={{
                width: '100%', paddingLeft: '36px', paddingRight: '32px', paddingTop: '10px', paddingBottom: '10px',
                background: '#FAF5E9', border: '1px solid #E8DFC8', borderRadius: '8px',
                fontSize: '14px', color: '#1C3829', outline: 'none',
              }}
            />
            {q && (
              <button onClick={() => setQ('')} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6B6B5A' }}>
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px 24px' }}>
        <p style={{ fontSize: '12px', color: '#6B6B5A', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>Home / Products</p>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '24px', borderBottom: '1px solid #FAF5E9', paddingBottom: '16px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 600, color: '#1C3829' }}>{initialTitle || 'All Products'}</h1>
          <span style={{ fontSize: '14px', color: '#6B6B5A' }}>{total} products</span>
        </div>

        <div className="flex gap-8">
          <aside className="hidden lg:block" style={{ width: '260px', flexShrink: 0 }}>
            <div style={{ position: 'sticky', top: '120px' }}>
              <CatalogFilterSidebar {...filterProps} />
            </div>
          </aside>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => setDrawerOpen(true)}
                  className="lg:hidden border border-[#ccc] text-[#333] bg-white rounded-none text-xs font-bold uppercase tracking-widest hover:bg-[#f5f2ee] transition-colors"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '13px', fontWeight: 500, color: '#333', background: '#ffffff', cursor: 'pointer' }}
                >
                  <SlidersHorizontal size={14} style={{ color: '#1a1a1a' }} />
                  Filters {activeCount > 0 && <span style={{ background: '#1B3A2D', color: '#FDF8F0', fontSize: '10px', width: '16px', height: '16px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{activeCount}</span>}
                </button>

                {pills.map((pill, i) => (
                  <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)', color: '#c9a84c', fontSize: '12px', borderRadius: '20px', padding: '3px 10px' }}>
                    {pill.label}
                    <button onClick={pill.remove} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c9a84c', display: 'flex', padding: 0 }}><X size={11} /></button>
                  </span>
                ))}
                {activeCount > 0 && (
                  <button onClick={clearAll} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: '#6B6B5A', textDecorationLine: 'underline' }}>Clear all</button>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setSortOpen(o => !o)}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: '#ffffff', border: '1px solid #9ca3af', borderRadius: '8px', fontSize: '13px', color: '#1a1a1a', cursor: 'pointer' }}
                  >
                    {SORT_OPTIONS.find(s => s.value === sort)?.label ?? 'Sort'}
                    <ChevronDown size={14} style={{ transform: sortOpen ? 'rotate(180deg)' : '', transition: 'transform 200ms', color: '#1a1a1a' }} />
                  </button>
                  {sortOpen && (
                    <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: '4px', background: '#ffffff', border: '1px solid #D1D5DB', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.08)', zIndex: 20, minWidth: '180px', overflow: 'hidden' }}>
                      {SORT_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => { setSort(opt.value); setSortOpen(false) }}
                          style={{ width: '100%', textAlign: 'left', padding: '10px 16px', fontSize: '13px', background: sort === opt.value ? '#1B3A2D' : 'transparent', color: sort === opt.value ? '#ffffff' : '#1a1a1a', fontWeight: sort === opt.value ? 600 : 500, border: 'none', cursor: 'pointer' }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="hidden sm:flex" style={{ border: '1px solid #E8DFC8', borderRadius: '8px', overflow: 'hidden' }}>
                  <button onClick={() => setGridView('grid')} style={{ padding: '6px 10px', background: gridView === 'grid' ? '#1B3A2D' : '#FAF5E9', color: gridView === 'grid' ? '#FDF8F0' : '#aaa', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><LayoutGrid size={14} /></button>
                  <button onClick={() => setGridView('list')} style={{ padding: '6px 10px', background: gridView === 'list' ? '#1B3A2D' : '#FAF5E9', color: gridView === 'list' ? '#FDF8F0' : '#aaa', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><List size={14} /></button>
                </div>
              </div>
            </div>

            {!loading && (
              <p style={{ fontSize: '12px', color: '#6B6B5A', marginBottom: '16px' }}>
                Showing {products.length} of {total} products
              </p>
            )}

            {loading ? (
              <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: gridView === 'list' ? '1fr' : 'repeat(auto-fill, minmax(180px, 1fr))' }}>
                {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : products.length === 0 ? (
              <div style={{ paddingTop: '80px', paddingBottom: '80px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <div style={{ fontSize: '48px' }}>🪡</div>
                <h3 style={{ fontSize: '18px', fontWeight: 500, color: '#1C3829' }}>No products found</h3>
                <p style={{ fontSize: '14px', color: '#6B6B5A' }}>Try adjusting your filters or search term</p>
                <button onClick={clearAll} style={{ padding: '8px 24px', border: '1px solid #1B3A2D', color: '#1B3A2D', borderRadius: '8px', fontSize: '14px', fontWeight: 500, background: 'none', cursor: 'pointer' }}>
                  Clear All Filters
                </button>
              </div>
            ) : (
              <>
                <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: gridView === 'list' ? '1fr' : 'repeat(auto-fill, minmax(180px, 1fr))' }}>
                  {products.map(p => (
                    <ProductCatalogCard key={p.id} product={p} listView={gridView === 'list'} />
                  ))}
                  {loadingMore && Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={`sk-${i}`} />)}
                </div>

                {hasMore && !loadingMore && (
                  <div style={{ marginTop: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => fetchProducts(true)}
                      style={{ padding: '10px 32px', border: '2px solid #c9a84c', color: '#c9a84c', borderRadius: '8px', fontSize: '14px', fontWeight: 600, background: 'none', cursor: 'pointer', transition: 'all 200ms' }}
                    >
                      Load More
                    </button>
                    <p style={{ fontSize: '12px', color: '#6B6B5A' }}>Showing {products.length} of {total}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {drawerOpen && (
        <div className="lg:hidden" style={{ position: 'fixed', inset: 0, zIndex: 50 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)' }} onClick={() => setDrawerOpen(false)} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: '#FDF8F0', borderRadius: '16px 16px 0 0', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 -8px 40px rgba(0,0,0,0.5)', animation: 'slideUp 0.3s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 8px' }}>
              <div style={{ width: '40px', height: '4px', background: '#E8DFC8', borderRadius: '2px' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 20px 12px', borderBottom: '1px solid #FAF5E9', flexShrink: 0 }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#1C3829' }}>
                Filter & Sort {activeCount > 0 && <span style={{ color: '#c9a84c' }}>({activeCount})</span>}
              </h2>
              <button onClick={() => setDrawerOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B6B5A' }}><X size={20} /></button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
              <CatalogFilterSidebar {...filterProps} />
            </div>
            <div style={{ flexShrink: 0, display: 'flex', gap: '12px', padding: '16px 20px', borderTop: '1px solid #FAF5E9' }}>
              <button onClick={() => { clearAll(); setDrawerOpen(false) }} style={{ flex: 1, height: '44px', border: '1px solid #E8DFC8', borderRadius: '8px', fontSize: '14px', fontWeight: 500, color: '#6B6B5A', background: 'none', cursor: 'pointer' }}>Clear All</button>
              <button onClick={() => setDrawerOpen(false)} style={{ flex: 1, height: '44px', background: '#c9a84c', color: '#FDF8F0', borderRadius: '8px', fontSize: '14px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>Apply Filters</button>
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
