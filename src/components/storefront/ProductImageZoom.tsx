'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'

interface ProductImageZoomProps {
  images: string[]
  currentIndex: number
  onIndexChange: (i: number) => void
}

export function ProductImageZoom({ images, currentIndex, onIndexChange }: ProductImageZoomProps) {
  const [showZoom, setShowZoom] = useState(false)
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 })
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef<number>(0)

  // Required for createPortal (SSR safety)
  useEffect(() => {
    setMounted(true)
  }, [])

  // Lock body scroll when lightbox is open
  useEffect(() => {
    if (lightboxOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [lightboxOpen])

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

  // The lightbox rendered via portal so it escapes any parent
  // CSS transform / filter / will-change that would trap position:fixed
  const lightbox = lightboxOpen ? (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        background: 'rgba(0,0,0,0.92)',
        display: 'flex',
        flexDirection: 'column',
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {/* Top bar: counter + close */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        flexShrink: 0,
      }}>
        <div style={{
          color: 'white',
          fontSize: '14px',
          background: 'rgba(0,0,0,0.4)',
          padding: '4px 12px',
          borderRadius: '999px',
        }}>
          {currentIndex + 1} / {images.length}
        </div>
        <button
          onClick={() => setLightboxOpen(false)}
          style={{
            color: 'white',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '50%',
            border: 'none',
            cursor: 'pointer',
            fontSize: '20px',
          }}
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      {/* Image area: flex-1 takes the remaining height */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 56px',
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={currentImage}
          alt="Product full view"
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            display: 'block',
          }}
        />
      </div>

      {/* Prev arrow */}
      {currentIndex > 0 && (
        <button
          onClick={() => onIndexChange(currentIndex - 1)}
          style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'white',
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            cursor: 'pointer',
          }}
          aria-label="Previous"
        >
          ‹
        </button>
      )}

      {/* Next arrow */}
      {currentIndex < images.length - 1 && (
        <button
          onClick={() => onIndexChange(currentIndex + 1)}
          style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'white',
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            cursor: 'pointer',
          }}
          aria-label="Next"
        >
          ›
        </button>
      )}
    </div>
  ) : null

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
            <div className="relative w-full h-full">
              <Image
                src={currentImage}
                alt="Product"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            </div>
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
            <div className="relative w-full h-full">
              <Image
                src={currentImage}
                alt="Product"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            </div>
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
            <div className="relative w-full h-full">
              <Image
                src={img}
                alt={`Thumbnail ${i + 1}`}
                fill
                sizes="64px"
                className="object-cover"
              />
            </div>
          </button>
        ))}
      </div>

      {/* Lightbox rendered via portal directly into document.body
          This escapes any parent CSS transform/filter/will-change
          that would break position:fixed on mobile */}
      {mounted && createPortal(lightbox, document.body)}
    </>
  )
}
