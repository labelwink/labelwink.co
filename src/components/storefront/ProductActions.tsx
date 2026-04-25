'use client'

import { useState } from 'react'
import { useCartStore } from '@/store/useCartStore'
import { ShoppingBag, Share2 } from 'lucide-react'

interface Variant {
  id: string
  size: string
  price: number
  mrp?: number
  stock_qty: number
  color?: string
  color_hex?: string
}

interface ProductActionsProps {
  productId: string
  productName: string
  productSlug: string
  variants: Variant[]
  publicId?: string
}

export function ProductActions({ productId, productName, productSlug, variants, publicId }: ProductActionsProps) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const { addItem } = useCartStore()

  const selectedVariant = variants.find(v => v.size === selectedSize)
  const totalStock = variants.reduce((sum, v) => sum + (v.stock_qty ?? 0), 0)
  const isOutOfStock = selectedVariant ? selectedVariant.stock_qty === 0 : false
  const isDisabled = !selectedSize || isOutOfStock

  const handleAddToCart = () => {
    if (!selectedVariant || isOutOfStock) return
    addItem({
      id: selectedVariant.id,
      productId,
      name: productName,
      slug: productSlug,
      price: selectedVariant.price,
      compareAtPrice: selectedVariant.mrp ?? null,
      image: '',
      size: selectedVariant.size,
      color: selectedVariant.color ?? '',
      quantity: 1,
      publicId: publicId,
    })
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: productName, url: window.location.href })
    } else {
      navigator.clipboard.writeText(window.location.href)
    }
  }

  return (
    <div className="space-y-6">
      {/* Size selection */}
      <div className="space-y-3">
        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
          <span>Select Size</span>
          <a href="/size-guide" className="text-teal underline underline-offset-4">Size Guide</a>
        </div>
        <div className="flex flex-wrap gap-3">
          {variants.map((v) => {
            const outOfStock = v.stock_qty === 0
            const isSelected = selectedSize === v.size
            return (
              <button
                key={v.id}
                disabled={outOfStock}
                onClick={() => setSelectedSize(v.size)}
                title={outOfStock ? 'Out of stock' : `Size ${v.size}`}
                className={`w-14 h-14 flex items-center justify-center text-xs font-bold transition-all border relative
                  ${isSelected
                    ? 'border-charcoal bg-charcoal text-cream'
                    : outOfStock
                      ? 'border-sage/20 text-sage/40 cursor-not-allowed line-through'
                      : 'border-sage/30 text-charcoal/70 hover:border-charcoal'
                  }`}
              >
                {v.size}
                {outOfStock && !isSelected && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="block w-full h-px bg-sage/30 rotate-45 absolute" />
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Stock info */}
        <p className="text-sm font-medium text-[#16a34a]">
          {selectedSize
            ? selectedVariant
              ? selectedVariant.stock_qty === 0
                ? 'Out of stock in this size'
                : `${selectedVariant.stock_qty} units available`
              : ''
            : totalStock > 0
              ? `${totalStock} units available across all sizes`
              : 'Currently out of stock'
          }
        </p>
      </div>

      {/* CTA row */}
      <div className="flex gap-4">
        <button
          onClick={handleAddToCart}
          disabled={isDisabled}
          className={`flex-1 h-16 rounded-none text-xs font-bold tracking-[0.3em] uppercase transition-colors
            ${isDisabled
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-charcoal text-cream hover:bg-charcoal/90 active:scale-[0.98]'
            }`}
        >
          {isOutOfStock
            ? 'Out of Stock'
            : !selectedSize
              ? 'Select a Size'
              : 'Add to Cart'
          }
        </button>
        <button
          onClick={handleShare}
          className="w-16 h-16 border border-sage/30 text-charcoal rounded-none hover:border-charcoal transition-colors flex items-center justify-center"
          aria-label="Share product"
        >
          <Share2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
