'use client'

import { useState } from 'react'
import { Share2, Check } from 'lucide-react'

export function ShareButton({ userId }: { userId: string }) {
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    try {
      const url = `${window.location.origin}/wishlist/${userId}`
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard may be blocked; copied state stays false
    }
  }

  return (
    <button
      onClick={handleShare}
      className="flex items-center justify-center gap-2 min-h-11 h-11 px-4 text-base font-medium text-labelwink-green bg-white border border-labelwink-cream-border rounded-md shadow-sm hover:bg-labelwink-cream-card active:scale-[0.98] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-labelwink-green focus-visible:ring-offset-2"
    >
      {copied ? <Check size={16} className="text-green-600" /> : <Share2 size={16} />}
      {copied ? 'Link Copied!' : 'Share Wishlist'}
    </button>
  )
}
