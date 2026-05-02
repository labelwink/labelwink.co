import { createClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/product/ProductCard'
import { LoginPromptButton } from './LoginPromptButton'
import { ShareButton } from './ShareButton'
import { MoveToCartButton } from './MoveToCartButton'
import { RemoveFromWishlistButton } from './RemoveFromWishlistButton'
import Link from 'next/link'

export const metadata = {
  title: 'My Wishlist | LabelWink',
}

export default async function WishlistPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-20 h-20 bg-[#faf7f2] rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
          <span className="text-4xl">❤️</span>
        </div>
        <h1 className="text-3xl font-bold text-[#1a1a1a] mb-4">Sign in to view your wishlist</h1>
        <p className="text-gray-500 mb-8 max-w-md mx-auto">
          Save your favorite items and access them from any device by signing in to your account.
        </p>
        <LoginPromptButton />
      </div>
    )
  }

  // Fetch wishlist
  const { data: wishlists } = await supabase
    .from('wishlists')
    .select(`
      *,
      products (
        id, name, slug, price, compare_at_price, images,
        product_variants (size, stock_qty)
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const items = (wishlists || []).map(w => {
    const p = Array.isArray(w.products) ? w.products[0] : w.products
    return { ...w, product: p }
  }).filter(w => w.product) // Safety filter

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-20 h-20 bg-[#faf7f2] rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
          <span className="text-4xl">❤️</span>
        </div>
        <h1 className="text-3xl font-bold text-[#1a1a1a] mb-2">Your wishlist is empty</h1>
        <p className="text-gray-500 mb-8 max-w-md mx-auto">
          Start adding products you love ❤️
        </p>
        <Link 
          href="/collections/all"
          className="bg-[#1a1a1a] text-[#faf7f2] px-8 py-3 rounded-md font-medium hover:bg-[#333] transition"
        >
          Browse Collections &rarr;
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 min-h-screen">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 pb-6 border-b border-gray-100">
        <h1 className="text-3xl font-bold text-[#1a1a1a]">My Wishlist <span className="text-gray-400 font-normal text-xl">({items.length})</span></h1>
        <div className="mt-4 md:mt-0">
          <ShareButton userId={user.id} />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
        {items.map((item) => {
          const p = item.product
          const images = p.images || []
          const image = images.length > 0 ? images[0] : ''
          const hoverImage = images.length > 1 ? images[1] : undefined
          
          // Total stock calculation
          const totalStock = Array.isArray(p.product_variants) 
            ? p.product_variants.reduce((acc: number, v: any) => acc + (v.stock_qty || 0), 0)
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
