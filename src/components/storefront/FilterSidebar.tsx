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

const ALL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

function CollapsibleGroup({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="border-b border-gray-100 pb-4 mb-4">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-sm font-semibold text-gray-800 mb-3"
      >
        {title}
        <ChevronDown size={16} className={`text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
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
          {ALL_SIZES.map(sz => (
            <button
              key={sz}
              onClick={() => onChange({ ...activeFilters, sizes: toggle(activeFilters.sizes, sz) })}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeFilters.sizes.includes(sz)
                  ? 'bg-[#1b3a34] text-white'
                  : 'border border-gray-300 text-gray-700 hover:border-[#1b3a34]'
              }`}
            >
              {sz}
            </button>
          ))}
        </div>
      </CollapsibleGroup>

      {/* Price */}
      <CollapsibleGroup title="Price">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
            <input
              type="number"
              value={activeFilters.minPrice}
              onChange={e => onChange({ ...activeFilters, minPrice: Number(e.target.value) })}
              placeholder="0"
              className="w-full pl-6 pr-2 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1b3a34]"
            />
          </div>
          <span className="text-gray-400 text-xs">to</span>
          <div className="relative flex-1">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
            <input
              type="number"
              value={activeFilters.maxPrice || maxPrice}
              onChange={e => onChange({ ...activeFilters, maxPrice: Number(e.target.value) })}
              placeholder={String(maxPrice)}
              className="w-full pl-6 pr-2 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1b3a34]"
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
                className="rounded border-gray-300 text-[#1b3a34] focus:ring-[#1b3a34]"
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
                  className="rounded border-gray-300 text-[#1b3a34] focus:ring-[#1b3a34]"
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
                className="text-[#1b3a34] focus:ring-[#1b3a34]"
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
          <h2 className="font-semibold text-[#1a1a1a] text-sm flex items-center gap-2">
            <SlidersHorizontal size={16} /> Filters
          </h2>
          {activeCount > 0 && (
            <button onClick={onClear} className="text-xs text-[#1b3a34] hover:underline">Clear all</button>
          )}
        </div>
        <FilterContent {...props} />
      </aside>

      {/* Mobile trigger */}
      <button
        onClick={() => setSheetOpen(true)}
        className="md:hidden flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:border-[#1b3a34]"
      >
        <SlidersHorizontal size={16} />
        Filter
        {activeCount > 0 && (
          <span className="bg-[#1b3a34] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
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

            <div className="flex items-center justify-between px-5 pb-3 border-b border-gray-100 flex-shrink-0">
              <h2 className="font-semibold text-[#1a1a1a]">Filters {activeCount > 0 && `(${activeCount})`}</h2>
              <button onClick={() => setSheetOpen(false)} className="p-1 text-gray-500 hover:text-gray-800">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              <FilterContent {...props} />
            </div>

            {/* Fixed bottom buttons */}
            <div className="flex-shrink-0 flex gap-3 px-5 py-4 border-t border-gray-100">
              <button
                onClick={() => { onClear(); setSheetOpen(false) }}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Clear All
              </button>
              <button
                onClick={() => setSheetOpen(false)}
                className="flex-1 px-4 py-3 bg-[#1b3a34] text-white rounded-xl text-sm font-medium hover:bg-[#234d44]"
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
