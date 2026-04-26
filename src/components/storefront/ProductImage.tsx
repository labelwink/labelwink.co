"use client"

import { CldImage } from 'next-cloudinary'
import Image from 'next/image'

interface Props {
  publicId: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  sizes?: string
  quality?: number | 'auto:best'
}

export function ProductImage({ publicId, alt, width, height, className, priority, sizes, quality = 'auto:best' }: Props) {
  // Check if it's a full URL instead of a Cloudinary Public ID
  const isFullUrl = publicId.startsWith('http')

  if (isFullUrl) {
    if (!width || !height) {
      return (
        <div className="relative w-full h-full">
          <Image
            src={publicId}
            alt={alt}
            fill
            sizes={sizes || '100vw'}
            priority={priority}
            style={{ objectFit: 'cover', objectPosition: 'center top' }}
            className={className}
          />
        </div>
      )
    }
    return (
      <Image
        src={publicId}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        className={className}
      />
    )
  }

  return (
    <CldImage
      src={publicId}
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority={priority}
      sizes={sizes || "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"}
      format="auto"
      quality={quality as any}
      loading={priority ? 'eager' : 'lazy'}
    />
  )
}
