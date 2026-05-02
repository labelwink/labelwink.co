'use client'

import { useState, useEffect } from 'react'
import { Heart } from 'lucide-react'
import { useAuthModal } from '@/components/auth/OTPLoginModal'
import { createClient } from '@/lib/supabase/client'

interface WishlistButtonProps {
  productId: string
  size?: 'sm' | 'md' | 'lg'
}

export function WishlistButton({ productId, size = 'md' }: WishlistButtonProps) {
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const { openModal } = useAuthModal()

  useEffect(() => {
    let isMounted = true
    const checkAuthAndWishlist = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!isMounted) return

      if (user) {
        setIsLoggedIn(true)
        try {
          const res = await fetch(`/api/storefront/wishlist/check?product_ids=${productId}`)
          const data = await res.json()
          if (data.wishlisted?.includes(productId)) {
            setIsWishlisted(true)
            localStorage.setItem(`wl_${productId}`, 'true')
          } else {
            setIsWishlisted(false)
            localStorage.removeItem(`wl_${productId}`)
          }
        } catch (e) {
          console.error('Wishlist check failed', e)
        } finally {
          if (isMounted) setLoading(false)
        }
      } else {
        setIsLoggedIn(false)
        const localWl = localStorage.getItem(`wl_${productId}`) === 'true'
        setIsWishlisted(localWl)
        setLoading(false)
      }
    }

    checkAuthAndWishlist()
    return () => { isMounted = false }
  }, [productId])

  const toggle = async () => {
    if (loading) return

    if (!isLoggedIn) {
      setIsWishlisted(true)
      localStorage.setItem(`wl_${productId}`, 'true')
      openModal(window.location.pathname)
      return
    }

    const prev = isWishlisted
    setIsWishlisted(!prev)
    setLoading(true)

    try {
      if (!prev) {
        localStorage.setItem(`wl_${productId}`, 'true')
        const res = await fetch('/api/storefront/wishlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ product_id: productId })
        })
        if (!res.ok) throw new Error('Failed to add')
      } else {
        localStorage.removeItem(`wl_${productId}`)
        const res = await fetch(`/api/storefront/wishlist?product_id=${productId}`, {
          method: 'DELETE'
        })
        if (!res.ok) throw new Error('Failed to remove')
      }
    } catch (e) {
      setIsWishlisted(prev)
      if (prev) {
        localStorage.setItem(`wl_${productId}`, 'true')
      } else {
        localStorage.removeItem(`wl_${productId}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const iconSizes = { sm: 16, md: 20, lg: 24 }

  return (
    <button
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        toggle()
      }}
      disabled={loading}
      className={`p-2 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white hover:scale-110 transition-all shadow-sm disabled:opacity-50 ${loading ? 'opacity-50 animate-pulse' : ''}`}
      aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      <Heart
        size={iconSizes[size]}
        className="transition-colors"
        fill={isWishlisted ? '#ef4444' : 'none'}
        stroke={isWishlisted ? '#ef4444' : 'currentColor'}
      />
    </button>
  )
}
