'use client';

import Link from 'next/link';
import Image from 'next/image';
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
  const imageSrc = image || '/placeholder-product.jpg';

  return (
    <div className="group relative flex flex-col bg-labelwink-cream-card border border-labelwink-cream-border rounded-none overflow-hidden hover:shadow-xl hover:shadow-labelwink-green/5 transition-all duration-300">
      {/* Image Container */}
      <div className="relative aspect-[3/4] overflow-hidden bg-labelwink-cream">
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
            <Image 
              src={imageSrc}
              alt={name}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className={`object-cover transition-opacity duration-500 ease-in-out ${(hoverPublicId || hoverImage) ? 'group-hover:opacity-0' : ''}`}
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
            <Image 
              src={hoverImage}
              alt={name}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover opacity-0 transition-opacity duration-500 ease-in-out group-hover:opacity-100"
            />
          ) : null}
        </Link>
        
        {/* Out of Stock overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center pointer-events-none">
            <span className="bg-[#1B3A2D] text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5">
              Out of Stock
            </span>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-20">
          {isNewArrival && (
            <span className="bg-labelwink-gold/20 text-labelwink-green text-[10px] font-bold px-2 py-0.5 rounded-none uppercase tracking-widest border border-labelwink-gold/10 backdrop-blur-sm">
              New
            </span>
          )}
          {discount > 0 && !isOutOfStock && (
            <span className="bg-red-50 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-none uppercase tracking-widest border border-red-100 backdrop-blur-sm">
              {discount}% OFF
            </span>
          )}
        </div>

        {/* Wishlist Button — top-right */}
        <div className="absolute top-2 right-2 z-20">
          <WishlistButton
            productId={id}
            className="p-2 rounded-full bg-white/80 backdrop-blur-md text-labelwink-muted hover:text-labelwink-gold hover:bg-white transition-all duration-300 shadow-sm border border-labelwink-cream-border/20 disabled:opacity-50"
          />
        </div>
      </div>

      {/* Details */}
      <div className="flex flex-col gap-2 p-4">
        {colors.length > 0 && (
          <div className="flex gap-1 mb-1">
            {colors.map((color, i) => (
              <div 
                key={i} 
                className="w-3.5 h-3.5 rounded-full border border-labelwink-cream-border shadow-sm"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        )}
        <Link href={`/products/${slug}`} className="text-labelwink-green font-semibold text-sm line-clamp-2 hover:text-labelwink-gold transition-colors duration-200">
          {name}
        </Link>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[#1C3829] font-bold text-lg">₹{basePrice.toLocaleString('en-IN')}</span>
          {compareAtPrice && compareAtPrice > basePrice && (
            <>
              <span className="text-[#6B6B5A] line-through text-sm">MRP: ₹{compareAtPrice.toLocaleString('en-IN')}</span>
              <span className="bg-[#c9a84c]/20 text-[#1C3829] text-[10px] font-semibold px-1.5 py-0.5 rounded">
                {discount}% OFF
              </span>
            </>
          )}
        </div>
        
        {/* Action Button */}
        <div className="mt-1">
          <Link
            href={`/products/${slug}`}
            className={`flex items-center justify-center w-full bg-labelwink-green text-white hover:bg-labelwink-green-hover text-xs font-bold uppercase tracking-[0.2em] py-3.5 rounded-none transition-all duration-300 shadow-lg shadow-labelwink-green/10 ${isOutOfStock ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'active:scale-[0.98]'}`}
          >
            {isOutOfStock ? 'Out of Stock' : 'View Product'}
          </Link>
        </div>
      </div>
    </div>
  );
}
