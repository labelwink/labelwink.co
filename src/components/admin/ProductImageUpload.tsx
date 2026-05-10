'use client'

import { useState, useRef } from 'react'
import { Upload, X, Star, Loader2 } from 'lucide-react'
import Image from 'next/image'

interface Props {
  images: string[]
  onChange: (imgs: string[]) => void
}

const MAX_IMAGES = 8
const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'labelwink_products'

export default function ProductImageUpload({ images, onChange }: Props) {
  const [uploading, setUploading] = useState(false)
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const upload = async (file: File) => {
    if (!CLOUD_NAME) {
      console.error('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is not set')
      return null
    }
    const fd = new FormData()
    fd.append('file', file)
    fd.append('upload_preset', UPLOAD_PRESET)
    fd.append('folder', 'labelwink/products')

    const res  = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: fd,
    })
    if (!res.ok) throw new Error('Upload failed')
    const data = await res.json()
    return data.secure_url as string
  }

  const handleFiles = async (files: FileList | null) => {
    if (!files || images.length >= MAX_IMAGES) return
    setUploading(true)
    try {
      const remaining = MAX_IMAGES - images.length
      const toUpload  = Array.from(files).slice(0, remaining)
      const urls = await Promise.all(toUpload.map(upload))
      const valid = urls.filter(Boolean) as string[]
      onChange([...images, ...valid])
    } catch (e) {
      console.error('Upload error:', e)
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const remove = (idx: number) => {
    onChange(images.filter((_, i) => i !== idx))
  }

  const setPrimary = (idx: number) => {
    if (idx === 0) return
    const next = [...images]
    const [moved] = next.splice(idx, 1)
    next.unshift(moved)
    onChange(next)
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {images.map((url, idx) => (
          <div
            key={url + idx}
            className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200 group"
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
          >
            <Image src={url} alt={`Product image ${idx + 1}`} fill className="object-cover" sizes="96px" />

            {/* Primary badge */}
            {idx === 0 && (
              <div className="absolute top-1 left-1 bg-[#1C3829] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md z-10">
                Primary
              </div>
            )}

            {/* Hover overlay */}
            {hoveredIdx === idx && (
              <div className="absolute inset-0 bg-black/55 flex flex-col items-center justify-center gap-1.5 z-20">
                {idx !== 0 && (
                  <button
                    type="button"
                    onClick={() => setPrimary(idx)}
                    className="flex items-center gap-1 text-[10px] font-semibold text-white bg-[#1C3829] px-2 py-1 rounded-lg hover:bg-[#24472F] transition-colors"
                  >
                    <Star size={10} /> Set Primary
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => remove(idx)}
                  className="flex items-center gap-1 text-[10px] font-semibold text-white bg-red-600 px-2 py-1 rounded-lg hover:bg-red-700 transition-colors"
                >
                  <X size={10} /> Remove
                </button>
              </div>
            )}
          </div>
        ))}

        {/* Upload tile */}
        {images.length < MAX_IMAGES && (
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 hover:border-[#1C3829] flex flex-col items-center justify-center gap-1.5 text-gray-400 hover:text-[#1C3829] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <>
                <Upload size={18} />
                <span className="text-[10px] font-semibold">Upload</span>
              </>
            )}
          </button>
        )}
      </div>

      <p className="text-xs text-gray-400">
        {images.length}/{MAX_IMAGES} images · First image is used as primary · Drag to reorder
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={e => handleFiles(e.target.files)}
      />
    </div>
  )
}
