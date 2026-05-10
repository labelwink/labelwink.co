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
    } catch (e) {
      console.error('Failed to copy', e)
    }
  }

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-2 text-sm font-medium text-[#ffffff] bg-white border border-gray-200 px-4 py-2 rounded-md shadow-sm hover:bg-gray-50 transition-colors"
    >
      {copied ? <Check size={16} className="text-green-600" /> : <Share2 size={16} />}
      {copied ? 'Link Copied!' : 'Share Wishlist'}
    </button>
  )
}
