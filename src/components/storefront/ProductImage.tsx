"use client"

import { CldImage } from 'next-cloudinary'
import Image from 'next/image'

interface Props {
  publicId: string
  alt: string
  width: number
  height: number
  className?: string
  priority?: boolean
  sizes?: string
  quality?: number | 'auto:best'
}

export function ProductImage({ publicId, alt, width, height, className, priority, sizes, quality = 'auto:best' }: Props) {
  // Check if it's a full URL instead of a Cloudinary Public ID
  const isFullUrl = publicId.startsWith('http')

  if (isFullUrl) {
    return (
      <Image
        src={publicId}
        alt={alt}
        width={width}
        height={height}
        className={className}
        priority={priority}
        quality={typeof quality === 'number' ? quality : 100}
        sizes={sizes || "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"}
        loading={priority ? 'eager' : 'lazy'}
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
