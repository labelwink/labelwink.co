'use client'

import { useState, useEffect } from 'react'
import { Bell, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface StockAlertButtonProps {
  productId: string
  variantId: string
  size: string
  currentStock: number
}

export function StockAlertButton({ productId, variantId, size, currentStock }: StockAlertButtonProps) {
  const [email, setEmail] = useState('')
  const [showEmailInput, setShowEmailInput] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    let isMounted = true
    const checkStatus = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!isMounted) return

      if (user) {
        setIsLoggedIn(true)
        try {
          const res = await fetch('/api/storefront/stock-alerts')
          const alerts = await res.json()
          if (Array.isArray(alerts) && alerts.some(a => a.variant_id === variantId)) {
            setIsSubscribed(true)
          }
        } catch (e) {
          console.error(e)
        }
      } else {
        // Simple guest check via local storage for UI purposes
        const subscribed = localStorage.getItem(`alert_${variantId}`) === 'true'
        if (subscribed) setIsSubscribed(true)
      }
    }
    checkStatus()
    return () => { isMounted = false }
  }, [variantId])

  if (currentStock > 0) return null

  if (isSubscribed) {
    return (
      <button disabled className="w-full py-3 px-4 flex items-center justify-center gap-2 border border-green-600 text-green-700 bg-green-50 rounded-md font-medium text-sm cursor-not-allowed">
        <Check size={18} />
        Alert set ✓
      </button>
    )
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!isLoggedIn && !email) return

    setStatus('loading')
    try {
      const res = await fetch('/api/storefront/stock-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId, variant_id: variantId, size, email: isLoggedIn ? undefined : email })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Something went wrong')

      setStatus('success')
      setMessage(data.message || '✅ We will notify you')
      setIsSubscribed(true)
      if (!isLoggedIn) {
        localStorage.setItem(`alert_${variantId}`, 'true')
      }
    } catch (err: any) {
      setStatus('error')
      setMessage(err.message)
    }
  }

  const handleClick = () => {
    if (isLoggedIn) {
      handleSubmit()
    } else {
      setShowEmailInput(true)
    }
  }

  if (showEmailInput && !isSubscribed) {
    return (
      <div className="w-full mt-4 p-4 border border-gray-200 rounded-md bg-gray-50">
        <p className="text-sm text-[#ffffff] font-medium mb-2">Enter email to get notified:</p>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="email"
            required
            placeholder="your@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm outline-none focus:border-[#c9a84c] focus:ring-1 focus:ring-[#c9a84c]"
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="px-4 py-2 bg-white text-[#faf7f2] rounded-md text-sm font-medium hover:bg-[#333] transition-colors disabled:opacity-50"
          >
            {status === 'loading' ? '...' : 'Notify Me'}
          </button>
        </form>
        {status === 'error' && <p className="text-red-500 text-xs mt-2">{message}</p>}
      </div>
    )
  }

  return (
    <div className="w-full">
      <button
        onClick={handleClick}
        disabled={status === 'loading'}
        className="w-full py-3 px-4 flex items-center justify-center gap-2 border border-[#ffffff] text-[#ffffff] rounded-md font-medium text-sm hover:bg-white hover:text-[#faf7f2] transition-colors disabled:opacity-50"
      >
        <Bell size={18} />
        {status === 'loading' ? 'Setting Alert...' : 'Notify me when available'}
      </button>
      {status === 'error' && <p className="text-red-500 text-xs mt-2 text-center">{message}</p>}
    </div>
  )
}
