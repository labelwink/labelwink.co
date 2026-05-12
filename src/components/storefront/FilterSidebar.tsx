'use client'

import { useState } from 'react'
import { ChevronDown, X, SlidersHorizontal } from 'lucide-react'

export interface ActiveFilters {
  sizes: string[]
  occasions: string[]
  fabrics: string[]
  minPrice: number
  maxPrice: number
  discount: string
}

interface FilterSidebarProps {
  availableSizes: string[]
  availableOccasions: string[]
  availableFabrics: string[]
  maxPrice: number
  activeFilters: ActiveFilters
  onChange: (filters: ActiveFilters) => void
  onClear: () => void
}


function CollapsibleGroup({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="border-b border-[#D1D5DB] pb-4 mb-4">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-sm font-semibold text-[#1a1a1a] mb-3"
      >
        {title}
        <ChevronDown size={16} className={`text-[#1a1a1a] transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && children}
    </div>
  )
}

function FilterContent({
  availableSizes, availableOccasions, availableFabrics, maxPrice,
  activeFilters, onChange,
}: Omit<FilterSidebarProps, 'onClear'>) {
  const toggle = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]

  return (
    <div className="space-y-0">
      {/* Sizes */}
      <CollapsibleGroup title="Size">
        <div className="flex flex-wrap gap-2">
          {availableSizes.length === 0 ? (
            <p className="text-xs text-[#5a7060] italic">No sizes available</p>
          ) : (
            availableSizes.map(sz => (
              <button
                key={sz}
                onClick={() => onChange({ ...activeFilters, sizes: toggle(activeFilters.sizes, sz) })}
                className={`px-3 py-1.5 rounded-none text-xs font-bold uppercase tracking-widest transition-all duration-200 ${
                  activeFilters.sizes.includes(sz)
                    ? 'bg-[#1B3A2D] border-[#1B3A2D] text-white shadow-sm'
                    : 'border border-[#ccc] text-[#333] bg-white hover:border-[#ccc] hover:bg-[#f0ece6]'
                }`}
              >
                {sz}
              </button>
            ))
          )}
        </div>
      </CollapsibleGroup>

      {/* Price */}
      <CollapsibleGroup title="Price">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[#5a7060] text-sm">₹</span>
            <input
              type="number"
              value={activeFilters.minPrice}
              onChange={e => onChange({ ...activeFilters, minPrice: Number(e.target.value) })}
              placeholder="0"
              className="w-full pl-6 pr-2 py-2 border border-[#ccc] rounded-none text-xs font-bold text-[#333] focus:outline-none focus:ring-1 focus:ring-[#1B3A2D] bg-white"
            />
          </div>
          <span className="text-[#5a7060] text-xs">to</span>
          <div className="relative flex-1">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[#5a7060] text-sm">₹</span>
            <input
              type="number"
              value={activeFilters.maxPrice || maxPrice}
              onChange={e => onChange({ ...activeFilters, maxPrice: Number(e.target.value) })}
              placeholder={String(maxPrice)}
              className="w-full pl-6 pr-2 py-2 border border-[#ccc] rounded-none text-xs font-bold text-[#333] focus:outline-none focus:ring-1 focus:ring-[#1B3A2D] bg-white"
            />
          </div>
        </div>
      </CollapsibleGroup>

      {/* Occasion */}
      <CollapsibleGroup title="Occasion">
        <div className="space-y-2">
          {availableOccasions.map(occ => (
            <label key={occ} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
              <input
                type="checkbox"
                checked={activeFilters.occasions.includes(occ)}
                onChange={() => onChange({ ...activeFilters, occasions: toggle(activeFilters.occasions, occ) })}
                className="rounded-none border-labelwink-cream-border text-labelwink-green focus:ring-labelwink-gold"
              />
              {occ}
            </label>
          ))}
        </div>
      </CollapsibleGroup>

      {/* Fabric */}
      {availableFabrics.length > 0 && (
        <CollapsibleGroup title="Fabric">
          <div className="space-y-2">
            {availableFabrics.map(fab => (
              <label key={fab} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={activeFilters.fabrics.includes(fab)}
                  onChange={() => onChange({ ...activeFilters, fabrics: toggle(activeFilters.fabrics, fab) })}
                  className="rounded-none border-labelwink-cream-border text-labelwink-green focus:ring-labelwink-gold"
                />
                {fab}
              </label>
            ))}
          </div>
        </CollapsibleGroup>
      )}

      {/* Discount */}
      <CollapsibleGroup title="Discount">
        <div className="space-y-2">
          {[{ val: '', label: 'Any' }, { val: '10', label: '10%+' }, { val: '20', label: '20%+' }, { val: '30', label: '30%+' }].map(opt => (
            <label key={opt.val} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
              <input
                type="radio"
                name="discount"
                checked={activeFilters.discount === opt.val}
                onChange={() => onChange({ ...activeFilters, discount: opt.val })}
                className="text-labelwink-green focus:ring-labelwink-gold"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </CollapsibleGroup>
    </div>
  )
}

export function FilterSidebar(props: FilterSidebarProps) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const { activeFilters, onClear } = props

  const activeCount = [
    activeFilters.sizes.length,
    activeFilters.occasions.length,
    activeFilters.fabrics.length,
    activeFilters.discount ? 1 : 0,
    (activeFilters.minPrice > 0 || activeFilters.maxPrice < props.maxPrice) ? 1 : 0,
  ].reduce((a, b) => a + b, 0)

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:block w-[240px] flex-shrink-0 sticky top-24 self-start">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold uppercase tracking-widest text-labelwink-green text-xs flex items-center gap-2">
            <SlidersHorizontal size={14} /> Filters
          </h2>
          {activeCount > 0 && (
            <button onClick={onClear} className="text-[10px] font-bold uppercase tracking-widest border border-[#1B3A2D] text-[#1B3A2D] px-2 py-1 bg-transparent hover:bg-[#1B3A2D] hover:text-white transition-colors rounded">
              Clear all
            </button>
          )}
        </div>
        <FilterContent {...props} />
      </aside>

      {/* Mobile trigger */}
      <button
        onClick={() => setSheetOpen(true)}
        className="md:hidden flex items-center gap-2 px-6 py-3 border border-[#ccc] text-[#333] rounded-none text-xs font-bold uppercase tracking-widest bg-white hover:bg-[#f5f2ee] transition-all duration-300"
      >
        <SlidersHorizontal size={14} />
        Filter
        {activeCount > 0 && (
          <span className="bg-labelwink-gold text-labelwink-green text-[10px] w-5 h-5 rounded-full flex items-center justify-center">
            {activeCount}
          </span>
        )}
      </button>

      {/* Mobile bottom sheet */}
      {sheetOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40" onClick={() => setSheetOpen(false)} />

          {/* Sheet */}
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl h-[75vh] flex flex-col">
            {/* Handle */}
            <div className="flex-shrink-0 flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            <div className="flex items-center justify-between px-6 pb-4 border-b border-labelwink-cream-border flex-shrink-0">
              <h2 className="font-bold uppercase tracking-widest text-[#1a1a1a] text-sm">Filters {activeCount > 0 && `(${activeCount})`}</h2>
              <button onClick={() => setSheetOpen(false)} className="p-1 text-[#6b7280] hover:text-[#1a1a1a] transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              <FilterContent {...props} />
            </div>

            {/* Fixed bottom buttons */}
            <div className="flex-shrink-0 flex gap-4 px-6 py-6 border-t border-labelwink-cream-border bg-white">
              <button
                onClick={() => { onClear(); setSheetOpen(false) }}
                className="flex-1 px-4 py-4 border border-[#1B3A2D] text-[#1B3A2D] rounded-none text-xs font-bold uppercase tracking-widest bg-transparent hover:bg-[#1B3A2D] hover:text-white transition-colors"
              >
                Clear All
              </button>
              <button
                onClick={() => setSheetOpen(false)}
                className="flex-1 px-4 py-4 bg-[#1B3A2D] text-white rounded-none text-xs font-bold uppercase tracking-widest hover:bg-[#163227] transition-colors shadow-lg"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
