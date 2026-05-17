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
          const result = await res.json()
          const alerts = result.alerts || []
          if (Array.isArray(alerts) && alerts.some((a: any) => a.variant_id === variantId)) {
            setIsSubscribed(true)
          }
        } catch {
          // Status check failed; guest/local fallback still works
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
      <button 
        disabled 
        className="w-full h-14 md:h-16 flex items-center justify-center gap-2 border border-green-700/30 text-green-800 bg-green-50/50 rounded-xl font-bold text-xs uppercase tracking-[0.2em] cursor-not-allowed"
      >
        <Check size={16} className="text-green-700" />
        Alert Set ✓
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
        body: JSON.stringify({ 
          product_id: productId, 
          variant_id: variantId, 
          size, 
          email: isLoggedIn ? undefined : email 
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Something went wrong')

      setStatus('success')
      setMessage(data.message || '✅ We will notify you!')
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
      <div className="w-full p-4 border border-[#E8E2D9] rounded-xl bg-[#FAF5E9]/50 backdrop-blur-sm shadow-sm animate-in fade-in duration-300">
        <p className="text-xs text-[#1C3829] font-bold uppercase tracking-[0.15em] mb-2.5">Enter Email to get notified</p>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="email"
            required
            placeholder="your@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="flex-1 h-14 px-4 border border-[#E8E2D9] rounded-xl text-sm text-[#1C3829] outline-none bg-white focus:border-[#c9a84c] focus:ring-1 focus:ring-[#c9a84c] transition-all"
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="h-14 px-6 bg-[#1B3A2D] text-white rounded-xl text-xs font-bold uppercase tracking-[0.2em] hover:bg-[#173129] transition-colors disabled:opacity-50 flex items-center justify-center"
          >
            {status === 'loading' ? '...' : 'Notify'}
          </button>
        </form>
        {status === 'error' && <p className="text-red-600 text-xs mt-2 font-medium">{message}</p>}
      </div>
    )
  }

  return (
    <div className="w-full">
      <button
        onClick={handleClick}
        disabled={status === 'loading'}
        className="w-full h-14 md:h-16 py-3 px-4 flex items-center justify-center gap-2 border border-[#1B3A2D]/20 text-[#1B3A2D] bg-[#FAF5E9] hover:bg-[#1B3A2D] hover:text-white rounded-xl font-bold text-xs uppercase tracking-[0.2em] transition-all duration-300 shadow-sm disabled:opacity-50"
      >
        <Bell size={16} />
        {status === 'loading' ? 'Setting Alert...' : 'Notify when available'}
      </button>
      {status === 'error' && <p className="text-red-600 text-xs mt-2 text-center font-medium">{message}</p>}
    </div>
  )
}
