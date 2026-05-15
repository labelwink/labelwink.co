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
  weight?: string | number | null
  hsnCode?: string | null
}

const TABS = ['Description', 'Product Details', 'Size & Fit', 'Care Instructions'] as const
type Tab = (typeof TABS)[number]

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-3 text-sm">
      <span className="text-[#5a7060] font-medium w-1/2">{label}</span>
      <span className="text-[#1A1A1A] font-normal w-1/2 text-right">{value}</span>
    </div>
  )
}

export function ProductInfoTabs({
  description, additionalInfo, fabricMaterial, sleeveType,
  fitType, occasionTags, careInstructions, sizeGuide,
  weight, hsnCode,
}: Props) {
  const [tab, setTab] = useState<Tab>('Description')

  const careLines = careInstructions?.split('\n').filter(Boolean) ?? []

  return (
    <div className="mt-10 border border-[#E8E2D9] rounded-xl bg-white overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-[#E8E2D9] overflow-x-auto scrollbar-hide">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-3 text-sm font-medium transition-colors duration-150 cursor-pointer whitespace-nowrap flex-shrink-0 border-b-2 ${
              tab === t
                ? 'text-[#1B3A2D] border-[#1B3A2D] bg-transparent'
                : 'text-[#5a7060] border-transparent hover:text-[#1B3A2D] hover:border-[#1B3A2D]'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="p-6 text-[#444] text-sm leading-relaxed">
        {/* Description */}
        {tab === 'Description' && (
          description
            ? <div
                className="prose prose-sm max-w-none text-[#444] leading-7"
                dangerouslySetInnerHTML={{ __html: description }}
              />
            : <p className="text-sm text-[#aaa] italic py-4">No information available.</p>
        )}

        {/* Product Details */}
        {tab === 'Product Details' && (
          <div className="divide-y divide-[#E8E2D9]">
            {fabricMaterial && <Row label="Fabric" value={fabricMaterial} />}
            {sleeveType && <Row label="Sleeve" value={SLEEVE_LABELS[sleeveType] ?? sleeveType} />}
            {fitType && <Row label="Fit" value={FIT_LABELS[fitType] ?? fitType} />}
            {occasionTags?.length && <Row label="Occasion" value={occasionTags.join(', ')} />}
            {weight && <Row label="Weight" value={`${weight}${typeof weight === 'number' ? 'g' : ''}`} />}
            {hsnCode && <Row label="HSN Code" value={hsnCode} />}
            {additionalInfo && Object.entries(additionalInfo).map(([k, v]) => (
              <Row key={k} label={k} value={String(v)} />
            ))}
            {!fabricMaterial && !sleeveType && !fitType && !occasionTags?.length && !weight && !hsnCode && !additionalInfo && (
              <p className="text-sm text-[#aaa] italic py-4">No information available.</p>
            )}
          </div>
        )}

        {/* Size & Fit */}
        {tab === 'Size & Fit' && (
          sizeGuide?.rows?.length ? (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-[#1A1A1A] mb-3">Measurements</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-[#1B3A2D] text-white">
                      {sizeGuide.headers.map((h, i) => (
                        <th key={i} className="px-4 py-2.5 text-left font-medium text-xs uppercase tracking-wide">
                          {h}{i > 0 && sizeGuide.unit ? ` (${sizeGuide.unit})` : ''}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sizeGuide.rows.map((row, ri) => (
                      <tr key={ri} className={ri % 2 === 0 ? 'bg-white' : 'bg-[#FAF8F5]'}>
                        {row.map((cell, ci) => (
                          <td key={ci} className="px-4 py-2.5 text-[#444] text-sm border-b border-[#E8E2D9]">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-sm text-[#5a7060] mt-4 leading-relaxed">
                Standard fit. If you are between sizes, we recommend sizing up.
              </p>
              <p className="text-xs text-[#5a7060] mt-2 italic">
                Measurements may vary by +/- 0.5 inches.
              </p>
            </div>
          ) : (
            <p className="text-sm text-[#aaa] italic py-4">No information available.</p>
          )
        )}

        {/* Care Instructions */}
        {tab === 'Care Instructions' && (
          careLines.length > 0 ? (
            <ul className="space-y-3">
              {careLines.map((line, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-[#444]">
                  <span className="text-lg flex-shrink-0 mt-0.5">✨</span>
                  <span className="leading-relaxed">{line}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[#aaa] italic py-4">No information available.</p>
          )
        )}
      </div>
    </div>
  )
}
