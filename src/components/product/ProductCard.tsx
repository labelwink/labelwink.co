'use client';

import Link from 'next/link';
import { ProductImage } from '@/components/storefront/ProductImage';
import { WishlistButton } from '@/components/storefront/WishlistButton';

export interface ProductCardProps {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  compareAtPrice: number | null;
  image: string; // Keep for backward compatibility with mock
  hoverImage?: string;
  publicId?: string; // New Cloudinary Field
  hoverPublicId?: string; // New Cloudinary Field
  isNewArrival?: boolean;
  colors?: string[];
  totalStock?: number; // 0 = out of stock
}

export function ProductCard({
  id,
  name,
  slug,
  basePrice,
  compareAtPrice,
  image,
  hoverImage,
  publicId,
  hoverPublicId,
  isNewArrival,
  colors = [],
  totalStock,
}: ProductCardProps) {
  const discount = compareAtPrice ? Math.round(((compareAtPrice - basePrice) / compareAtPrice) * 100) : 0;
  const isOutOfStock = totalStock !== undefined && totalStock === 0;

  return (
    <div className="group relative flex flex-col gap-3">
      {/* Image Container */}
      <div className="relative aspect-[3/4] overflow-hidden rounded-sm bg-sage/10">
        <Link href={`/products/${slug}`} className="absolute inset-0 block z-0">
          {publicId ? (
            <ProductImage 
              publicId={publicId} 
              alt={name} 
              width={400} 
              height={500} 
              className={`w-full h-full object-cover transition-opacity duration-500 ${(hoverPublicId || hoverImage) ? 'group-hover:opacity-0' : ''}`}
              sizes="(max-width: 768px) 50vw, 25vw"
            />
          ) : (
            <div 
              className={`absolute inset-0 bg-cover bg-center transition-opacity duration-500 ease-in-out ${(hoverPublicId || hoverImage) ? 'group-hover:opacity-0' : ''}`}
              style={{ backgroundImage: `url(${image})` }}
            />
          )}

          {hoverPublicId ? (
            <ProductImage 
              publicId={hoverPublicId} 
              alt={name} 
              width={400} 
              height={500} 
              className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              sizes="(max-width: 768px) 50vw, 25vw"
            />
          ) : hoverImage ? (
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-0 transition-opacity duration-500 ease-in-out group-hover:opacity-100"
              style={{ backgroundImage: `url(${hoverImage})` }}
            />
          ) : null}
        </Link>
        
        {/* Out of Stock overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center pointer-events-none">
            <span className="bg-gray-800 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5">
              Out of Stock
            </span>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-20">
          {isNewArrival && (
            <span className="bg-cream text-charcoal text-[10px] uppercase tracking-wider px-2 py-1 font-semibold">
              New
            </span>
          )}
          {discount > 0 && !isOutOfStock && (
            <span className="bg-green-100 text-green-800 text-[10px] uppercase tracking-wider px-2 py-1 font-semibold">
              {discount}% OFF
            </span>
          )}
        </div>

        {/* Wishlist Button — top-right */}
        <div className="absolute top-2 right-2 z-20">
          <WishlistButton
            productId={id}
            className="p-1.5 rounded-full bg-cream/50 backdrop-blur-sm text-charcoal hover:bg-cream transition-colors disabled:opacity-50"
          />
        </div>

        {/* Quick Add — always visible on mobile, hover-only on desktop */}
        <div className={`absolute bottom-0 left-0 right-0 z-20 transition-all duration-300 md:translate-y-full md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100`}>
          <Link
            href={`/products/${slug}`}
            className={`flex items-center justify-center w-full h-10 md:h-12 text-btn text-xs ${isOutOfStock ? 'bg-gray-300 text-gray-500 cursor-not-allowed pointer-events-none' : 'bg-[#1a3a34]/90 hover:bg-[#1a3a34] text-white'}`}
          >
            {isOutOfStock ? 'Out of Stock' : 'View Product'}
          </Link>
        </div>
      </div>

      {/* Details */}
      <div className="flex flex-col gap-1">
        {colors.length > 0 && (
          <div className="flex gap-1 mb-1">
            {colors.map((color, i) => (
              <div 
                key={i} 
                className="w-3 h-3 rounded-full border border-sage"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        )}
        <Link href={`/products/${slug}`} className="text-product-name line-clamp-2 hover:text-teal transition-colors">
          {name}
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-price text-lg font-bold text-[#1a1a1a]">₹{basePrice.toLocaleString('en-IN')}</span>
          {compareAtPrice && compareAtPrice > basePrice && (
            <>
              <span className="text-sm text-gray-400 line-through">MRP: ₹{compareAtPrice.toLocaleString('en-IN')}</span>
              <span className="text-[10px] font-bold text-green-800 bg-green-100 px-1.5 py-0.5 rounded">
                {discount}% OFF
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
