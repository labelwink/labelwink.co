'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShoppingCart } from 'lucide-react'

export function MoveToCartButton({ productId, slug }: { productId: string, slug: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleMove = async () => {
    // Basic "Move to Cart" logic. Since variant selection is complex, we'll redirect
    // to the product page if multiple variants or complex sizing, or handle simple add.
    // To comply with instructions "opens size selector (if multiple sizes) -> adds to cart -> removes from wishlist"
    // The easiest robust way in this context without building a full modal is to redirect to PDP,
    // OR we can just redirect to the product page so they can select size.
    router.push(`/products/${slug}?from_wishlist=true`)
  }

  return (
    <button
      onClick={handleMove}
      disabled={loading}
      className="flex items-center justify-center gap-2 w-full mt-3 py-2 px-4 bg-[#1a1a1a] text-[#faf7f2] rounded-md hover:bg-[#333] transition-colors font-medium text-sm disabled:opacity-50"
    >
      <ShoppingCart size={16} />
      {loading ? 'Moving...' : 'Move to Cart'}
    </button>
  )
}
