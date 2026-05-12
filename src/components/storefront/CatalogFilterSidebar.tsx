'use client'

import { useState } from 'react'
import { ChevronDown, SlidersHorizontal } from 'lucide-react'

interface FilterOptions {
  sizes: string[]
  colors: string[]
  price_range: { min: number; max: number }
  fabrics: string[]
  sleeve_types: string[]
  occasions: string[]
}

interface Props {
  options: FilterOptions | null
  sizes: string[]
  colors: string[]
  occasions: string[]
  fabrics: string[]
  sleeve: string
  minPrice: number
  maxPrice: number
  sort: string
  onSizes: (v: string[]) => void
  onColors: (v: string[]) => void
  onOccasions: (v: string[]) => void
  onFabrics: (v: string[]) => void
  onSleeve: (v: string) => void
  onMinPrice: (v: number) => void
  onMaxPrice: (v: number) => void
  onSort: (v: string) => void
  onClear: () => void
}

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
  { value: 'top_rated', label: 'Top Rated' },
]

const SLEEVE_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'sleeveless', label: 'Sleeveless' },
  { value: 'half_sleeve', label: 'Half Sleeve' },
  { value: 'full_sleeve', label: 'Full Sleeve' },
  { value: '3/4_sleeve', label: '3/4 Sleeve' },
]

function Section({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-[#E8DFC8] pb-4 mb-4 last:border-0 last:mb-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center justify-between w-full text-xs font-semibold uppercase tracking-widest text-[#1a1a1a] mb-3"
      >
        {title}
        <ChevronDown size={14} className={`text-[#1a1a1a] transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && children}
    </div>
  )
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all duration-150 ${
        active
          ? 'bg-[#1B3A2D] border-[#1B3A2D] text-white shadow-sm'
          : 'border-[#ccc] text-[#333] bg-white hover:border-[#ccc] hover:bg-[#f0ece6]'
      }`}
    >
      {children}
    </button>
  )
}

function toggle(arr: string[], val: string) {
  return arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]
}

