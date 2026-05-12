'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { X } from 'lucide-react'

interface SizeGuideModalProps {
  sizeGuide?: any
  productName: string
}

const SIZE_CHART = [
  { size: 'XXS', chest: '30"', waist: '24"', hips: '32"', length: '50"' },
  { size: 'XS', chest: '32"', waist: '26"', hips: '34"', length: '52"' },
  { size: 'S', chest: '34"', waist: '28"', hips: '36"', length: '53"' },
  { size: 'M', chest: '36"', waist: '30"', hips: '38"', length: '54"' },
  { size: 'L', chest: '38"', waist: '32"', hips: '40"', length: '55"' },
  { size: 'XL', chest: '40"', waist: '34"', hips: '42"', length: '56"' },
  { size: 'XXL', chest: '42"', waist: '36"', hips: '44"', length: '57"' },
  { size: '3XL', chest: '44"', waist: '38"', hips: '46"', length: '58"' },
  { size: '4XL', chest: '46"', waist: '40"', hips: '48"', length: '59"' },
  { size: '5XL', chest: '48"', waist: '42"', hips: '50"', length: '60"' },
]

export function SizeGuideModal({ sizeGuide, productName }: SizeGuideModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [settings, setSettings] = useState<any>(null)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/storefront/settings')
        if (res.ok) {
          const data = await res.json()
          setSettings(data)
        }
      } catch { /* noop */ }
    }
    fetchSettings()
  }, [])

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground hover:text-charcoal transition-colors"
      >
        Size Guide
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="bg-[#faf8f4] text-white p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold">Size Guide</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              {settings?.size_guide_image_url ? (
                <div className="flex justify-center">
                  <Image
                    src={settings.size_guide_image_url}
                    alt="Size Guide"
                    width={800}
                    height={600}
                    className="max-w-full h-auto rounded-lg"
                  />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-700 uppercase text-xs">
                      <tr>
                        <th className="px-4 py-3">Size</th>
                        <th className="px-4 py-3">Chest</th>
                        <th className="px-4 py-3">Waist</th>
                        <th className="px-4 py-3">Hips</th>
                        <th className="px-4 py-3">Length</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {SIZE_CHART.map((row) => (
                        <tr key={row.size} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium">{row.size}</td>
                          <td className="px-4 py-3">{row.chest}</td>
                          <td className="px-4 py-3">{row.waist}</td>
                          <td className="px-4 py-3">{row.hips}</td>
                          <td className="px-4 py-3">{row.length}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
