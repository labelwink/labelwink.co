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
    } catch (e) {
      console.error('Failed to remove from wishlist', e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleRemove}
      disabled={loading}
      className="text-xs text-gray-400 hover:text-red-500 underline transition-colors"
    >
      {loading ? 'Removing...' : 'Remove'}
    </button>
  )
}
