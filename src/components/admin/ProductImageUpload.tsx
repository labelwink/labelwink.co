'use client'

import { useState, useRef } from 'react'
import { Upload, X, Star, Loader2, AlertCircle } from 'lucide-react'
import Image from 'next/image'

interface Props {
  images: string[]
  onChange: (imgs: string[]) => void
}

const MAX_IMAGES = 8
const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? 'labelwink_unsigned'

export default function ProductImageUpload({ images, onChange }: Props) {
  const [uploading, setUploading] = useState(false)
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const upload = async (file: File): Promise<string | null> => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

    console.log('Cloudinary Upload Attempt:', { 
      cloudName, 
      uploadPreset,
      url: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`
    })

    // Pre-flight check
    if (!cloudName || !uploadPreset) {
      throw new Error('Cloudinary CLOUD_NAME or UPLOAD_PRESET not configured in .env.local')
    }

    const fd = new FormData()
    fd.append('file', file)
    fd.append('upload_preset', uploadPreset)
    fd.append('folder', 'labelwink/products')

    const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`
    
    try {
      const res = await fetch(url, {
        method: 'POST',
        body: fd,
      })
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        console.error('Cloudinary Error Response:', errorData)
        throw new Error(errorData.error?.message || `Upload failed: ${res.statusText}`)
      }
      
      const data = await res.json()
      return data.secure_url as string
    } catch (err) {
      console.error('Fetch error during Cloudinary upload:', err)
      throw err
    }
  }

  const handleFiles = async (files: FileList | null) => {
    if (!files || images.length >= MAX_IMAGES) return
    setUploading(true)
    setUploadError(null)
    try {
      const remaining = MAX_IMAGES - images.length
      const toUpload = Array.from(files).slice(0, remaining)
      const urls = await Promise.all(toUpload.map(upload))
      const valid = urls.filter(Boolean) as string[]
      onChange([...images, ...valid])
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed'
      console.error('[Cloudinary Upload]', msg)
      setUploadError(
        msg.includes('CLOUD_NAME') || msg.includes('UPLOAD_PRESET')
          ? 'Image upload not configured. Contact support.'
          : 'Upload failed. Check your internet connection and try again.'
      )
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const remove = (idx: number) => onChange(images.filter((_, i) => i !== idx))

  const setPrimary = (idx: number) => {
    if (idx === 0) return
    const next = [...images]
    const [moved] = next.splice(idx, 1)
    next.unshift(moved)
    onChange(next)
  }

  return (
    <div className="space-y-3">
      {/* Drop zone when no images yet */}
      {images.length === 0 && (
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="w-full border-2 border-dashed border-[#E8DFC8] rounded-2xl p-10 text-center cursor-pointer hover:border-[#1C3829] hover:bg-[#FAF5E9] transition-all disabled:opacity-50"
        >
          <div className="text-4xl mb-3">📸</div>
          <p className="text-sm font-medium text-gray-700">Drop images here or click to upload</p>
          <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB each · First image is cover</p>
        </button>
      )}

      {/* Thumbnail grid */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {images.map((url, idx) => (
            <div
              key={url + idx}
              className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200 group"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <Image src={url} alt={`Product image ${idx + 1}`} fill className="object-cover" sizes="96px" />
              {idx === 0 && (
                <div className="absolute top-1 left-1 bg-[#1C3829] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md z-10">
                  Primary
                </div>
              )}
              {hoveredIdx === idx && (
                <div className="absolute inset-0 bg-black/55 flex flex-col items-center justify-center gap-1.5 z-20">
                  {idx !== 0 && (
                    <button type="button" onClick={() => setPrimary(idx)}
                      className="flex items-center gap-1 text-[10px] font-semibold text-white bg-[#1C3829] px-2 py-1 rounded-lg hover:bg-[#24472F] transition-colors">
                      <Star size={10} /> Set Primary
                    </button>
                  )}
                  <button type="button" onClick={() => remove(idx)}
                    className="flex items-center gap-1 text-[10px] font-semibold text-white bg-red-600 px-2 py-1 rounded-lg hover:bg-red-700 transition-colors">
                    <X size={10} /> Remove
                  </button>
                </div>
              )}
            </div>
          ))}

          {/* Add more tile */}
          {images.length < MAX_IMAGES && (
            <button type="button" disabled={uploading} onClick={() => inputRef.current?.click()}
              className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 hover:border-[#1C3829] flex flex-col items-center justify-center gap-1.5 text-gray-400 hover:text-[#1C3829] transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
              {uploading ? <Loader2 size={20} className="animate-spin" /> : <><Upload size={18} /><span className="text-[10px] font-semibold">Upload</span></>}
            </button>
          )}
        </div>
      )}

      {uploadError && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <AlertCircle size={14} className="flex-shrink-0" />
          <p className="text-xs">{uploadError}</p>
        </div>
      )}

      <p className="text-xs text-gray-400">
        {images.length}/{MAX_IMAGES} images · First image is used as primary
      </p>

      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden"
        onChange={e => handleFiles(e.target.files)} />
    </div>
  )
}

