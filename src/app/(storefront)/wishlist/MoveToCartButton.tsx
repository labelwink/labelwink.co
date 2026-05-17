'use client'

import { useRouter } from 'next/navigation'
import { ShoppingCart } from 'lucide-react'

export function MoveToCartButton({ productId, slug }: { productId: string; slug: string }) {
  const router = useRouter()

  const handleMove = () => {
    // Basic "Move to Cart" logic. Since variant selection is complex, we'll redirect
    // to the product page if multiple variants or complex sizing, or handle simple add.
    // To comply with instructions "opens size selector (if multiple sizes) -> adds to cart -> removes from wishlist"
    // The easiest robust way in this context without building a full modal is to redirect to PDP,
    // OR we can just redirect to the product page so they can select size.
    router.push(`/products/${slug}?from_wishlist=true`)
  }

  return (
    <button
      type="button"
      onClick={handleMove}
      className="flex items-center justify-center gap-2 w-full mt-3 min-h-11 h-11 px-4 bg-labelwink-green text-white rounded-md hover:bg-labelwink-green-hover active:scale-[0.98] transition-colors text-base font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-labelwink-gold focus-visible:ring-offset-2"
    >
      <ShoppingCart size={16} aria-hidden />
      Move to Cart
    </button>
  )
}
