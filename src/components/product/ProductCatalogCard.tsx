'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Check, ShoppingBag } from 'lucide-react'
import { WishlistButton } from '@/components/storefront/WishlistButton'
import { useCartStore } from '@/store/useCartStore'

interface Variant {
  id: string; size: string; color: string | null; stock_qty: number
  price: number; mrp: number | null; is_active: boolean
}

interface Product {
  id: string; name: string; slug: string; price: number
  mrp: number | null; compare_at_price: number | null
  images: any; created_at: string
  fabric_material: string | null; sleeve_type: string | null
  occasion_tags: string[] | null; product_variants: Variant[]
}

function getImageUrl(images: any, index = 0): string {
  if (!images) return ''
  if (Array.isArray(images)) {
    const img = images[index] ?? images[0]
    return img?.url ?? img?.src ?? ''
  }
  if (typeof images === 'object') return images.url ?? images.src ?? ''
  return String(images)
}

const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
function cloudUrl(publicId: string) {
  return `https://res.cloudinary.com/${CLOUD}/image/upload/f_auto,q_auto,w_400/${publicId}`
}

export function ProductCatalogCard({ product, listView = false }: { product: Product; listView?: boolean }) {
  const addItem = useCartStore(s => s.addItem)

  const [hovered, setHovered] = useState(false)
  const [quickOpen, setQuickOpen] = useState(false)
  const [addedSize, setAddedSize] = useState('')
  const [justAdded, setJustAdded] = useState(false)

  // Images
  const img1 = getImageUrl(product.images, 0)
  const img2 = getImageUrl(product.images, 1)

  // Price
  const mrp = product.mrp ?? product.compare_at_price
  const price = product.price
  const discount = mrp && mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0

  // Variants
  const activeVariants = (product.product_variants ?? []).filter(v => v.is_active)
  const inStockVariants = activeVariants.filter(v => v.stock_qty > 0)
  const sizes = [...new Set(inStockVariants.map(v => v.size))].filter(Boolean)
  const totalStock = activeVariants.reduce((s, v) => s + v.stock_qty, 0)
  const lowStock = inStockVariants.find(v => v.stock_qty > 0 && v.stock_qty <= 5)

  // Badges
  const isNew = Date.now() - new Date(product.created_at).getTime() < 30 * 86400_000
  const isSale = discount > 0
  const isOOS = totalStock === 0

  const handleAdd = (size: string) => {
    const variant = inStockVariants.find(v => v.size === size)
    if (!variant) return
    addItem({
      id: variant.id,
      productId: product.id,
      name: product.name,
      slug: product.slug,
      price: variant.price ?? price,
      compareAtPrice: mrp,
      image: img1,
      size,
      color: variant.color ?? '',
    })
    setAddedSize(size)
    setJustAdded(true)
    setTimeout(() => { setJustAdded(false); setQuickOpen(false) }, 1500)
  }

  if (listView) {
    return (
      <div className="flex gap-4 bg-white rounded-xl p-3 border border-[#c9a84c]/10 hover:border-[#c9a84c]/30 transition-colors">
        <Link href={`/products/${product.slug}`} className="relative w-28 flex-shrink-0 aspect-[3/4] overflow-hidden rounded-lg bg-[#faf7f2]">
          {img1 && <Image src={img1} alt={product.name} fill className="object-cover" sizes="112px" />}
        </Link>
        <div className="flex-1 flex flex-col justify-between py-1">
          <div>
            <div className="flex gap-1.5 mb-1">
              {isNew && <span className="text-[10px] bg-[#c9a84c] text-white px-1.5 py-0.5 rounded font-semibold">NEW</span>}
              {isSale && <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded font-semibold">SALE</span>}
            </div>
            <Link href={`/products/${product.slug}`} className="text-sm font-medium text-[#1a1a1a] line-clamp-2 hover:text-[#c9a84c] transition-colors">{product.name}</Link>
            {product.fabric_material && <p className="text-xs text-[#1a1a1a]/40 mt-0.5">{product.fabric_material}</p>}
          </div>
          <div>
            <div className="flex flex-wrap gap-1 mb-2">
              {sizes.slice(0, 6).map(sz => <span key={sz} className="text-[10px] border border-[#c9a84c]/30 rounded px-1.5 py-0.5 text-[#1a1a1a]/60">{sz}</span>)}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#1a1a1a]">₹{price.toLocaleString('en-IN')}</span>
                {mrp && mrp > price && <span className="text-xs text-[#1a1a1a]/40 line-through">₹{mrp.toLocaleString('en-IN')}</span>}
                {discount > 0 && <span className="text-[10px] text-green-700 bg-green-50 px-1.5 py-0.5 rounded font-semibold">{discount}% off</span>}
              </div>
              <WishlistButton productId={product.id} className="p-1.5 rounded-full bg-[#faf7f2] text-[#1a1a1a]/50 hover:text-red-500 transition-colors" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="group relative flex flex-col gap-2.5"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image */}
      <div className="relative aspect-[3/4] overflow-hidden rounded-sm bg-[#faf7f2]">
        <Link href={`/products/${product.slug}`} className="absolute inset-0 block">
          {img1 && (
            <Image
              src={img1} alt={product.name} fill sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw"
              className={`object-cover transition-opacity duration-500 ${img2 && hovered ? 'opacity-0' : 'opacity-100'}`}
            />
          )}
          {img2 && (
            <Image
              src={img2} alt={product.name} fill sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw"
              className={`object-cover absolute inset-0 transition-opacity duration-500 ${hovered ? 'opacity-100' : 'opacity-0'}`}
            />
          )}
        </Link>

        {/* OOS overlay */}
        {isOOS && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10 pointer-events-none">
            <span className="bg-[#1a1a1a] text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5">Out of Stock</span>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-20">
          {isNew && !isSale && <span className="bg-[#c9a84c] text-white text-[9px] uppercase tracking-widest px-2 py-1 font-bold">New</span>}
          {isSale && <span className="bg-red-500 text-white text-[9px] uppercase tracking-widest px-2 py-1 font-bold">Sale</span>}
        </div>

        {/* Low stock badge */}
        {lowStock && !isOOS && (
          <div className="absolute bottom-12 left-2 z-20">
            <span className="bg-[#1a1a1a]/80 text-white text-[9px] px-2 py-0.5 rounded font-medium">Only {lowStock.stock_qty} left!</span>
          </div>
        )}

        {/* Wishlist */}
        <div className="absolute top-2 right-2 z-20">
          <WishlistButton
            productId={product.id}
            className="p-1.5 rounded-full bg-white/80 backdrop-blur-sm text-[#1a1a1a]/60 hover:text-red-500 hover:bg-white transition-all shadow-sm"
          />
        </div>

        {/* Quick Add */}
        {!isOOS && (
          <div className={`absolute bottom-0 left-0 right-0 z-20 transition-all duration-300 ${hovered || quickOpen ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'} md:group-hover:translate-y-0 md:group-hover:opacity-100`}>
            {quickOpen ? (
              <div className="bg-white border-t border-[#c9a84c]/20 p-2">
                <p className="text-[10px] text-[#1a1a1a]/50 text-center mb-1.5 uppercase tracking-widest">Select Size</p>
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {sizes.map(sz => {
                    const isAdded = justAdded && addedSize === sz
                    return (
                      <button
                        key={sz}
                        onClick={() => handleAdd(sz)}
                        className={`px-3 py-1.5 text-xs rounded-full border font-medium transition-all ${
                          isAdded ? 'bg-green-500 border-green-500 text-white' : 'border-[#c9a84c] text-[#1a1a1a] hover:bg-[#c9a84c] hover:text-white'
                        }`}
                      >
                        {isAdded ? <Check size={12} /> : sz}
                      </button>
                    )
                  })}
                </div>
              </div>
            ) : (
              <button
                onClick={e => { e.preventDefault(); if (sizes.length === 1) { handleAdd(sizes[0]) } else { setQuickOpen(true) } }}
                className="flex items-center justify-center gap-1.5 w-full py-2.5 bg-[#1a1a1a]/90 hover:bg-[#c9a84c] text-white text-xs font-semibold transition-colors duration-200"
              >
                <ShoppingBag size={13} />
                {justAdded ? 'Added! ✓' : 'Quick Add'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1">
        {/* In-stock sizes */}
        {sizes.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {sizes.slice(0, 5).map(sz => (
              <span key={sz} className="text-[9px] border border-[#1a1a1a]/15 rounded px-1.5 py-0.5 text-[#1a1a1a]/50">{sz}</span>
            ))}
            {sizes.length > 5 && <span className="text-[9px] text-[#1a1a1a]/40">+{sizes.length - 5}</span>}
          </div>
        )}

        <Link href={`/products/${product.slug}`} className="text-sm font-medium text-[#1a1a1a] line-clamp-2 hover:text-[#c9a84c] transition-colors leading-tight">
          {product.name}
        </Link>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-[#1a1a1a] text-sm">₹{price.toLocaleString('en-IN')}</span>
          {mrp && mrp > price && (
            <>
              <span className="text-xs text-[#1a1a1a]/40 line-through">₹{mrp.toLocaleString('en-IN')}</span>
              <span className="text-[10px] text-green-700 bg-green-50 px-1.5 py-0.5 rounded font-semibold">{discount}% off</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
