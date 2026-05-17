import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Heart } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { WishlistRemoveButton } from './WishlistRemoveButton';

export const dynamic = 'force-dynamic';

type ProductImage = { url?: string; is_cover?: boolean; sort_order?: number };
type WishlistProduct = {
  id: string;
  name: string;
  slug: string;
  price: number | null;
  compare_at_price: number | null;
  product_images?: ProductImage[] | null;
};

type WishlistRow = {
  id: string;
  product_id: string;
  created_at: string;
  products: WishlistProduct | null;
};

function getImageUrl(product: WishlistProduct | null) {
  const images = product?.product_images;
  if (!images || !Array.isArray(images) || images.length === 0) return null;
  return images.find((img) => img.is_cover)?.url || images[0]?.url || null;
}

export default async function AccountWishlistPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/account/login');
  }

  const { data: items, error } = await supabase
    .from('wishlists')
    .select(`
      id, 
      product_id, 
      created_at, 
      products (
        id, 
        name, 
        slug, 
        price, 
        compare_at_price,
        product_images (url, is_cover, sort_order)
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const wishlistItems = (items ?? []) as WishlistRow[];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="border-b border-labelwink-cream-border pb-4">
        <h1 className="text-3xl font-heading font-semibold text-labelwink-dark uppercase tracking-widest">My Wishlist</h1>
        <p className="text-muted-foreground text-base mt-1">Your curated collection of favorites.</p>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-none border border-destructive/30 bg-destructive/10 px-4 py-3 text-base text-destructive"
        >
          We couldn&apos;t load your wishlist. Please refresh the page or try again shortly.
        </div>
      )}
      
      {!error && wishlistItems.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {wishlistItems.map((item) => {
            const product = item.products;
            if (!product) return null;
            const discount = product.compare_at_price && product.price
              ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
              : 0;
            const imgUrl = getImageUrl(product);

            return (
              <div key={item.id} className="group relative flex flex-col gap-4">
                <div className="relative aspect-[3/4] overflow-hidden bg-labelwink-cream-card rounded-none border border-labelwink-cream-border">
                  <Link href={`/products/${product.slug}`} className="absolute inset-0 block">
                    {imgUrl ? (
                      <Image
                        src={imgUrl}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                        sizes="(max-width: 768px) 50vw, 25vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-brand-faint">
                        <Heart className="w-8 h-8" aria-hidden />
                      </div>
                    )}
                  </Link>
                  
                  <WishlistRemoveButton productId={item.product_id} />
                  
                  {discount > 0 && (
                    <div className="absolute top-3 left-3 bg-destructive text-white text-xs font-bold px-2 py-1 uppercase tracking-widest">
                      {discount}% OFF
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1.5 px-1">
                  <Link href={`/products/${product.slug}`} className="font-bold text-sm uppercase tracking-wider text-labelwink-dark hover:text-labelwink-green transition-colors line-clamp-1">
                    {product.name}
                  </Link>
                  <div className="flex items-center gap-3 text-base">
                    <span className="font-bold text-labelwink-dark">₹{product.price?.toLocaleString() ?? '—'}</span>
                    {product.compare_at_price != null && product.price != null && product.compare_at_price > product.price && (
                      <span className="text-muted-foreground line-through text-sm font-medium">₹{product.compare_at_price.toLocaleString()}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : !error ? (
        <div className="bg-white border-2 border-dashed border-labelwink-cream-border rounded-none p-12 md:p-20 text-center space-y-6">
          <div className="w-20 h-20 bg-labelwink-cream-card rounded-full flex items-center justify-center mx-auto">
            <Heart className="w-10 h-10 text-brand-faint" aria-hidden />
          </div>
          <div className="max-w-xs mx-auto">
            <h2 className="text-xl font-heading font-semibold text-labelwink-dark mb-2">Your wishlist is empty</h2>
            <p className="text-base text-muted-foreground mb-8">Start favoriting products and they&apos;ll appear here.</p>
            <Link
              href="/products"
              className={buttonVariants({ className: 'w-full min-h-11 h-14 bg-labelwink-dark text-white rounded-none uppercase tracking-widest text-sm font-bold shadow-xl flex items-center justify-center focus-visible:ring-2 focus-visible:ring-labelwink-gold focus-visible:ring-offset-2' })}
            >
              Explore Products
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
