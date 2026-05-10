'use client'

import { useState, useEffect } from 'react'
import { useSiteSettings } from '@/hooks/useSiteSettings'

interface AnnouncementBarProps {
  text?: string
  color?: string
  enabled?: boolean
}

export function AnnouncementBar(props?: AnnouncementBarProps) {
  const { settings } = useSiteSettings()
  const [dismissed, setDismissed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (typeof window !== 'undefined' && sessionStorage.getItem('bar_dismissed') === '1') {
      setDismissed(true)
    }
  }, [])

  if (!mounted) return null

  // Use provided props (from layout) or fall back to dynamic settings
  const enabled = props?.enabled ?? settings?.show_announcement_bar ?? true
  const text = props?.text ?? settings?.announcement_text ?? ''
  const fallbackText = settings?.free_shipping_threshold
    ? `Free shipping on orders above ₹${settings.free_shipping_threshold.toLocaleString('en-IN')}`
    : ''
  const color = props?.color ?? '#C9A84C'

  const displayText = text.trim() || fallbackText
  if (!enabled || !displayText || dismissed) return null

  const dismiss = () => {
    sessionStorage.setItem('bar_dismissed', '1')
    setDismissed(true)
  }

  const isLegacyColor = !color || ['#1b3a34', '#faf8f4', '#1e3d29'].includes(color)
  const bgColor = isLegacyColor ? '#C9A84C' : color
  const isDark = bgColor === '#C9A84C' || bgColor === '#c9a84c' || bgColor === '#d4b76a'
  const textColor = isDark ? '#1C3829' : '#ffffff'

  return (
    <div
      className="bg-[#C9A84C] text-[#1C3829] text-center text-sm font-medium py-2.5 px-4"
      style={{ backgroundColor: bgColor, color: textColor, position: 'relative' }}
    >
      <span style={{ letterSpacing: '0.02em' }}>
        {displayText}
      </span>
      <button
        type="button"
        onClick={dismiss}
        style={{
          position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)',
          background: 'none', border: 'none', cursor: 'pointer',
          color: isDark ? '#1C3829' : 'rgba(255,255,255,0.7)',
          fontSize: '16px', lineHeight: 1, padding: '4px',
        }}
        aria-label="Dismiss announcement"
      >
        ✕
      </button>
    </div>
  )
}
