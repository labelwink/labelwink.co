import { createClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/product/ProductCard'
import { LoginPromptButton } from './LoginPromptButton'
import { ShareButton } from './ShareButton'
import { MoveToCartButton } from './MoveToCartButton'
import { RemoveFromWishlistButton } from './RemoveFromWishlistButton'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const metadata = {
  title: 'My Wishlist',
}

export default async function WishlistPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-20 h-20 bg-labelwink-cream-card rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
          <span className="text-4xl" aria-hidden>
            ❤️
          </span>
        </div>
        <h1 className="text-3xl font-bold text-labelwink-green mb-4">Sign in to view your wishlist</h1>
        <p className="text-base text-brand-faint mb-8 max-w-md mx-auto">
          Save your favorite items and access them from any device by signing in to your account.
        </p>
        <LoginPromptButton />
      </div>
    )
  }

  const { data: wishlists } = await supabase
    .from('wishlists')
    .select(`
      *,
      products (
        id, name, slug, price, compare_at_price,
        product_images (url, is_cover, sort_order),
        product_variants (size, stock_qty)
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const items = (wishlists || []).map(w => {
    const p = Array.isArray(w.products) ? w.products[0] : w.products
    return { ...w, product: p }
  }).filter(w => w.product)

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-20 h-20 bg-labelwink-cream-card rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
          <span className="text-4xl" aria-hidden>
            ❤️
          </span>
        </div>
        <h1 className="text-3xl font-bold text-labelwink-green mb-2">Your wishlist is empty</h1>
        <p className="text-base text-brand-faint mb-8 max-w-md mx-auto">
          Start adding products you love.
        </p>
        <Link
          href="/products"
          className={cn(
            buttonVariants(),
            'h-11 min-h-11 px-8 bg-labelwink-green text-white hover:bg-labelwink-green-hover'
          )}
        >
          Browse Products →
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 min-h-screen">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 pb-6 border-b border-labelwink-cream-border">
        <h1 className="text-3xl font-bold text-labelwink-green">
          My Wishlist{' '}
          <span className="text-brand-muted font-normal text-xl">({items.length})</span>
        </h1>
        <div className="mt-4 md:mt-0">
          <ShareButton userId={user.id} />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
        {items.map((item) => {
          const p = item.product
          const images = p.product_images || []
          const image = images.find((img: { is_cover?: boolean; url?: string }) => img.is_cover)?.url || images[0]?.url || ''
          const hoverImage = images.length > 1 ? images[1]?.url : undefined

          const totalStock = Array.isArray(p.product_variants)
            ? p.product_variants.reduce((acc: number, v: { stock_qty?: number }) => acc + (v.stock_qty || 0), 0)
            : 0

          return (
            <div key={item.id} className="flex flex-col">
              <ProductCard
                id={p.id}
                name={p.name}
                slug={p.slug}
                basePrice={p.price}
                compareAtPrice={p.compare_at_price}
                image={image}
                hoverImage={hoverImage}
                totalStock={totalStock}
              />
              <div className="mt-2 flex flex-col gap-2">
                <MoveToCartButton productId={p.id} slug={p.slug} />
                <div className="flex justify-center mt-1">
                  <RemoveFromWishlistButton productId={p.id} />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
