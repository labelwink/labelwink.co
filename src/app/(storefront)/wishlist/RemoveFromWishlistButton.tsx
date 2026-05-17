'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function RemoveFromWishlistButton({ productId }: { productId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleRemove = async () => {
    if (loading) return
    setLoading(true)
    try {
      localStorage.removeItem(`wl_${productId}`)
      await fetch(`/api/storefront/wishlist?product_id=${productId}`, {
        method: 'DELETE'
      })
      router.refresh()
    } catch {
      // User can retry; page refresh shows current state
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleRemove}
      disabled={loading}
      className="min-h-11 inline-flex items-center justify-center px-3 text-base text-brand-muted hover:text-destructive underline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-labelwink-green focus-visible:ring-offset-2"
    >
      {loading ? 'Removing...' : 'Remove'}
    </button>
  )
}
