'use client'

import { useState } from 'react'
import { ProductImageZoom } from '@/components/storefront/ProductImageZoom'

interface Props {
  images: Array<{ cloudinary_public_id: string }>
  cloudName: string
}

function buildUrl(publicId: string, cloudName: string) {
  return `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto:best/${publicId}`
}

export function ProductImageGallery({ images, cloudName }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0)

  if (!images || images.length === 0) {
    return (
      <div className="w-full aspect-[3/4] bg-[#f5f0e8] flex items-center justify-center rounded-2xl">
        <div className="text-center text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm font-medium">No image available</p>
        </div>
      </div>
    )
  }

  const urls = images.map(img => buildUrl(img.cloudinary_public_id, cloudName))

  return (
    <ProductImageZoom
      images={urls}
      currentIndex={currentIndex}
      onIndexChange={setCurrentIndex}
    />
  )
}
