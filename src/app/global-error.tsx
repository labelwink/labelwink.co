'use client'

import { fontVariables } from '@/lib/fonts'
import '@/app/globals.css'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${fontVariables} antialiased bg-white text-[#1a3a34] min-h-screen flex items-center justify-center p-4`}>
        <div className="text-center max-w-md">
          <div className="mb-6 text-6xl">⚠️</div>
          <h1 className="text-2xl md:text-3xl font-bold mb-4 uppercase tracking-widest text-[#c9a84c]">
            Critical System Error
          </h1>
          <p className="text-[#5a7060] mb-8">
            A fatal error occurred in the application core. Please try reloading the page.
          </p>
          <button
            onClick={() => reset()}
            className="bg-[#c9a84c] text-black px-10 py-3 rounded-none font-bold uppercase tracking-wider hover:bg-[#b39540] transition-colors"
          >
            Reload Application
          </button>
        </div>
      </body>
    </html>
  )
}
