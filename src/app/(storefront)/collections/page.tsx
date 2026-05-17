import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'

export const metadata = {
  title: 'Collections',
  description: 'Explore our curated collections of ethnic wear',
}

export const revalidate = 60

export default async function CollectionsPage() {
  const supabase = await createClient()

  const { data: collections } = await supabase
    .from('collections')
    .select('id, name, slug, description, image_url, product_count')
    .eq('visible', true)
    .order('sort_order', { ascending: true })

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="text-xs tracking-wider text-muted-foreground uppercase mb-6">
        <Link href="/" className="hover:text-[#1a3a34] transition-colors">Home</Link>
        <span className="mx-2">/</span>
        <span className="text-[#1a3a34] font-semibold">Collections</span>
      </nav>

      {/* Header */}
      <h1 className="text-3xl font-serif text-[#1a3a34] text-center py-8 tracking-wide">
        Our Collections
      </h1>

      {/* Empty state */}
      {!collections || collections.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
          <div className="w-20 h-20 rounded-full bg-[#1a3a34]/10 flex items-center justify-center text-[#1a3a34] text-2xl font-serif font-bold">
            LW
          </div>
          <p className="text-lg font-medium text-[#1a3a34]">Collections coming soon</p>
          <p className="text-sm text-[#9aab9e] max-w-xs">
            We&apos;re curating something beautiful. Check back shortly.
          </p>
          <Link
            href="/products"
            className="mt-4 px-6 py-2.5 bg-[#1a3a34] text-[#f5f0e8] text-sm font-medium rounded-full hover:bg-[#234d44] transition-colors"
          >
            Browse All Products
          </Link>
        </div>
      ) : (
        /* Collection grid */
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 pb-16">
          {collections.map((col) => (
            <Link
              key={col.id}
              href={`/products?collection=${encodeURIComponent(col.slug)}`}
              className="group relative block overflow-hidden rounded-sm aspect-[4/3] bg-[#1a3a34]"
            >
              {/* Image */}
              {col.image_url ? (
                <Image
                  src={col.image_url}
                  alt={col.name}
                  fill
                  sizes="(max-width: 768px) 50vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                /* LW monogram fallback */
                <div className="absolute inset-0 flex items-center justify-center bg-[#1a3a34]">
                  <span className="text-[#c9a84c] text-4xl font-serif font-bold tracking-widest select-none">
                    LW
                  </span>
                </div>
              )}

              {/* Dark hover overlay */}
              <div className="absolute inset-0 bg-[#1a3a34] opacity-30 group-hover:opacity-60 transition-opacity duration-300" />

              {/* Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 p-4">
                <h2 className="text-white text-center font-serif text-lg md:text-xl font-semibold drop-shadow-sm leading-tight">
                  {col.name}
                </h2>
                {col.product_count != null && col.product_count > 0 && (
                  <p className="text-[#f5f0e8]/80 text-xs tracking-wider">
                    {col.product_count} piece{col.product_count !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
