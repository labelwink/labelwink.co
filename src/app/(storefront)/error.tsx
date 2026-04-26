'use client'

import { useEffect } from 'react'
import Link from 'next/link'

interface StorefrontErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function StorefrontError({ error, reset }: StorefrontErrorProps) {
  useEffect(() => {
    // Log to console in dev; in prod, integrate Sentry here
    if (process.env.NODE_ENV === 'development') {
      console.error('[storefront error]', error)
    }
  }, [error])

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-[#fdf6ec] flex items-center justify-center mb-5 text-2xl">
        🌿
      </div>
      <h1 className="text-2xl font-semibold text-[#1a1a1a] mb-2">Something went wrong</h1>
      <p className="text-[#6b7280] text-sm max-w-sm mb-8">
        We hit a snag. Don't worry — your cart and account are safe.
        Please try again or head back home.
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={reset}
          className="px-5 py-2.5 bg-[#1b3a34] text-white rounded-xl text-sm font-medium hover:bg-[#16312b] transition-colors"
        >
          Try again
        </button>
        <Link
          href="/"
          className="px-5 py-2.5 border border-[#e5e7eb] text-[#1a1a1a] rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          Go home
        </Link>
      </div>
      {process.env.NODE_ENV === 'development' && error.message && (
        <pre className="mt-8 text-left text-xs bg-gray-100 rounded-lg p-4 max-w-lg overflow-x-auto text-red-600 border border-red-200">
          {error.message}
        </pre>
      )}
    </div>
  )
}
