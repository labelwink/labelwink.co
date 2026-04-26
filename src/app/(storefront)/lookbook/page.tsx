import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import Image from 'next/image'
import Link from 'next/link'
import { cloudinaryUrl } from '@/lib/utils/cloudinary'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Lookbook – Label Wink',
  description: 'Explore our editorial lookbooks and shop curated seasonal styles.',
  openGraph: { title: 'Lookbook – Label Wink', description: 'Shop curated seasonal styles from Label Wink.' },
}

export const revalidate = 3600

interface LookbookPost {
  id:              string
  title:           string
  slug:            string
  cover_image_url: string | null
  excerpt:         string | null
  tags:            string[] | null
  created_at:      string
}

export default async function LookbookPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminSupabaseClient() as any

  const { data: posts } = await supabase
    .from('blog_posts')
    .select('id, title, slug, cover_image_url, excerpt, tags, created_at')
    .contains('tags', ['lookbook'])
    .eq('published', true)
    .order('created_at', { ascending: false })

  const lookbooks: LookbookPost[] = posts ?? []

  const seasonTag = (tags: string[] | null) =>
    tags?.find(t => ['spring', 'summer', 'autumn', 'winter', 'festive', 'wedding'].includes(t.toLowerCase()))

  return (
    <div className="min-h-screen bg-[#faf7f2]">
      {/* Hero */}
      <div className="bg-[#1b3a34] text-white py-16 md:py-24 text-center px-4">
        <p className="text-xs tracking-[0.25em] uppercase text-[#c9a84c] mb-3 font-semibold">Editorial</p>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Lookbook</h1>
        <p className="text-white/70 max-w-md mx-auto text-sm">
          Campaign stories, style edits, and seasonal inspiration from Label Wink.
        </p>
      </div>

      {/* Grid */}
      <div className="container mx-auto px-4 py-12">
        {lookbooks.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[#6b7280] text-sm">No lookbooks published yet. Check back soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {lookbooks.map(post => {
              const season = seasonTag(post.tags)
              const imgUrl = cloudinaryUrl(post.cover_image_url, 'pdp')
              return (
                <Link
                  key={post.id}
                  href={`/lookbook/${post.slug}`}
                  className="group block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow"
                >
                  <div className="relative aspect-[4/5] overflow-hidden bg-gray-100">
                    {imgUrl ? (
                      <Image
                        src={imgUrl}
                        alt={post.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#1b3a34]/10 to-[#c9a84c]/10 flex items-center justify-center">
                        <span className="text-4xl">✨</span>
                      </div>
                    )}
                    {season && (
                      <span className="absolute top-3 left-3 px-2.5 py-1 bg-[#1b3a34] text-white text-[10px] font-bold uppercase tracking-wider rounded-full capitalize">
                        {season}
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <h2 className="font-bold text-[#1a1a1a] text-base line-clamp-2 group-hover:text-[#1b3a34] transition-colors mb-1">
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className="text-[#6b7280] text-xs line-clamp-2 mb-3">{post.excerpt}</p>
                    )}
                    <span className="text-xs font-semibold text-[#1b3a34] flex items-center gap-1">
                      Shop the Look →
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
