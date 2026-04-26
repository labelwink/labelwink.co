'use client'

import { useState, useRef, useCallback } from 'react'

interface ProductImageZoomProps {
  images: string[]
  currentIndex: number
  onIndexChange: (i: number) => void
}

export function ProductImageZoom({ images, currentIndex, onIndexChange }: ProductImageZoomProps) {
  const [showZoom, setShowZoom] = useState(false)
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 })
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef<number>(0)

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setZoomPos({ x, y })
  }, [])

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    const delta = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(delta) > 50) {
      if (delta < 0) onIndexChange(Math.min(images.length - 1, currentIndex + 1))
      else onIndexChange(Math.max(0, currentIndex - 1))
    }
  }

  const currentImage = images[currentIndex] || ''

  return (
    <>
      {/* Main image + zoom panel */}
      <div className="relative w-full">
        {/* Desktop: hover zoom */}
        <div
          ref={containerRef}
          className="hidden md:block relative overflow-hidden cursor-crosshair rounded-2xl bg-gray-100 aspect-[3/4]"
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setShowZoom(true)}
          onMouseLeave={() => setShowZoom(false)}
        >
          {currentImage && (
            <img
              src={currentImage}
              alt="Product"
              className="w-full h-full object-cover"
            />
          )}

          {/* Zoom panel */}
          {showZoom && currentImage && (
            <div
              className="absolute top-0 right-[-500px] w-[480px] h-[560px] rounded-xl shadow-xl border border-gray-200 bg-white z-50 pointer-events-none"
              style={{
                backgroundImage: `url(${currentImage})`,
                backgroundSize: '250%',
                backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
                backgroundRepeat: 'no-repeat',
              }}
            />
          )}
        </div>

        {/* Mobile: tap to open lightbox */}
        <button
          className="md:hidden w-full block rounded-2xl overflow-hidden bg-gray-100 aspect-[3/4]"
          onClick={() => setLightboxOpen(true)}
          aria-label="View full image"
        >
          {currentImage && (
            <img
              src={currentImage}
              alt="Product"
              className="w-full h-full object-cover"
            />
          )}
        </button>
      </div>

      {/* Thumbnails */}
      <div className="flex gap-2 mt-3 overflow-x-auto pb-2 scrollbar-hide">
        {images.map((img, i) => (
          <button
            key={i}
            onClick={() => onIndexChange(i)}
            className={`flex-shrink-0 w-16 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
              i === currentIndex ? 'border-[#1b3a34]' : 'border-transparent hover:border-gray-300'
            }`}
          >
            <img src={img} alt={`Thumbnail ${i + 1}`} className="w-full h-full object-cover" />
          </button>
        ))}
      </div>

      {/* Mobile Lightbox */}
      {lightboxOpen && (
        <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center">
          {/* Counter */}
          <div className="fixed top-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black/40 px-3 py-1 rounded-full">
            {currentIndex + 1} / {images.length}
          </div>

          {/* Close */}
          <button
            onClick={() => setLightboxOpen(false)}
            className="fixed top-4 right-4 text-white w-10 h-10 flex items-center justify-center bg-white/20 rounded-full text-xl"
            aria-label="Close"
          >
            ✕
          </button>

          {/* Image */}
          <div
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className="max-w-[90vw] max-h-[80vh]"
          >
            <img
              src={currentImage}
              alt="Product full view"
              className="max-w-[90vw] max-h-[80vh] object-contain"
            />
          </div>

          {/* Prev */}
          {currentIndex > 0 && (
            <button
              onClick={() => onIndexChange(currentIndex - 1)}
              className="fixed left-3 top-1/2 -translate-y-1/2 text-white bg-white/20 rounded-full w-10 h-10 flex items-center justify-center text-lg"
              aria-label="Previous"
            >
              ‹
            </button>
          )}

          {/* Next */}
          {currentIndex < images.length - 1 && (
            <button
              onClick={() => onIndexChange(currentIndex + 1)}
              className="fixed right-3 top-1/2 -translate-y-1/2 text-white bg-white/20 rounded-full w-10 h-10 flex items-center justify-center text-lg"
              aria-label="Next"
            >
              ›
            </button>
          )}
        </div>
      )}
    </>
  )
}
