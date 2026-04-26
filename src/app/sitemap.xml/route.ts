import { NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const revalidate = 3600 // regenerate every hour

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://labelwink.co'

export async function GET() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminSupabaseClient() as any

  const [{ data: products }, { data: collections }, { data: policies }, { data: blogPosts }] = await Promise.all([
    supabase.from('products').select('slug, updated_at').eq('visible', true),
    supabase.from('categories').select('slug, updated_at'),
    supabase.from('cms_content').select('slug, updated_at').eq('type', 'policy'),
    supabase.from('blog_posts').select('slug, updated_at, tags').eq('published', true),
  ])

  const staticPages = [
    { url: `${SITE}/`,               priority: '1.0', changefreq: 'daily'   },
    { url: `${SITE}/products`,        priority: '0.9', changefreq: 'daily'   },
    { url: `${SITE}/lookbook`,        priority: '0.8', changefreq: 'weekly'  },
    { url: `${SITE}/about`,           priority: '0.7', changefreq: 'monthly' },
    { url: `${SITE}/contact`,         priority: '0.6', changefreq: 'monthly' },
    { url: `${SITE}/faq`,             priority: '0.6', changefreq: 'monthly' },
    { url: `${SITE}/size-guide`,      priority: '0.5', changefreq: 'monthly' },
  ]

  const productPages = (products ?? []).map((p: { slug: string; updated_at: string }) => ({
    url:        `${SITE}/products/${p.slug}`,
    lastmod:    p.updated_at?.slice(0, 10),
    priority:   '0.8',
    changefreq: 'weekly',
  }))

  const collectionPages = (collections ?? []).map((c: { slug: string; updated_at: string }) => ({
    url:        `${SITE}/collections/${c.slug}`,
    lastmod:    c.updated_at?.slice(0, 10),
    priority:   '0.7',
    changefreq: 'weekly',
  }))

  const policyPages = (policies ?? []).map((p: { slug: string; updated_at: string }) => ({
    url:        `${SITE}/policies/${p.slug}`,
    lastmod:    p.updated_at?.slice(0, 10),
    priority:   '0.3',
    changefreq: 'yearly',
  }))

  const lookbookPages = (blogPosts ?? [])
    .filter((p: { tags: string[] | null }) => p.tags?.includes('lookbook'))
    .map((p: { slug: string; updated_at: string }) => ({
      url:        `${SITE}/lookbook/${p.slug}`,
      lastmod:    p.updated_at?.slice(0, 10),
      priority:   '0.8',
      changefreq: 'monthly',
    }))

  const blogPages = (blogPosts ?? [])
    .filter((p: { tags: string[] | null }) => !p.tags?.includes('lookbook'))
    .map((p: { slug: string; updated_at: string }) => ({
      url:        `${SITE}/blog/${p.slug}`,
      lastmod:    p.updated_at?.slice(0, 10),
      priority:   '0.6',
      changefreq: 'monthly',
    }))

  const allPages = [...staticPages, ...productPages, ...collectionPages, ...policyPages, ...lookbookPages, ...blogPages]

  const urlset = allPages.map(p => `
  <url>
    <loc>${p.url}</loc>${p.lastmod ? `\n    <lastmod>${p.lastmod}</lastmod>` : ''}
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlset}
</urlset>`

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  })
}
