import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Heart } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { WishlistRemoveButton } from './WishlistRemoveButton';

export const dynamic = 'force-dynamic';

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

  if (error) {
    console.error('Wishlist fetch error:', error);
  }

  const wishlistItems = items ?? [];

  const getImageUrl = (product: any) => {
    const images = product?.product_images;
    if (!images || !Array.isArray(images) || images.length === 0) return null;
    
    // Find cover image or first image
    const coverImage = images.find((img: any) => img.is_cover)?.url || images[0]?.url;
    return coverImage;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="border-b border-sage/20 pb-4">
        <h1 className="text-3xl font-heading font-semibold text-charcoal uppercase tracking-widest">My Wishlist</h1>
        <p className="text-muted-foreground text-sm mt-1">Your curated collection of favorites.</p>
      </div>
      
      {wishlistItems.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {wishlistItems.map((item: any) => {
            const product = item.products;
            if (!product) return null;
            const discount = product.compare_at_price && product.price
              ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
              : 0;
            const imgUrl = getImageUrl(product);

            return (
              <div key={item.id} className="group relative flex flex-col gap-4">
                <div className="relative aspect-[3/4] overflow-hidden bg-sage/5 rounded-none border border-sage/10">
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
                      <div className="w-full h-full flex items-center justify-center text-sage/40">
                        <Heart className="w-8 h-8" />
                      </div>
                    )}
                  </Link>
                  
                  {/* Remove from wishlist */}
                  <WishlistRemoveButton productId={item.product_id} />
                  
                  {discount > 0 && (
                    <div className="absolute top-3 left-3 bg-destructive text-cream text-[9px] font-bold px-2 py-1 uppercase tracking-widest">
                      {discount}% OFF
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1.5 px-1">
                  <Link href={`/products/${product.slug}`} className="font-bold text-[13px] uppercase tracking-wider text-charcoal hover:text-teal transition-colors line-clamp-1">
                    {product.name}
                  </Link>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="font-bold text-charcoal">₹{product.price?.toLocaleString() ?? '—'}</span>
                    {product.compare_at_price > product.price && (
                      <span className="text-muted-foreground line-through text-[11px] font-medium opacity-60">₹{product.compare_at_price.toLocaleString()}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border-2 border-dashed border-sage/30 rounded-none p-20 text-center space-y-6">
          <div className="w-20 h-20 bg-sage/10 rounded-full flex items-center justify-center mx-auto">
            <Heart className="w-10 h-10 text-sage/40" />
          </div>
          <div className="max-w-xs mx-auto">
            <h3 className="text-xl font-heading font-semibold text-charcoal mb-2">Your wishlist is empty</h3>
            <p className="text-sm text-muted-foreground mb-8">Start favoriting products and they'll appear here.</p>
            <Link
              href="/products"
              className={buttonVariants({ className: 'w-full h-14 bg-charcoal text-cream rounded-none uppercase tracking-widest text-xs font-bold shadow-xl flex items-center justify-center' })}
            >
              Explore Products
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
