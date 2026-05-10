'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()
  const isDev = process.env.NODE_ENV === 'development'

  useEffect(() => {
    // Log the error to an error reporting service
    console.error('[Runtime Error]', error)
  }, [error])

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 text-center font-body">
      <div className="mb-8">
        <span className="text-8xl" role="img" aria-label="Warning">
          ⚠️
        </span>
      </div>

      <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 uppercase tracking-wider">
        Something went wrong
      </h1>
      <p className="text-[#5a7060] max-w-md mx-auto mb-10 text-lg">
        An unexpected error occurred. Our team has been notified.
      </p>

      {/* Developer Context */}
      {isDev && (
        <div className="w-full max-w-2xl mb-10 text-left">
          <div className="bg-red-950/30 border border-red-900 p-4 mb-4">
            <code className="text-red-400 font-mono text-sm break-all">
              {error.message}
            </code>
          </div>
          <details className="cursor-pointer group">
            <summary className="text-[#9aab9e] text-sm hover:text-[#5a7060] transition-colors uppercase tracking-widest font-bold">
              View Stack Trace
            </summary>
            <pre className="mt-4 p-4 bg-black border border-[#f5f2ec] text-[#5a7060] font-mono text-xs overflow-auto max-h-64 rounded-none">
              {error.stack}
            </pre>
          </details>
        </div>
      )}

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={() => reset()}
          className="bg-[#c9a84c] text-black px-8 py-3 rounded-none font-bold uppercase tracking-wider hover:bg-[#b39540] transition-colors"
        >
          Try Again
        </button>
        <button
          onClick={() => router.push('/')}
          className="border border-[#c9a84c] text-[#c9a84c] px-8 py-3 rounded-none font-bold uppercase tracking-wider hover:bg-[#c9a84c] hover:text-black transition-all"
        >
          ← Go Home
        </button>
      </div>
    </div>
  )
}
