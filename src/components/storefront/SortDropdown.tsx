'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

const OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'discount', label: 'Biggest Discount' },
]

interface SortDropdownProps {
  value: string
  onChange: (val: string) => void
}

export function SortDropdown({ value, onChange }: SortDropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = OPTIONS.find(o => o.value === value) || OPTIONS[0]

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-6 py-3 border border-[#ccc] rounded-lg text-xs font-bold uppercase tracking-widest text-[#1a1a1a] hover:border-[#1B3A2D] bg-white min-w-[200px] justify-between transition-all"
      >
        <span>Sort: <span className="text-[#1a1a1a]">{current.label}</span></span>
        <ChevronDown size={14} className={`text-[#1a1a1a] transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 bg-white border border-[#D1D5DB] rounded-xl shadow-xl z-30 min-w-[200px] py-2 overflow-hidden">
          {OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false) }}
              className={`w-full text-left px-5 py-3 text-[11px] font-bold uppercase tracking-widest transition-all ${opt.value === value ? 'text-white bg-[#1B3A2D]' : 'text-[#4b5563] hover:bg-[#f5f2ee]'}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
