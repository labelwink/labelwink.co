'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/store/useCartStore'
import { Share2 } from 'lucide-react'
import { SizeGuideModal } from '@/components/storefront/SizeGuideModal'
import { StockAlertButton } from '@/components/storefront/StockAlertButton'

const SIZE_ORDER = ['XXS','XS','S','M','L','XL','XXL','3XL','4XL','5XL']

interface Variant {
  id: string
  size: string
  price: number
  mrp?: number
  compare_at_price?: number
  stock_qty: number
  stock?: number // Legacy support
  color?: string
  color_hex?: string
  is_active?: boolean
}

interface ProductActionsProps {
  productId: string
  productName: string
  productSlug: string
  variants: Variant[]
  publicId?: string
  sizeGuide?: any
}

export function ProductActions({
  productId,
  productName,
  productSlug,
  variants,
  publicId,
  sizeGuide,
}: ProductActionsProps) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const { addItem } = useCartStore()
  const router = useRouter()

  // Auto-select first available size (or notify-param size)
  useEffect(() => {
    if (variants.length === 0) return
    const sp = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
    const notifyParam = sp?.get('notify') === 'true'

    if (notifyParam) {
      const firstOutOfStock = variants.find(
        v => (v.stock_qty ?? (v as any).stock ?? 0) === 0 && v.is_active !== false
      )
      if (firstOutOfStock) { setSelectedSize(firstOutOfStock.size); return }
    }

    if (!selectedSize) {
      const firstAvailable = variants.find(
        v => (v.stock_qty ?? (v as any).stock ?? 0) > 0 && v.is_active !== false
      )
      if (firstAvailable) {
        setSelectedSize(firstAvailable.size)
      } else {
        const firstActive = variants.find(v => v.is_active !== false)
        setSelectedSize(firstActive?.size ?? variants[0].size)
      }
    }
  }, [variants]) // eslint-disable-line react-hooks/exhaustive-deps

  // Derive pricing directly from the selected variant — no surcharge overlay
  const selectedVariant = variants.find(v => v.size === selectedSize)
  const currentPrice: number | null = selectedVariant ? Number(selectedVariant.price) : null
  const currentMrp: number | null = selectedVariant
    ? Number(selectedVariant.mrp || selectedVariant.compare_at_price || selectedVariant.price)
    : null

  const isOutOfStock = selectedVariant
    ? (selectedVariant.stock_qty ?? (selectedVariant as any).stock ?? 0) === 0
    : false
  const isDisabled = !selectedSize || isOutOfStock

  const handleAddToCart = () => {
    if (!selectedVariant || isOutOfStock || currentPrice === null) return
    addItem({
      id: selectedVariant.id,
      productId,
      name: productName,
      slug: productSlug,
      price: currentPrice,
      compareAtPrice: currentMrp && currentMrp > currentPrice ? currentMrp : null,
      image: publicId || '',
      size: selectedVariant.size,
      color: selectedVariant.color ?? '',
      quantity: 1,
      publicId,
    })
  }

  const handleBuyNow = () => {
    if (!selectedVariant || isOutOfStock || currentPrice === null) return
    addItem({
      id: selectedVariant.id,
      productId,
      name: productName,
      slug: productSlug,
      price: currentPrice,
      compareAtPrice: currentMrp && currentMrp > currentPrice ? currentMrp : null,
      image: publicId || '',
      size: selectedVariant.size,
      color: selectedVariant.color ?? '',
      quantity: 1,
      publicId,
    })
    router.push('/checkout')
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: productName, url: window.location.href })
    } else {
      navigator.clipboard.writeText(window.location.href)
    }
  }

  // Sort variants by SIZE_ORDER for display
  const sortedVariants = [...variants].sort(
    (a, b) => SIZE_ORDER.indexOf(a.size) - SIZE_ORDER.indexOf(b.size)
  )

  return (
    <div className="space-y-6">
      {/* Reactive price — reads directly from selectedVariant.price in DB */}
      <div className="flex flex-wrap items-center gap-3 border-b border-[#E8DFC8] pb-6">
        <span className="text-4xl font-heading font-bold text-[#1B3A2D]">
          {currentPrice !== null
            ? `₹${currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
            : 'Select a size'}
        </span>
        {currentMrp && currentPrice !== null && currentMrp > currentPrice && (
          <span className="text-xl text-[#6B6B5A] line-through">
            ₹{currentMrp.toLocaleString('en-IN')}
          </span>
        )}
        {currentMrp && currentPrice !== null && currentMrp > currentPrice && (
          <span className="text-sm font-semibold text-green-700 bg-green-50 border border-green-200 px-2.5 py-0.5 rounded-full">
            {Math.round(((currentMrp - currentPrice) / currentMrp) * 100)}% OFF
          </span>
        )}
      </div>

      {/* Size selection */}
      <div className="space-y-3">
        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
          <span>Select Size</span>
          <SizeGuideModal sizeGuide={sizeGuide} productName={productName} />
        </div>
        <div className="flex flex-wrap gap-3">
          {sortedVariants.map((v) => {
            const outOfStock = (v.stock_qty ?? (v as any).stock ?? 0) === 0 || v.is_active === false
            const isSelected = selectedSize === v.size
            const vPrice = Number(v.price)
            // Show price difference badge if this size has a different price than the cheapest variant
            const minPrice = Math.min(...variants.map(x => Number(x.price)))
            const priceDiff = vPrice - minPrice

            return (
              <button
                key={v.id}
                disabled={v.is_active === false}
                onClick={() => setSelectedSize(v.size)}
                title={v.is_active === false ? 'Not available' : outOfStock ? 'Out of stock — select to notify' : `Size ${v.size} — ₹${vPrice}`}
                className={`min-w-[44px] min-h-[44px] flex items-center justify-center text-xs font-bold transition-all border relative rounded-lg px-3 py-2
                  ${isSelected
                    ? 'border-[#1B3A2D] bg-[#1B3A2D] text-white shadow-sm scale-105 z-10'
                    : outOfStock
                      ? 'border-[#E8E2D9] bg-[#FAF8F5] text-[#A69B8A] hover:border-red-300 hover:text-red-500 line-through cursor-pointer'
                      : 'border-[#E8E2D9] bg-white text-[#333] hover:border-[#1B3A2D] hover:text-[#1B3A2D] hover:bg-[#F7F5EF]'
                  }`}
              >
                <div className="flex flex-col items-center">
                  <span>{v.size}</span>
                  {priceDiff > 0 && (
                    <span className="text-[8px] text-amber-600 font-medium">+₹{priceDiff}</span>
                  )}
                </div>
                {outOfStock && !isSelected && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="block w-full h-px bg-[#D8D0C4] rotate-45 absolute" />
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
            <p className="text-xs font-bold uppercase tracking-widest text-red-700">Out of stock in this size</p>
          )
          if (qty <= 5) return (
            <p className="text-sm font-semibold text-[#1B3A2D] flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              Only {qty} left!
            </p>
          )
          if (qty <= 9) return (
            <p className="text-xs font-bold uppercase tracking-widest text-amber-600">Only {qty} left — order soon!</p>
          )
          return null
        })()}
      </div>

      {/* CTA row — sticky on mobile */}
      <div className="fixed bottom-0 left-0 right-0 z-30 p-4 bg-white border-t border-[#E8E2D9] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] md:relative md:bottom-auto md:left-auto md:right-auto md:p-0 md:bg-transparent md:border-0 md:shadow-none flex items-center gap-3 w-full">
        {isOutOfStock && selectedVariant ? (
          <div className="flex-1">
            <StockAlertButton
              productId={productId}
              variantId={selectedVariant.id}
              size={selectedVariant.size}
              currentStock={selectedVariant.stock_qty}
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col md:flex-row gap-3">
            <button
              onClick={handleAddToCart}
              disabled={isDisabled}
              className={`w-full h-14 md:h-16 rounded-xl text-xs font-bold tracking-[0.3em] uppercase transition-colors
                ${isDisabled
                  ? 'bg-[#F5F5F5] text-[#999] cursor-not-allowed opacity-80'
                  : 'bg-[#1B3A2D] text-white hover:bg-[#173129] active:scale-[0.98] shadow-sm'
                }`}
            >
              {!selectedSize ? 'Select a Size' : 'Add to Cart'}
            </button>
            <button
              onClick={handleBuyNow}
              disabled={isDisabled}
              className={`w-full h-14 md:h-16 rounded-xl text-xs font-bold tracking-[0.3em] uppercase transition-colors
                ${isDisabled
                  ? 'bg-[#F5F5F5] text-[#999] cursor-not-allowed opacity-80'
                  : 'bg-[#1B3A2D] text-white hover:bg-[#173129] active:scale-[0.98] shadow-sm'
                }`}
            >
              Buy Now
            </button>
          </div>
        )}
        <button
          onClick={handleShare}
          className="w-14 h-14 md:w-16 md:h-16 border border-[#E8E2D9] text-[#1B3A2D] rounded-full hover:border-[#1B3A2D] hover:text-[#1B3A2D] transition-colors flex items-center justify-center flex-shrink-0 bg-white shadow-sm"
          aria-label="Share product"
        >
          <Share2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
