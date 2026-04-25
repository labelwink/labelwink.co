'use client';

import { useState, useEffect } from 'react';
import { Trash2, ShoppingCart, Loader2, Heart, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { ProductImage } from '@/components/storefront/ProductImage';
import { useCartStore } from '@/store/useCartStore';

export default function AccountWishlistPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const { addItem, setIsOpen } = useCartStore();

  useEffect(() => {
    fetchWishlist();
  }, []);

  async function fetchWishlist() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('wishlists')
        .select(`
          id,
          products (
            id,
            name,
            slug,
            product_variants (
              id,
              price,
              mrp,
              image_public_ids,
              color,
              size
            )
          )
        `)
        .eq('user_id', user.id);
      
      if (data) setItems(data);
    }
    setLoading(false);
  }

  async function handleRemove(id: string) {
    const { error } = await supabase.from('wishlists').delete().eq('id', id);
    if (!error) {
      setItems(items.filter(item => item.id !== id));
    }
  }

  const handleAddToCart = (product: any) => {
    const variant = product.product_variants?.[0];
    if (!variant) return;

    addItem({
      id: variant.id,
      name: product.name,
      price: variant.price,
      image: variant.image_public_ids?.[0] || '',
      quantity: 1,
      color: variant.color,
      size: variant.size,
      slug: product.slug,
      publicId: variant.image_public_ids?.[0]
    });
    setIsOpen(true);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-[40vh]"><Loader2 className="w-8 h-8 animate-spin text-teal" /></div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="border-b border-sage/20 pb-4">
        <h1 className="text-3xl font-heading font-semibold text-charcoal uppercase tracking-widest">My Wishlist</h1>
        <p className="text-muted-foreground text-sm mt-1">Your curated collection of favorites.</p>
      </div>
      
      {items.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {items.map((item) => {
            const product = item.products;
            const variant = product.product_variants?.[0];
            const discount = variant?.mrp ? Math.round(((variant.mrp - variant.price) / variant.mrp) * 100) : 0;

            return (
              <div key={item.id} className="group relative flex flex-col gap-4">
                <div className="relative aspect-[3/4] overflow-hidden bg-sage/5 rounded-none border border-sage/10">
                  <Link href={`/products/${product.slug}`} className="absolute inset-0 block">
                    {variant?.image_public_ids?.[0] ? (
                      <ProductImage 
                        publicId={variant.image_public_ids[0]} 
                        alt={product.name} 
                        width={300} 
                        height={400} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sage/40"><Heart className="w-8 h-8" /></div>
                    )}
                  </Link>
                  
                  <button 
                    onClick={() => handleRemove(item.id)}
                    className="absolute top-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur-sm text-destructive hover:bg-destructive hover:text-white transition-all z-10 shadow-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  
                  <div className="absolute bottom-4 left-4 right-4 translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                    <Button 
                      onClick={() => handleAddToCart(product)}
                      className="w-full bg-teal hover:bg-teal/90 text-cream text-[10px] uppercase tracking-widest font-bold h-12 rounded-none gap-2 shadow-xl border-none"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" /> Quick Buy
                    </Button>
                  </div>
                  
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
                    <span className="font-bold text-charcoal">₹{variant?.price.toLocaleString()}</span>
                    {variant?.mrp > variant?.price && (
                      <span className="text-muted-foreground line-through text-[11px] font-medium opacity-60">₹{variant.mrp.toLocaleString()}</span>
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
            <h3 className="text-xl font-heading font-semibold text-charcoal mb-2">Wishlist is Empty</h3>
            <p className="text-sm text-muted-foreground mb-8">Start hearts-ing your favorites and they'll appear here.</p>
            <Button asChild className="w-full h-14 bg-charcoal text-cream rounded-none uppercase tracking-widest text-xs font-bold shadow-xl">
              <Link href="/collections/all">Go Shopping</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
