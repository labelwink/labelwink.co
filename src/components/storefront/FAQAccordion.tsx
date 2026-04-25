'use client'

import { useState } from 'react'

interface FAQItem {
  question: string
  answer: string
}

export function FAQAccordion({ items }: { items: FAQItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  if (!items || items.length === 0) {
    return <p className="text-gray-500 text-sm">No FAQ items available.</p>
  }

  return (
    <div className="divide-y divide-gray-100">
      {items.map((item, i) => (
        <div key={i} className="border-b border-gray-100 py-4">
          <button
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            className="flex items-center justify-between w-full cursor-pointer font-medium text-gray-900 text-left"
          >
            <span>{item.question}</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={`flex-shrink-0 ml-4 text-gray-400 transition-transform duration-200 ${openIndex === i ? 'rotate-180' : ''}`}
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              openIndex === i ? 'max-h-96 mt-3' : 'max-h-0'
            }`}
          >
            <p className="text-gray-600 text-sm leading-relaxed">{item.answer}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
