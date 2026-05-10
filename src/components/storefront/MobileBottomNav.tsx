'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, ShoppingBag, Heart, ShoppingCart, User } from 'lucide-react'
import { useCartStore } from '@/store/useCartStore'
import { createClient } from '@/lib/supabase/client'

const NAV_ITEMS = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Shop', href: '/products', icon: ShoppingBag },
  { label: 'Wishlist', href: '/wishlist', icon: Heart },
  { label: 'Cart', href: '/cart', icon: ShoppingCart, isCart: true },
  { label: 'Account', href: '/account', icon: User },
] as const

export function MobileBottomNav() {
  const pathname = usePathname()
  const { getTotals, setIsOpen } = useCartStore()
  const { totalQuantity } = getTotals()
  const [wishlistCount, setWishlistCount] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    const loadWishlistCount = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        try {
          const res = await fetch('/api/storefront/wishlist')
          const data = await res.json()
          if (data.count) setWishlistCount(data.count)
        } catch {}
      } else {
        // Count localStorage wishlist items
        let count = 0
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key?.startsWith('wl_') && localStorage.getItem(key) === 'true') count++
        }
        setWishlistCount(count)
      }
    }

    loadWishlistCount()
  }, [pathname]) // re-check on route change

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  if (!mounted) return null

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#e8e2d6] md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center justify-around h-16">
        {NAV_ITEMS.map(item => {
          const active = isActive(item.href)
          const Icon = item.icon
          const isCartItem = 'isCart' in item && item.isCart

          // Cart opens the drawer instead of navigating
          if (isCartItem) {
            return (
              <button
                key={item.label}
                onClick={() => setIsOpen(true)}
                className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full relative"
              >
                <div className="relative">
                  <Icon
                    size={22}
                    className={`transition-colors ${active ? 'text-[#c9a84c]' : 'text-white/40'}`}
                    strokeWidth={active ? 2.5 : 1.5}
                  />
                  {totalQuantity > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 bg-[#c9a84c] text-[#ffffff] text-[8px] font-bold h-4 min-w-[16px] rounded-full flex items-center justify-center px-0.5">
                      {totalQuantity > 9 ? '9+' : totalQuantity}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] tracking-wide ${active ? 'text-[#c9a84c] font-semibold' : 'text-white/40'}`}>
                  {item.label}
                </span>
              </button>
            )
          }

          const isWishlist = item.href === '/wishlist'

          return (
            <Link
              key={item.label}
              href={item.href}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full relative"
            >
              <div className="relative">
                <Icon
                  size={22}
                  className={`transition-colors ${active ? 'text-[#c9a84c]' : 'text-white/40'}`}
                  strokeWidth={active ? 2.5 : 1.5}
                  fill={isWishlist && active ? '#c9a84c' : 'none'}
                />
                {isWishlist && wishlistCount > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 bg-[#c9a84c] text-[#ffffff] text-[8px] font-bold h-4 min-w-[16px] rounded-full flex items-center justify-center px-0.5">
                    {wishlistCount > 9 ? '9+' : wishlistCount}
                  </span>
                )}
              </div>
              <span className={`text-[10px] tracking-wide ${active ? 'text-[#c9a84c] font-semibold' : 'text-white/40'}`}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
