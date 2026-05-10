'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { Loader2, HelpCircle } from 'lucide-react'

interface FAQItem {
  id: string
  question: string
  answer: string
  category: string
}

function FAQContent() {
  const [items, setItems] = useState<FAQItem[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/storefront/faq')
      .then((r) => r.json())
      .then((d) => setItems(d.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [])

  const categories = Array.from(new Set(items.map((i) => i.category)))

  return (
    <div className="min-h-screen bg-[#FDF8F0]">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[#1C3829] mb-3">
            Frequently Asked Questions
          </h1>
          <p className="text-gray-600">
            Find answers to common questions about our products and policies
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#C9A84C]" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-[#E8DFC8]">
            <HelpCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No FAQ items available yet.</p>
            <p className="text-gray-500">
              Have a question?{' '}
              <Link
                href="/contact"
                className="text-[#1C3829] underline hover:text-[#C9A84C]"
              >
                Contact us
              </Link>
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {categories.map((category) => (
              <div key={category}>
                <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-4">
                  {category}
                </h2>
                <div className="space-y-3">
                  {items
                    .filter((i) => i.category === category)
                    .map((item) => (
                      <div
                        key={item.id}
                        className="bg-white border border-[#E8DFC8] rounded-xl overflow-hidden shadow-sm transition-shadow hover:shadow-md"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedId(
                              expandedId === item.id ? null : item.id
                            )
                          }
                          className="w-full p-5 text-left flex items-center justify-between hover:bg-[#FDF8F0] transition-colors"
                        >
                          <span className="font-medium text-[#1C3829]">
                            {item.question}
                          </span>
                          <span
                            className={`text-[#C9A84C] transition-transform ${
                              expandedId === item.id ? 'rotate-180' : ''
                            }`}
                          >
                            ▼
                          </span>
                        </button>

                        {expandedId === item.id && (
                          <div className="px-5 py-4 bg-[#FDF8F0] border-t border-[#E8DFC8] text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                            {item.answer}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function FAQPage() {
  return (
    <Suspense>
      <FAQContent />
    </Suspense>
  )
}
