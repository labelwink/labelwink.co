import type { MetadataRoute } from 'next'
import { createAdminClient } from '@/lib/supabase/server'

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  let settings: Record<string, any> = {}

  try {
    const supabase = createAdminClient()
    const keys = ['pwa_name', 'pwa_short_name', 'pwa_theme_color', 'pwa_background_color', 'logo_url', 'store_tagline']
    const { data } = await supabase.from('site_settings').select('key, value').in('key', keys)
    settings = (data ?? []).reduce((acc: Record<string, any>, row) => {
      const raw = row.value
      acc[row.key] = raw !== null && typeof raw === 'object' && 'v' in raw ? raw.v : raw
      return acc
    }, {})
  } catch {
    // Fallback to defaults
  }

  return {
    name: settings.pwa_name || 'LabelWink',
    short_name: settings.pwa_short_name || 'LabelWink',
    description: settings.store_tagline || 'Fashion that speaks to you',
    start_url: '/',
    display: 'standalone',
    background_color: settings.pwa_background_color || '#ffffff',
    theme_color: settings.pwa_theme_color || '#c9a84c',
    orientation: 'portrait',
    icons: [
      {
        src: settings.logo_url || '/icon',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: settings.logo_url || '/icon',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
    categories: ['shopping', 'lifestyle'],
    shortcuts: [
      {
        name: 'New Arrivals',
        url: '/products?sort=newest',
        description: 'Browse latest products',
      },
      {
        name: 'My Orders',
        url: '/account/orders',
        description: 'Track your orders',
      },
    ],
  }
}
