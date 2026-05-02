import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/product/ProductCard'
import { MoveToCartButton } from '../MoveToCartButton'

export const metadata = {
  title: 'Shared Wishlist | LabelWink',
}

interface SharedWishlistPageProps {
  params: Promise<{ userId: string }>
}

export default async function SharedWishlistPage({ params }: SharedWishlistPageProps) {
  const { userId } = await params
  
  // Use admin client since we are fetching a public view of a user's wishlist
  // We can also just use an open read policy but to be safe we use Admin.
  const supabase = createAdminClient()

  // Verify user exists and get name
  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name')
    .eq('id', userId)
    .single()

  if (!profile) {
    notFound()
  }

  const name = profile.first_name ? `${profile.first_name}'s` : 'Shared'

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
    .eq('user_id', userId)
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
        <h1 className="text-3xl font-bold text-[#1a1a1a] mb-2">{name} Wishlist is empty</h1>
        <p className="text-gray-500 mb-8 max-w-md mx-auto">
          They haven't added any products yet.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 min-h-screen">
      <div className="mb-8 pb-6 border-b border-gray-100">
        <h1 className="text-3xl font-bold text-[#1a1a1a]">{name} Wishlist <span className="text-gray-400 font-normal text-xl">({items.length})</span></h1>
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
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
