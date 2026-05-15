'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, Loader2 } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface SearchProduct {
  id: string
  name: string
  slug: string
  price?: number | null
  mrp?: number | null
  product_images?: Array<{ url?: string; cloudinary_public_id?: string; is_cover?: boolean }>
  product_variants?: Array<{ price?: number; mrp?: number }>
}

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchProduct[]>([])
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<{id:string;name:string;slug:string}[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/storefront/categories').then(r => r.json()).then(d => setCategories(d.categories ?? []))
  }, [])

  // Auto-focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
      setQuery('')
      setResults([])
    }
  }, [isOpen])

  // ESC key closes modal
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  // Debounced search
  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); setLoading(false); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/storefront/search?q=${encodeURIComponent(q)}`)
      const { products } = await res.json()
      setResults(products || [])
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  const handleQueryChange = (val: string) => {
    setQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => doSearch(val), 300)
  }

  const handleResultClick = (slug: string) => {
    onClose()
    router.push(`/products/${slug}`)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[200]">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal panel */}
      <div className="absolute top-0 left-0 right-0 bg-[#faf7f2] shadow-2xl rounded-b-2xl">
        {/* Search input row */}
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <Search className="w-5 h-5 text-[#1a3a34] flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => handleQueryChange(e.target.value)}
            placeholder="Search for kurtas, co-ords, festive wear…"
            className="flex-1 bg-transparent text-gray-900 text-base placeholder:text-gray-400 focus:outline-none"
          />
          {loading && <Loader2 className="w-5 h-5 text-[#1a3a34] animate-spin flex-shrink-0" />}
          <button
            onClick={onClose}
            className="flex-shrink-0 text-[#9aab9e] hover:text-[#1a3a34] transition-colors text-sm font-medium md:hidden"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="flex-shrink-0 text-[#5a7060] hover:text-[#1a3a34] transition-colors p-1 hidden md:block"
            aria-label="Close search"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="container mx-auto px-4 pb-6 border-t border-gray-200">
            <p className="text-[10px] uppercase tracking-widest text-[#5a7060] py-3 font-bold">
              {results.length} result{results.length !== 1 ? 's' : ''} for &quot;{query}&quot;
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {results.map(product => {
                const coverImg =
                  product.product_images?.find(i => i.is_cover) ||
                  product.product_images?.[0]
                const imgSrc = coverImg?.url ||
                  (coverImg?.cloudinary_public_id && !coverImg.cloudinary_public_id.startsWith('http')
                    ? `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/f_auto,q_auto/${coverImg.cloudinary_public_id}`
                    : coverImg?.cloudinary_public_id) || null

                const variantPrice = product.product_variants?.[0]?.price
                const displayPrice = variantPrice || product.price || null

                return (
                  <button
                    key={product.id}
                    onClick={() => handleResultClick(product.slug)}
                    className="text-left group"
                  >
                    <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden mb-2">
                      {imgSrc ? (
                        <Image
                          src={imgSrc}
                          alt={product.name}
                          fill
                          sizes="(max-width: 640px) 50vw, 25vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#5a7060]">
                          <Search className="w-8 h-8" />
                        </div>
                      )}
                    </div>
                    <p className="text-sm font-medium text-[#ffffff] line-clamp-2 group-hover:text-[#1a3a34] transition-colors">
                      {product.name}
                    </p>
                    {displayPrice && (
                      <p className="text-sm font-bold text-[#1a3a34] mt-0.5">
                        ₹{Number(displayPrice).toLocaleString('en-IN')}
                      </p>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* No results */}
        {query.length >= 2 && !loading && results.length === 0 && (
          <div className="container mx-auto px-4 pb-6 border-t border-gray-200">
            <p className="text-sm text-[#9aab9e] py-6 text-center">
              No products found for &quot;{query}&quot;. Try a different search term.
            </p>
          </div>
        )}

        {/* Quick links when no query */}
        {query.length < 2 && (
          <div className="container mx-auto px-4 pb-6 border-t border-gray-200">
            <p className="text-xs font-semibold tracking-widest text-gray-500 uppercase mb-3">Popular Categories</p>
            <div className="flex flex-wrap gap-2">
              {categories.slice(0, 6).map(cat => (
                <Link
                  key={cat.id}
                  href={`/products?category=${cat.slug}`}
                  onClick={onClose}
                  className="px-4 py-1.5 rounded-full border border-[#E8DFC8] bg-white text-gray-700 text-sm font-medium hover:border-[#1C3829] hover:text-[#1C3829] transition-colors cursor-pointer whitespace-nowrap"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
