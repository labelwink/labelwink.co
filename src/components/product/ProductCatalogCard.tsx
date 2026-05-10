'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Check, ShoppingBag } from 'lucide-react'
import { WishlistButton } from '@/components/storefront/WishlistButton'
import { useCartStore } from '@/store/useCartStore'

interface Variant {
  id: string; size: string; color: string | null; stock_qty: number
  price: number; compare_at_price: number | null; is_active: boolean
}

interface Product {
  id: string; name: string; slug: string; price: number
  compare_at_price: number | null
  product_images: any[]; created_at: string
  fabric: string | null
  occasion: string | null
  product_variants: Variant[]
}

export function ProductCatalogCard({ product, listView = false }: { product: Product; listView?: boolean }) {
  const addItem = useCartStore(s => s.addItem)
  const [hovered, setHovered] = useState(false)
  const [quickOpen, setQuickOpen] = useState(false)
  const [addedSize, setAddedSize] = useState('')
  const [justAdded, setJustAdded] = useState(false)

  // Images
  const coverImg = product.product_images?.find((i: any) => i.is_cover || i.is_primary) || product.product_images?.[0]
  const secondImg = product.product_images?.[1]
  const img1 = coverImg?.url ?? ''
  const img2 = secondImg?.url ?? ''

  // Price
  const mrp = product.compare_at_price
  const price = product.price
  const discount = mrp && mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0

  // Variants
  const activeVariants = (product.product_variants ?? []).filter(v => v.is_active)
  const inStockVariants = activeVariants.filter(v => v.stock_qty > 0)
  const sizes = [...new Set(inStockVariants.map(v => v.size))].filter(Boolean)
  const totalStock = activeVariants.reduce((s, v) => s + v.stock_qty, 0)
  const lowStock = inStockVariants.find(v => v.stock_qty > 0 && v.stock_qty <= 5)

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
      <div style={{ display: 'flex', gap: '16px', background: '#ffffff', borderRadius: '10px', padding: '12px', border: '1px solid #E8DFC8' }}>
        <Link href={`/products/${product.slug}`} style={{ position: 'relative', width: '112px', flexShrink: 0, aspectRatio: '3/4', overflow: 'hidden', borderRadius: '8px', background: '#f5f2ec', display: 'block' }}>
          {img1 && <Image src={img1} alt={product.name} fill className="object-cover" sizes="112px" />}
        </Link>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '4px 0' }}>
          <div>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
              {isNew && <span style={{ fontSize: '10px', background: '#c9a84c', color: '#faf8f4', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>NEW</span>}
              {isSale && <span style={{ fontSize: '10px', background: 'rgba(248,113,113,0.2)', color: '#f87171', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>SALE</span>}
            </div>
            <Link href={`/products/${product.slug}`} style={{ fontSize: '14px', fontWeight: 500, color: '#1a2e1e', textDecoration: 'none', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any, overflow: 'hidden' }}>
              {product.name}
            </Link>
            {product.fabric && <p style={{ fontSize: '12px', color: '#9aab9e', marginTop: '4px' }}>{product.fabric}</p>}
          </div>
          <div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
              {sizes.slice(0, 6).map(sz => (
                <span key={sz} style={{ fontSize: '10px', border: '1px solid #E8DFC8', borderRadius: '4px', padding: '2px 6px', color: '#9aab9e' }}>{sz}</span>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 700, color: '#1a2e1e' }}>₹{price.toLocaleString('en-IN')}</span>
                {mrp && mrp > price && <span style={{ fontSize: '12px', color: '#9aab9e', textDecoration: 'line-through' }}>₹{mrp.toLocaleString('en-IN')}</span>}
                {discount > 0 && <span style={{ fontSize: '10px', color: '#4ade80', fontWeight: 600 }}>{discount}% off</span>}
              </div>
              <WishlistButton productId={product.id} className="p-1.5 rounded-full bg-[#f5f2ec] text-[#9aab9e] hover:text-red-400 transition-colors" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '10px' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image area */}
      <div style={{ position: 'relative', aspectRatio: '3/4', overflow: 'hidden', borderRadius: '8px', background: '#ffffff' }}>
        <Link href={`/products/${product.slug}`} style={{ position: 'absolute', inset: 0, display: 'block' }}>
          {img1 && (
            <Image
              src={img1} alt={product.name} fill sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw"
              style={{ objectFit: 'cover', transition: 'opacity 400ms', opacity: img2 && hovered ? 0 : 1 }}
            />
          )}
          {img2 && (
            <Image
              src={img2} alt={product.name} fill sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw"
              style={{ objectFit: 'cover', position: 'absolute', inset: 0, transition: 'opacity 400ms', opacity: hovered ? 1 : 0 }}
            />
          )}
        </Link>

        {/* OOS overlay */}
        {isOOS && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
            <span style={{ background: '#ffffff', color: '#9aab9e', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '4px 10px', borderRadius: '4px' }}>Out of Stock</span>
          </div>
        )}

        {/* Badges */}
        <div style={{ position: 'absolute', top: '8px', left: '8px', display: 'flex', flexDirection: 'column', gap: '4px', zIndex: 20 }}>
          {isNew && !isSale && <span style={{ background: '#c9a84c', color: '#faf8f4', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>New</span>}
          {isSale && <span style={{ background: 'rgba(248,113,113,0.9)', color: '#fff', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>Sale</span>}
        </div>

        {/* Low stock */}
        {lowStock && !isOOS && (
          <div style={{ position: 'absolute', bottom: '48px', left: '8px', zIndex: 20 }}>
            <span style={{ background: 'rgba(0,0,0,0.8)', color: '#fb923c', fontSize: '9px', padding: '2px 6px', borderRadius: '4px', fontWeight: 500 }}>Only {lowStock.stock_qty} left!</span>
          </div>
        )}

        {/* Wishlist */}
        <div style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 20 }}>
          <WishlistButton
            productId={product.id}
            className="p-1.5 rounded-full bg-black/50 backdrop-blur-sm text-white/60 hover:text-red-400 transition-all"
          />
        </div>

        {/* Quick Add */}
        {!isOOS && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 20,
            transition: 'transform 250ms, opacity 250ms',
            transform: hovered || quickOpen ? 'translateY(0)' : 'translateY(100%)',
            opacity: hovered || quickOpen ? 1 : 0,
          }}>
            {quickOpen ? (
              <div style={{ background: '#ffffff', borderTop: '1px solid #333', padding: '10px' }}>
                <p style={{ fontSize: '10px', color: '#9aab9e', textAlign: 'center', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Select Size</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center' }}>
                  {sizes.map(sz => {
                    const isAdded = justAdded && addedSize === sz
                    return (
                      <button
                        key={sz}
                        onClick={() => handleAdd(sz)}
                        style={{
                          padding: '4px 10px', fontSize: '12px', borderRadius: '6px',
                          border: `1px solid ${isAdded ? '#4ade80' : '#c9a84c'}`,
                          background: isAdded ? '#4ade80' : 'transparent',
                          color: isAdded ? '#faf8f4' : '#c9a84c',
                          cursor: 'pointer', fontWeight: 500, transition: 'all 150ms',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
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
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  width: '100%', padding: '10px',
                  background: 'rgba(10,10,10,0.9)',
                  color: '#ffffff', fontSize: '12px', fontWeight: 600,
                  border: 'none', cursor: 'pointer',
                  transition: 'background 150ms',
                }}
              >
                <ShoppingBag size={13} />
                {justAdded ? 'Added ✓' : 'Quick Add'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {sizes.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {sizes.slice(0, 5).map(sz => (
              <span key={sz} style={{ fontSize: '9px', border: '1px solid #E8DFC8', borderRadius: '4px', padding: '1px 5px', color: '#9aab9e' }}>{sz}</span>
            ))}
            {sizes.length > 5 && <span style={{ fontSize: '9px', color: '#9aab9e' }}>+{sizes.length - 5}</span>}
          </div>
        )}

        <Link href={`/products/${product.slug}`} style={{
          fontSize: '13px', fontWeight: 500, color: '#1a2e1e', textDecoration: 'none',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any,
          overflow: 'hidden', lineHeight: 1.4, transition: 'color 150ms',
        }}>
          {product.name}
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, color: '#1a2e1e', fontSize: '14px' }}>₹{price.toLocaleString('en-IN')}</span>
          {mrp && mrp > price && (
            <>
              <span style={{ fontSize: '12px', color: '#9aab9e', textDecoration: 'line-through' }}>₹{mrp.toLocaleString('en-IN')}</span>
              <span style={{ fontSize: '10px', color: '#4ade80', fontWeight: 600 }}>{discount}% off</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
