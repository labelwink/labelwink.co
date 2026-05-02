'use client'

import { useState } from 'react'
import { useCartStore } from '@/store/useCartStore'
import { Share2 } from 'lucide-react'
import { SizeGuideModal } from '@/components/storefront/SizeGuideModal'

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
  sizeGuide?: any
}

export function ProductActions({ productId, productName, productSlug, variants, publicId, sizeGuide }: ProductActionsProps) {
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
          <SizeGuideModal sizeGuide={sizeGuide} productName={productName} />
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
                className={`min-w-[44px] min-h-[44px] flex items-center justify-center text-xs font-bold transition-all border relative
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

        {/* Stock indicator */}
        {selectedVariant && (() => {
          const qty = selectedVariant.stock_qty
          if (qty === 0) return (
            <p className="text-sm font-medium text-gray-400">Out of stock in this size</p>
          )
          if (qty <= 5) return (
            <p className="text-sm font-medium text-red-600 flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
              Only {qty} left!
            </p>
          )
          if (qty <= 9) return (
            <p className="text-sm font-medium text-amber-600">Only {qty} left — order soon!</p>
          )
          return null
        })()}
      </div>

      {/* CTA row — sticky on mobile */}
      <div className="fixed bottom-0 left-0 right-0 z-30 p-4 bg-white border-t border-sage/20 shadow-lg md:relative md:bottom-auto md:left-auto md:right-auto md:p-0 md:bg-transparent md:border-0 md:shadow-none flex gap-3">
        <button
          onClick={handleAddToCart}
          disabled={isDisabled}
          className={`flex-1 h-14 md:h-16 rounded-none text-xs font-bold tracking-[0.3em] uppercase transition-colors
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
          className="w-14 h-14 md:w-16 md:h-16 border border-sage/30 text-charcoal rounded-none hover:border-charcoal transition-colors flex items-center justify-center flex-shrink-0"
          aria-label="Share product"
        >
          <Share2 className="w-5 h-5" />
        </button>
      </div>

      {isOutOfStock && selectedVariant && (
        <div className="mt-4">
          <StockAlertButton 
            productId={productId} 
            variantId={selectedVariant.id} 
            size={selectedVariant.size} 
            currentStock={selectedVariant.stock_qty} 
          />
        </div>
      )}
    </div>
  )
}