function isHex(s: string) { return /^#([0-9a-f]{3}){1,2}$/i.test(s) }
function nameToHex(name: string): string | null {
  const map: Record<string, string> = {
    red:'#ef4444',pink:'#ec4899',orange:'#f97316',yellow:'#eab308',
    green:'#22c55e',teal:'#14b8a6',blue:'#3b82f6',indigo:'#6366f1',
    purple:'#a855f7',violet:'#8b5cf6',white:'#f8f8f8',black:'#ffffff',
    grey:'#9ca3af',gray:'#9ca3af',brown:'#92400e',navy:'#1e3a5f',
    beige:'#d2b48c',cream:'#faf7f2',gold:'#c9a84c',maroon:'#800000',
  }
  return map[name.toLowerCase()] ?? null
}

export function CatalogFilterSidebar({
  options, sizes, colors, occasions, fabrics, sleeve,
  minPrice, maxPrice, sort,
  onSizes, onColors, onOccasions, onFabrics, onSleeve,
  onMinPrice, onMaxPrice, onSort, onClear,
}: Props) {
  const activeCount = sizes.length + colors.length + occasions.length + fabrics.length +
    (sleeve ? 1 : 0) + (minPrice ? 1 : 0) + (maxPrice ? 1 : 0)

  // local price inputs (apply on blur/enter)
  const [localMin, setLocalMin] = useState(String(minPrice || ''))
  const [localMax, setLocalMax] = useState(String(maxPrice || ''))

  const applyPrice = () => {
    onMinPrice(Number(localMin) || 0)
    onMaxPrice(Number(localMax) || 0)
  }

  return (
    <div className="bg-white border border-[#E8DFC8] p-4 rounded-none text-[#1C3829]">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold text-[#1C3829]">
          <SlidersHorizontal size={14} className="text-[#1a1a1a]" /> Filters
        </h2>
        {activeCount > 0 && (
          <button onClick={onClear} className="text-[10px] uppercase tracking-wider text-[#1a1a1a] hover:text-[#1C3829] transition-colors">
            Clear ({activeCount})
          </button>
        )}
      </div>

      {/* Sort By */}
      <Section title="Sort By">
        <div className="flex flex-wrap gap-2">
          {SORT_OPTIONS.map(opt => (
            <Pill key={opt.value} active={sort === opt.value} onClick={() => onSort(opt.value)}>
              {opt.label}
            </Pill>
          ))}
        </div>
      </Section>

      {/* Price Range */}
      <Section title="Price Range">
        <div className="flex items-center gap-2 mb-3">
          <div className="relative flex-1">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6b7280] text-xs">₹</span>
            <input
              type="number"
              value={localMin}
              onChange={e => setLocalMin(e.target.value)}
              onBlur={applyPrice}
              onKeyDown={e => e.key === 'Enter' && applyPrice()}
              placeholder={String(options?.price_range.min ?? 0)}
              className="w-full pl-6 pr-2 py-2 border border-[#ccc] rounded-lg text-xs text-[#333] focus:outline-none focus:border-[#1B3A2D] bg-white"
            />
          </div>
          <span className="text-[#6b7280] text-xs">–</span>
          <div className="relative flex-1">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6b7280] text-xs">₹</span>
            <input
              type="number"
              value={localMax}
              onChange={e => setLocalMax(e.target.value)}
              onBlur={applyPrice}
              onKeyDown={e => e.key === 'Enter' && applyPrice()}
              placeholder={String(options?.price_range.max ?? 10000)}
              className="w-full pl-6 pr-2 py-2 border border-[#ccc] rounded-lg text-xs text-[#333] focus:outline-none focus:border-[#1B3A2D] bg-white"
            />
          </div>
        </div>
        <button onClick={applyPrice} className="w-full py-2 text-xs font-medium rounded-lg bg-[#1B3A2D] text-white hover:bg-[#163227] transition-colors border-none">
          Apply
        </button>
      </Section>

      {/* Size */}
      {(options?.sizes ?? []).length > 0 && (
        <Section title="Size">
          <div className="flex flex-wrap gap-2">
            {(options!.sizes).map(sz => (
              <Pill key={sz} active={sizes.includes(sz)} onClick={() => onSizes(toggle(sizes, sz))}>
                {sz}
              </Pill>
            ))}
          </div>
        </Section>
      )}

      {/* Color */}
      {(options?.colors ?? []).length > 0 && (
        <Section title="Color">
          <div className="flex flex-wrap gap-2.5">
            {(options!.colors).map(c => {
              const hex = isHex(c) ? c : nameToHex(c)
              const selected = colors.includes(c)
              return (
                <button
                  key={c}
                  title={c}
                  onClick={() => onColors(toggle(colors, c))}
                  className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${
                    selected ? 'ring-2 ring-[#c9a84c] ring-offset-1' : 'border-transparent hover:ring-1 hover:ring-[#c9a84c]'
                  }`}
                  style={{ backgroundColor: hex ?? '#e5e7eb' }}
                >
                  {!hex && <span className="text-[9px] font-bold text-[#ffffff]/70">{c[0].toUpperCase()}</span>}
                </button>
              )
            })}
          </div>
        </Section>
      )}

      {/* Fabric */}
      {(options?.fabrics ?? []).length > 0 && (
        <Section title="Fabric" defaultOpen={false}>
          <div className="space-y-2">
            {(options!.fabrics).map(fab => (
              <label key={fab} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={fabrics.includes(fab)}
                  onChange={() => onFabrics(toggle(fabrics, fab))}
                  className="w-3.5 h-3.5 rounded border-[#6b7280] accent-[#1a1a1a]"
                />
                <span className="text-xs text-[#1a1a1a] capitalize">{fab}</span>
              </label>
            ))}
          </div>
        </Section>
      )}

      {/* Sleeve Type */}
      <Section title="Sleeve Type" defaultOpen={false}>
        <div className="flex flex-wrap gap-2">
          {SLEEVE_OPTIONS.map(opt => (
            <Pill key={opt.value} active={sleeve === opt.value} onClick={() => onSleeve(opt.value)}>
              {opt.label}
            </Pill>
          ))}
        </div>
      </Section>

      {/* Occasion */}
      {(options?.occasions ?? []).length > 0 && (
        <Section title="Occasion" defaultOpen={false}>
          <div className="space-y-2">
            {(options!.occasions).map(occ => (
              <label key={occ} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={occasions.includes(occ)}
                  onChange={() => onOccasions(toggle(occasions, occ))}
                  className="w-3.5 h-3.5 rounded border-[#6b7280] accent-[#1a1a1a]"
                />
                <span className="text-xs text-[#1a1a1a] capitalize">{occ}</span>
              </label>
            ))}
          </div>
        </Section>
      )}
    </div>
  )
}
