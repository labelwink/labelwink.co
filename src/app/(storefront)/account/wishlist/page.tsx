'use client';

import { useState, useEffect } from 'react';
import { Trash2, ShoppingCart, Loader2, Heart } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { useCartStore } from '@/store/useCartStore';

export default function AccountWishlistPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { addItem, setIsOpen } = useCartStore();

  useEffect(() => {
    fetchWishlist();
  }, []);

  async function fetchWishlist() {
    setLoading(true);
    try {
      const res = await fetch('/api/storefront/wishlist');
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove(productId: string) {
    const res = await fetch(`/api/storefront/wishlist?product_id=${productId}`, { method: 'DELETE' });
    if (res.ok) {
      setItems(items.filter(item => item.product_id !== productId));
    }
  }

  const handleAddToCart = (item: any) => {
    const product = item.product;
    const variant = product?.product_variants?.[0];
    if (!variant) return;

    const imagePublicId = variant.image_public_ids?.[0] || product?.product_images?.[0]?.cloudinary_public_id || '';

    addItem({
      id: variant.id,
      productId: product.id,
      name: product.name,
      price: variant.price,
      compareAtPrice: variant.mrp ?? null,
      image: imagePublicId,
      quantity: 1,
      color: variant.color,
      size: variant.size,
      slug: product.slug,
      publicId: imagePublicId,
    });
    setIsOpen(true);
  };

  const getImageUrl = (product: any) => {
    const variant = product?.product_variants?.[0];
    const publicId = variant?.image_public_ids?.[0] || product?.product_images?.[0]?.cloudinary_public_id;
    if (!publicId) return null;
    return `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/w_400,h_533,c_fill/${publicId}`;
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {items.map((item) => {
            const product = item.product;
            if (!product) return null;
            const variant = product.product_variants?.[0];
            const discount = variant?.mrp && variant?.price ? Math.round(((variant.mrp - variant.price) / variant.mrp) * 100) : 0;
            const imgUrl = getImageUrl(product);

            return (
              <div key={item.wishlist_id} className="group relative flex flex-col gap-4">
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
                      <div className="w-full h-full flex items-center justify-center text-sage/40"><Heart className="w-8 h-8" /></div>
                    )}
                  </Link>
                  
                  <button 
                    onClick={() => handleRemove(item.product_id)}
                    className="absolute top-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur-sm text-destructive hover:bg-destructive hover:text-white transition-all z-10 shadow-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  
                  <div className="absolute bottom-4 left-4 right-4 translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                    <Button 
                      onClick={() => handleAddToCart(item)}
                      className="w-full bg-teal hover:bg-teal/90 text-cream text-[10px] uppercase tracking-widest font-bold h-12 rounded-none gap-2 shadow-xl border-none"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" /> Move to Cart
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
                    <span className="font-bold text-charcoal">₹{variant?.price?.toLocaleString() ?? '—'}</span>
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
