'use client'

import { useState } from 'react'
import Image from 'next/image'
import { X, Ruler } from 'lucide-react'

interface SizeGuide {
  headers: string[]
  rows: string[][]
  unit?: 'cm' | 'inch'
  guide_image_url?: string
}

interface Props {
  sizeGuide: SizeGuide | null | undefined
  productName: string
}

function convertRow(row: string[], toInch: boolean): string[] {
  return row.map((cell, i) => {
    if (i === 0) return cell // label column (e.g. "XS")
    const n = parseFloat(cell)
    if (isNaN(n)) return cell
    return toInch ? (n * 0.394).toFixed(1) : cell
  })
}

export function SizeGuideModal({ sizeGuide, productName }: Props) {
  const [open, setOpen] = useState(false)
  const [unit, setUnit] = useState<'cm' | 'inch'>(sizeGuide?.unit ?? 'cm')

  const displayRows = sizeGuide?.rows?.map(row =>
    unit === 'inch' && (sizeGuide.unit ?? 'cm') === 'cm'
      ? convertRow(row, true)
      : unit === 'cm' && sizeGuide.unit === 'inch'
      ? row.map((cell, i) => {
          if (i === 0) return cell
          const n = parseFloat(cell)
          return isNaN(n) ? cell : (n / 0.394).toFixed(1)
        })
      : row
  )

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 text-xs text-[#c9a84c] underline underline-offset-2 hover:text-[#c9a84c]/80 transition-colors"
      >
        <Ruler size={12} />
        Size Guide
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
          onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div className="bg-[#1a1a1a] border border-[#c9a84c]/20 rounded-2xl max-w-lg w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-[#faf7f2] text-base">Size Guide — {productName}</h3>
              <button onClick={() => setOpen(false)} className="text-[#faf7f2]/50 hover:text-[#faf7f2] transition-colors">
                <X size={18} />
              </button>
            </div>

            {!sizeGuide?.rows?.length ? (
              <p className="text-[#faf7f2]/50 text-sm italic">Size guide not available for this product.</p>
            ) : (
              <>
                {/* Unit toggle */}
                <div className="flex gap-0 mb-5 self-start border border-[#c9a84c]/30 rounded-full overflow-hidden w-fit">
                  {(['cm', 'inch'] as const).map(u => (
                    <button
                      key={u}
                      onClick={() => setUnit(u)}
                      className={`px-4 py-1.5 text-xs font-semibold transition-colors ${
                        unit === u ? 'bg-[#c9a84c] text-[#1a1a1a]' : 'text-[#faf7f2]/60 hover:text-[#faf7f2]'
                      }`}
                    >
                      {u}
                    </button>
                  ))}
                </div>

                {/* Table */}
                <div className="overflow-x-auto rounded-lg border border-[#c9a84c]/15">
                  <table className="w-full text-sm text-[#faf7f2]">
                    <thead>
                      <tr className="bg-[#c9a84c]/15">
                        {sizeGuide.headers.map((h, i) => (
                          <th key={i} className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest text-[#c9a84c]">
                            {h}{i > 0 ? ` (${unit})` : ''}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {displayRows!.map((row, ri) => (
                        <tr key={ri} className={ri % 2 === 1 ? 'bg-white/5' : ''}>
                          {row.map((cell, ci) => (
                            <td key={ci} className={`px-4 py-2.5 text-xs ${ci === 0 ? 'font-bold text-[#c9a84c]' : 'text-[#faf7f2]/70'}`}>
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Guide image */}
                {sizeGuide.guide_image_url && (
                  <div className="mt-4 relative w-full aspect-video rounded-lg overflow-hidden border border-[#c9a84c]/15">
                    <Image src={sizeGuide.guide_image_url} alt="Size guide" fill className="object-contain" />
                  </div>
                )}

                {/* Tip */}
                <p className="mt-4 text-[11px] text-[#faf7f2]/40 flex gap-1.5 items-start">
                  <span className="text-[#c9a84c] mt-px">💡</span>
                  Measure at the fullest point while standing straight. If between sizes, size up for comfort.
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
