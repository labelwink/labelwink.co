'use client'

import { useState, useEffect } from 'react'

export type SiteSettings = {
  store_name?: string
  store_tagline?: string
  logo_url?: string
  support_email?: string
  support_phone?: string
  whatsapp_number?: string
  address?: string
  city?: string
  state?: string
  pincode?: string
  currency?: string
  free_shipping_threshold?: number
  show_announcement_bar?: boolean
  announcement_text?: string
  facebook_url?: string
  instagram_url?: string
  twitter_url?: string
  youtube_url?: string
  cod_enabled?: boolean
  online_payment_enabled?: boolean
}

let cache: SiteSettings | null = null
let cacheTime = 0
const TTL = 5 * 60 * 1000 // 5 min cache

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings | null>(cache)
  const [loading, setLoading] = useState(!cache)

  useEffect(() => {
    const now = Date.now()
    if (cache && now - cacheTime < TTL) {
      setSettings(cache)
      setLoading(false)
      return
    }

    fetch('/api/storefront/settings')
      .then((r) => r.json())
      .then((d) => {
        cache = d
        cacheTime = Date.now()
        setSettings(d)
      })
      .catch(() => setSettings(null))
      .finally(() => setLoading(false))
  }, [])

  return { settings, loading }
}
