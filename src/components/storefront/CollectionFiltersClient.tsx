'use client'

import { useState, useMemo } from 'react'
import { FilterSidebar, ActiveFilters } from '@/components/storefront/FilterSidebar'
import { SortDropdown } from '@/components/storefront/SortDropdown'
import { ProductCard } from '@/components/product/ProductCard'
import { X } from 'lucide-react'

interface Variant {
  size: string
  price: number
  compare_at_price?: number
  stock_qty: number
}

interface Product {
  id: string
  name: string
  slug: string
  fabric?: string
  occasion?: string[]
  product_variants?: Variant[]
  [key: string]: any
}

interface CollectionFiltersClientProps {
  products: Product[]
  occasionOptions?: string[]
}

const DEFAULT_FILTERS: ActiveFilters = {
  sizes: [],
  occasions: [],
  fabrics: [],
  minPrice: 0,
  maxPrice: 999999,
  discount: '',
}

export function CollectionFiltersClient({
  products,
  occasionOptions = ['Casual', 'Festive', 'Party', 'Office', 'Wedding'],
}: CollectionFiltersClientProps) {
  const [filters, setFilters] = useState<ActiveFilters>(DEFAULT_FILTERS)
  const [sortValue, setSortValue] = useState('newest')

  const maxPrice = useMemo(() => {
    const prices = products.flatMap(p => p.product_variants?.map((v: Variant) => v.price) ?? [])
    return prices.length ? Math.max(...prices) : 10000
  }, [products])

  const fabrics = useMemo(() => {
    const set = new Set<string>()
    products.forEach(p => { if (p.fabric) set.add(p.fabric) })
    return Array.from(set)
  }, [products])

  const availableSizes = useMemo(() => {
    const set = new Set<string>()
    products.forEach(p => {
      p.product_variants?.forEach((v: Variant) => {
        if (v.stock_qty > 0) set.add(v.size)
      })
    })
    return Array.from(set).sort()
  }, [products])

  const occasions = useMemo(() => {
    const set = new Set<string>()
    products.forEach(p => {
      if (p.occasion && Array.isArray(p.occasion)) {
        p.occasion.forEach(o => set.add(o))
      }
    })
    return Array.from(set).length > 0 ? Array.from(set) : occasionOptions
  }, [products, occasionOptions])

  const filtered = useMemo(() => {
    let result = products.filter(p => {
      const variants = p.product_variants ?? []
      const firstVariant = variants[0]

      // Size filter
      if (filters.sizes.length > 0) {
        const has = variants.some((v: Variant) => filters.sizes.includes(v.size) && v.stock_qty > 0)
        if (!has) return false
      }

      // Price filter
      const price = firstVariant?.price ?? 0
      if (price < filters.minPrice) return false
      if (filters.maxPrice < 999999 && price > filters.maxPrice) return false

      // Occasion filter
      if (filters.occasions.length > 0) {
        const productOccasions = p.occasion ?? []
        if (!filters.occasions.some(o => productOccasions.includes(o))) return false
      }

      // Fabric filter
      if (filters.fabrics.length > 0 && !filters.fabrics.includes(p.fabric ?? '')) return false

      // Discount filter
      if (filters.discount) {
        const threshold = Number(filters.discount)
        const compare = firstVariant?.compare_at_price ?? price
        const discountPct = compare > price ? Math.round(((compare - price) / compare) * 100) : 0
        if (discountPct < threshold) return false
      }

      return true
    })

    // Sort
    result = [...result].sort((a, b) => {
      const va = a.product_variants?.[0]
      const vb = b.product_variants?.[0]
      switch (sortValue) {
        case 'price_asc': return (va?.price ?? 0) - (vb?.price ?? 0)
        case 'price_desc': return (vb?.price ?? 0) - (va?.price ?? 0)
        case 'discount': {
          const da = va?.compare_at_price ? Math.round(((va.compare_at_price - va.price) / va.compare_at_price) * 100) : 0
          const db = vb?.compare_at_price ? Math.round(((vb.compare_at_price - vb.price) / vb.compare_at_price) * 100) : 0
          return db - da
        }
        default: return 0
      }
    })

    return result
  }, [products, filters, sortValue])

  // Active filter pills
  const activePills: { label: string; remove: () => void }[] = [
    ...filters.sizes.map(sz => ({
      label: `Size: ${sz}`,
      remove: () => setFilters(f => ({ ...f, sizes: f.sizes.filter(s => s !== sz) })),
    })),
    ...filters.occasions.map(occ => ({
      label: `Occasion: ${occ}`,
      remove: () => setFilters(f => ({ ...f, occasions: f.occasions.filter(o => o !== occ) })),
    })),
    ...filters.fabrics.map(fab => ({
      label: `Fabric: ${fab}`,
      remove: () => setFilters(f => ({ ...f, fabrics: f.fabrics.filter(x => x !== fab) })),
    })),
    ...(filters.discount
      ? [{ label: `Discount: ${filters.discount}%+`, remove: () => setFilters(f => ({ ...f, discount: '' })) }]
      : []),
    ...(filters.minPrice > 0
      ? [{ label: `Min: ₹${filters.minPrice}`, remove: () => setFilters(f => ({ ...f, minPrice: 0 })) }]
      : []),
    ...(filters.maxPrice < 999999
      ? [{ label: `Max: ₹${filters.maxPrice}`, remove: () => setFilters(f => ({ ...f, maxPrice: 999999 })) }]
      : []),
  ]

  const clearAll = () => setFilters(DEFAULT_FILTERS)

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Sidebar */}
      <FilterSidebar
        availableSizes={availableSizes}
        availableOccasions={occasions}
        availableFabrics={fabrics}
        maxPrice={maxPrice}
        activeFilters={filters}
        onChange={setFilters}
        onClear={clearAll}
      />

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Top bar: sort + mobile filter trigger */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          {/* Mobile: filter trigger is rendered by FilterSidebar — show sort on right */}
          <SortDropdown value={sortValue} onChange={setSortValue} />
        </div>

        {/* Active filter pills */}
        {activePills.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {activePills.map((pill, i) => (
              <span key={i} className="flex items-center gap-1.5 bg-labelwink-cream border border-labelwink-gold/30 text-labelwink-green text-xs font-bold uppercase tracking-wider rounded-none px-3 py-1.5 shadow-sm">
                {pill.label}
                <button onClick={pill.remove} className="hover:text-labelwink-gold transition-colors ml-1">
                  <X size={14} />
                </button>
              </span>
            ))}
            <button onClick={clearAll} className="text-xs font-bold uppercase tracking-widest border border-[#1B3A2D] text-[#1B3A2D] px-3 py-2 rounded hover:bg-[#1B3A2D] hover:text-white transition-colors ml-1">
              Clear All
            </button>
          </div>
        )}

        {/* Result count */}
        <p className="text-xs uppercase tracking-[0.2em] font-bold text-labelwink-muted mb-6">{filtered.length} product{filtered.length !== 1 ? 's' : ''} found</p>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-5xl mb-6 opacity-30">👗</p>
            <p className="text-labelwink-muted text-sm font-medium">No products match your filters.</p>
            <button onClick={clearAll} className="mt-6 text-xs font-bold uppercase tracking-[0.2em] border border-[#1B3A2D] text-[#1B3A2D] px-4 py-3 rounded hover:bg-[#1B3A2D] hover:text-white transition-colors">Clear all filters</button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-x-4 gap-y-10 sm:gap-x-6">
            {filtered.map(p => {
              const primaryImage =
                p.product_images?.find((img: any) => img.is_cover || img.is_primary) ||
                p.product_images?.[0]
              const firstVariant = p.product_variants?.[0]

              // Prefer direct url (Cloudinary secure_url), fall back to building from public_id
              const directUrl = primaryImage?.url || null
              const imgPublicId =
                primaryImage?.cloudinary_public_id &&
                !primaryImage.cloudinary_public_id.startsWith('http')
                  ? primaryImage.cloudinary_public_id
                  : null

              // Pass whichever we have — ProductImage handles both cases
              const resolvedImage = directUrl || (imgPublicId
                ? `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/f_auto,q_auto/${imgPublicId}`
                : '')

              return (
                <ProductCard
                  key={p.id}
                  id={p.id}
                  name={p.name}
                  slug={p.slug}
                  basePrice={firstVariant?.price ?? 0}
                  compareAtPrice={firstVariant?.compare_at_price ?? null}
                  image={resolvedImage}
                  publicId={directUrl || (imgPublicId ? imgPublicId : undefined)}
                  isNewArrival={p.tags?.includes('new')}
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
