'use client'

import { useEffect } from 'react'

interface AdminErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function AdminError({ error, reset }: AdminErrorProps) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.error('[admin error]', error)
    }
  }, [error])

  const isDev = process.env.NODE_ENV === 'development'

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="w-14 h-14 rounded-xl bg-red-50 flex items-center justify-center mb-4 text-2xl border border-red-100">
        ⚠️
      </div>
      <h1 className="text-lg font-bold text-[#1a1a1a] mb-1">Admin Panel Error</h1>
      <p className="text-sm text-[#6b7280] max-w-sm mb-6">
        {isDev ? error.message : 'An unexpected error occurred. Please try again or reload the page.'}
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={reset}
          className="px-4 py-2 bg-[#1b3a34] text-white rounded-lg text-xs font-semibold hover:bg-[#16312b]"
        >
          Try again
        </button>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 border border-[#e5e7eb] text-[#1a1a1a] rounded-lg text-xs font-semibold hover:bg-gray-50"
        >
          Reload page
        </button>
      </div>
      {isDev && error.stack && (
        <pre className="mt-6 text-left text-[10px] bg-gray-50 border border-gray-200 rounded-lg p-4 max-w-xl overflow-x-auto text-red-700">
          {error.stack}
        </pre>
      )}
    </div>
  )
}
