import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { cloudinaryUrl, getCloudinaryUrl } from '@/lib/utils/cloudinary'
import type { Metadata } from 'next'

export const revalidate = 3600

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminSupabaseClient() as any
  const { data } = await supabase
    .from('blog_posts')
    .select('title, excerpt, cover_image_url')
    .eq('slug', slug)
    .single()

  if (!data) return { title: 'Lookbook – Label Wink' }
  return {
    title:       `${data.title} – Label Wink Lookbook`,
    description: data.excerpt ?? 'Shop the look from Label Wink.',
    openGraph: {
      title:       data.title,
      description: data.excerpt ?? '',
      images:      data.cover_image_url ? [{ url: data.cover_image_url }] : [],
    },
    twitter: { card: 'summary_large_image' },
  }
}

export default async function LookbookSlugPage({ params }: Props) {
  const { slug } = await params
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminSupabaseClient() as any

  const { data: post } = await supabase
    .from('blog_posts')
    .select('id, title, slug, cover_image_url, excerpt, content, tags, related_product_ids, created_at')
    .eq('slug', slug)
    .eq('published', true)
    .single()

  if (!post) notFound()

  // Fetch related products if any
  const relatedIds: string[] = post.related_product_ids ?? []
  const relatedProducts: Array<{
    id: string; name: string; slug: string; price: number;
    product_images: { url: string; is_cover: boolean }[]
  }> = []

  if (relatedIds.length > 0) {
    const { data: prods } = await supabase
      .from('products')
      .select('id, name, slug, price, product_images(url, is_cover)')
      .in('id', relatedIds)
      .eq('visible', true)
    if (prods) relatedProducts.push(...prods)
  }

  // Fetch 3 other lookbooks
  const { data: otherPosts } = await supabase
    .from('blog_posts')
    .select('id, title, slug, cover_image_url, excerpt')
    .contains('tags', ['lookbook'])
    .eq('published', true)
    .neq('slug', slug)
    .limit(3)

  const coverUrl = getCloudinaryUrl(post.cover_image_url, { width: 800, height: 1000 })

  return (
    <div className="min-h-screen bg-[#faf7f2]">
      {/* Hero */}
      <div className="relative h-[70vh] min-h-[400px] bg-[#1b3a34]">
        {coverUrl && (
          <Image
            src={coverUrl}
            alt={post.title}
            fill
            priority
            className="object-cover opacity-60"
            sizes="100vw"
          />
        )}
        <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-16">
          <div className="max-w-2xl">
            <Link
              href="/lookbook"
              className="inline-block text-xs text-white/70 hover:text-white mb-4 transition-colors"
            >
              ← Back to Lookbook
            </Link>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-3">{post.title}</h1>
            {post.excerpt && (
              <p className="text-white/80 text-sm md:text-base max-w-lg">{post.excerpt}</p>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      {post.content && (
        <div className="container mx-auto px-4 py-12 max-w-2xl">
          <div
            className="prose prose-sm max-w-none text-[#1a1a1a] prose-headings:text-[#1b3a34] prose-a:text-[#1b3a34]"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </div>
      )}

      {/* Shop This Look */}
      {relatedProducts.length > 0 && (
        <div className="container mx-auto px-4 py-12">
          <h2 className="text-xl font-bold text-[#1a1a1a] mb-6">Shop This Look</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {relatedProducts.map(product => {
              const cover = product.product_images?.find((img: { is_cover: boolean }) => img.is_cover)?.url
                         ?? product.product_images?.[0]?.url
              const imgUrl = getCloudinaryUrl(cover, { width: 400, height: 500 })
              return (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  className="group bg-white rounded-xl overflow-hidden border border-[#e5e7eb] hover:border-[#1b3a34]/30 hover:shadow-md transition-all"
                >
                  <div className="relative aspect-[4/5] overflow-hidden bg-gray-50">
                    {imgUrl && (
                      <Image
                        src={imgUrl}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width:640px) 50vw, 25vw"
                      />
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium text-[#1a1a1a] line-clamp-1">{product.name}</p>
                    <p className="text-sm text-[#1b3a34] font-bold mt-0.5">
                      ₹{Number(product.price).toLocaleString('en-IN')}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Related Lookbooks */}
      {(otherPosts ?? []).length > 0 && (
        <div className="bg-white py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-xl font-bold text-[#1a1a1a] mb-6">More Lookbooks</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {(otherPosts as Array<{id: string; title: string; slug: string; cover_image_url: string | null; excerpt: string | null}>).map(other => (
                <Link
                  key={other.id}
                  href={`/lookbook/${other.slug}`}
                  className="group block rounded-xl overflow-hidden border border-[#e5e7eb] hover:shadow-md transition-shadow"
                >
                  <div className="relative aspect-video overflow-hidden bg-gray-100">
                    {other.cover_image_url && (
                      <Image
                        src={getCloudinaryUrl(other.cover_image_url, { width: 400, height: 250 })}
                        alt={other.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="33vw"
                      />
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-semibold text-[#1a1a1a] line-clamp-1">{other.title}</p>
                    {other.excerpt && (
                      <p className="text-xs text-[#6b7280] mt-0.5 line-clamp-1">{other.excerpt}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
