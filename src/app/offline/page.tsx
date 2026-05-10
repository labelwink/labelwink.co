'use client';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8">
          <span className="text-4xl">📶</span>
        </div>
        <h1 className="text-3xl font-bold text-[#faf7f2] mb-3">You&apos;re offline</h1>
        <p className="text-white/50 mb-2">
          It looks like you&apos;ve lost your internet connection.
        </p>
        <p className="text-white/40 text-sm mb-8">
          Check your connection and try again.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-[#c9a84c] text-[#ffffff] px-8 py-3 rounded-md font-bold text-sm uppercase tracking-widest hover:bg-[#b8963f] transition-colors"
        >
          Retry
        </button>
        <p className="text-white/20 text-xs mt-8">
          Last visited pages may still be available in your browser.
        </p>
      </div>
    </div>
  )
}
