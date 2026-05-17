"use client"

import Image from 'next/image'
import { getProductImageUrl } from '@/lib/utils/cloudinary'

interface Props {
  publicId: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  sizes?: string
}

export function ProductImage({ publicId, alt, width, height, className, priority, sizes, size = 'card' }: Props & { size?: 'thumb' | 'card' | 'full' }) {
  const src = getProductImageUrl(publicId, size)

  if (!width || !height) {
    return (
      <div className="relative w-full h-full">
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes || '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'}
          priority={priority}
          onError={(event) => {
            const target = event.currentTarget as HTMLImageElement
            target.src = '/placeholder-product.jpg'
            target.alt = alt ? `${alt} - image currently unavailable` : 'Product image unavailable' // ✅ AUDIT FIX #10
          }}
          style={{ objectFit: 'cover', objectPosition: 'center top' }}
          className={className}
        />
      </div>
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      onError={(event) => {
        const target = event.currentTarget as HTMLImageElement
        target.src = '/placeholder-product.jpg'
        target.alt = alt ? `${alt} - image currently unavailable` : 'Product image unavailable' // ✅ AUDIT FIX #10
      }}
      className={className}
    />
  )
}
