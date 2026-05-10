'use client'

import { useState } from 'react'

const SLEEVE_LABELS: Record<string, string> = {
  sleeveless: 'Sleeveless', half_sleeve: 'Half Sleeve',
  full_sleeve: 'Full Sleeve', '3/4_sleeve': '3/4 Sleeve',
}
const FIT_LABELS: Record<string, string> = {
  slim: 'Slim Fit', regular: 'Regular Fit', loose: 'Loose Fit',
  relaxed: 'Relaxed Fit', fitted: 'Fitted',
}

interface SizeGuide {
  headers: string[]
  rows: string[][]
  unit?: 'cm' | 'inch'
}

interface Props {
  description?: string | null
  additionalInfo?: Record<string, string> | null
  fabricMaterial?: string | null
  sleeveType?: string | null
  fitType?: string | null
  occasionTags?: string[] | null
  careInstructions?: string | null
  sizeGuide?: SizeGuide | null
}

const TABS = ['Description', 'Product Details', 'Size & Fit', 'Care Instructions'] as const
type Tab = (typeof TABS)[number]

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 py-2 border-b border-[#c9a84c]/10 last:border-0">
      <span className="text-xs text-[#ffffff]/50 uppercase tracking-wider font-medium w-36 flex-shrink-0">{label}</span>
      <span className="text-sm text-[#ffffff]/80 capitalize">{value}</span>
    </div>
  )
}

export function ProductInfoTabs({
  description, additionalInfo, fabricMaterial, sleeveType,
  fitType, occasionTags, careInstructions, sizeGuide,
}: Props) {
  const [tab, setTab] = useState<Tab>('Description')

  const careLines = careInstructions?.split('\n').filter(Boolean) ?? []

  return (
    <div className="mt-12 border-t border-[#c9a84c]/15">
      {/* Tab bar */}
      <div className="flex gap-0 border-b border-[#c9a84c]/15 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-3.5 text-xs font-semibold uppercase tracking-widest whitespace-nowrap transition-colors border-b-2 -mb-px ${
              tab === t
                ? 'border-[#c9a84c] text-[#c9a84c]'
                : 'border-transparent text-[#ffffff]/50 hover:text-[#ffffff]'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="py-8">
        {/* Description */}
        {tab === 'Description' && (
          description
            ? <div
                className="prose prose-sm max-w-none text-[#ffffff]/70 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: description }}
              />
            : <p className="text-sm text-[#ffffff]/40 italic">No description available.</p>
        )}

        {/* Product Details */}
        {tab === 'Product Details' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12">
            <div>
              {fabricMaterial && <Row label="Fabric" value={fabricMaterial} />}
              {sleeveType && <Row label="Sleeve" value={SLEEVE_LABELS[sleeveType] ?? sleeveType} />}
              {fitType && <Row label="Fit" value={FIT_LABELS[fitType] ?? fitType} />}
              {occasionTags?.length && <Row label="Occasion" value={occasionTags.join(', ')} />}
            </div>
            <div>
              {additionalInfo && Object.entries(additionalInfo).map(([k, v]) => (
                <Row key={k} label={k} value={String(v)} />
              ))}
            </div>
          </div>
        )}

        {/* Size & Fit */}
        {tab === 'Size & Fit' && (
          sizeGuide?.rows?.length ? (
            <div className="overflow-x-auto rounded-lg border border-[#c9a84c]/15">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#c9a84c]/8">
                    {sizeGuide.headers.map((h, i) => (
                      <th key={i} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#c9a84c]">
                        {h}{i > 0 && sizeGuide.unit ? ` (${sizeGuide.unit})` : ''}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sizeGuide.rows.map((row, ri) => (
                    <tr key={ri} className={ri % 2 === 1 ? 'bg-white/3' : ''}>
                      {row.map((cell, ci) => (
                        <td key={ci} className={`px-4 py-2.5 text-xs ${ci === 0 ? 'font-bold text-[#ffffff]' : 'text-[#ffffff]/60'}`}>
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-sm text-[#ffffff]/50">
              <p>Please refer to our{' '}
                <a href="/size-guide" className="text-[#c9a84c] underline underline-offset-2">general size guide</a>
                {' '}for measurements.
              </p>
            </div>
          )
        )}

        {/* Care Instructions */}
        {tab === 'Care Instructions' && (
          careLines.length > 0 ? (
            <ul className="space-y-2">
              {careLines.map((line, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-[#ffffff]/70">
                  <span className="mt-0.5">🧺</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[#ffffff]/40 italic">Care instructions not available.</p>
          )
        )}
      </div>
    </div>
  )
}
