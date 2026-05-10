import type { MetadataRoute } from 'next'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://shop.hawklab.in'
  const supabase = createAdminSupabaseClient()

  // Fetch in parallel
  const [productsRes, collectionsRes, occasionsRes] = await Promise.all([
    supabase.from('products').select('slug, updated_at').eq('is_active', true),
    supabase.from('collections').select('slug').eq('visible', true),
    Promise.resolve(supabase.from('occasions').select('slug').eq('is_active', true)).catch(() => ({ data: [] }))
  ])

  const products = productsRes.data || []
  const collections = collectionsRes.data || []
  const occasions = (occasionsRes as any)?.data || []

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${SITE_URL}/products`, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${SITE_URL}/about`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/track-order`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/rewards`, changeFrequency: 'monthly', priority: 0.6 }
  ]

  const productPages: MetadataRoute.Sitemap = products.map(p => ({
    url: `${SITE_URL}/products/${p.slug}`,
    lastModified: new Date(p.updated_at),
    changeFrequency: 'weekly',
    priority: 0.8
  }))

  const collectionPages: MetadataRoute.Sitemap = collections.map(c => ({
    url: `${SITE_URL}/products?collection=${c.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.7
  }))

  const occasionPages: MetadataRoute.Sitemap = occasions.map((o: any) => ({
    url: `${SITE_URL}/products?occasion=${o.slug}`,
    changeFrequency: 'weekly',
    priority: 0.6
  }))

  return [
    ...staticPages,
    ...productPages,
    ...collectionPages,
    ...occasionPages
  ]
}
