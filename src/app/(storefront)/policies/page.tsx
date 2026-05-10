'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

const TABS = [
  { key: 'privacy', label: 'Privacy Policy', slug: 'privacy-policy' },
  { key: 'returns', label: 'Return Policy', slug: 'return-policy' },
  { key: 'terms', label: 'Terms of Service', slug: 'terms-of-service' },
  { key: 'shipping', label: 'Shipping Policy', slug: 'shipping-policy' },
  { key: 'refund', label: 'Refund Policy', slug: 'refund-policy' },
]

function PoliciesContent() {
  const params = useSearchParams()
  const router = useRouter()
  const [data, setData] = useState<{ title: string; content: string } | null>(
    null
  )
  const [loading, setLoading] = useState(true)
  const activeTab = params.get('tab') ?? 'privacy'
  const activeSlug =
    TABS.find((t) => t.key === activeTab)?.slug ?? 'privacy-policy'

  useEffect(() => {
    setLoading(true)
    setData(null)
    fetch(`/api/storefront/pages/${activeSlug}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setData({ title: '', content: '' }))
      .finally(() => setLoading(false))
  }, [activeSlug])

  return (
    <div className="min-h-screen bg-[#FDF8F0]">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-[#1C3829] mb-8">Policies</h1>

        {/* Tabs */}
        <div className="flex overflow-x-auto border-b border-[#E8DFC8] mb-8">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => router.push(`/policies?tab=${tab.key}`)}
              className={`px-5 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-[#C9A84C] text-[#1C3829]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="bg-white rounded-2xl border border-[#E8DFC8] p-8 shadow-sm min-h-[300px]">
          {loading ? (
            <div className="animate-pulse space-y-3">
              {[...Array(10)].map((_, i) => (
                <div
                  key={i}
                  className={`h-4 bg-gray-200 rounded ${i % 5 === 4 ? 'w-2/3' : 'w-full'}`}
                />
              ))}
            </div>
          ) : !data?.content ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-4xl mb-4">📄</p>
              <p className="text-sm">
                This policy is being set up. Please check back soon.
              </p>
            </div>
          ) : (
            <>
              {data.title && (
                <h2 className="text-xl font-bold text-[#1C3829] mb-6">
                  {data.title}
                </h2>
              )}
              <div className="text-gray-700 text-sm leading-7 whitespace-pre-wrap">
                {data.content}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function PoliciesPage() {
  return (
    <Suspense>
      <PoliciesContent />
    </Suspense>
  )
}
