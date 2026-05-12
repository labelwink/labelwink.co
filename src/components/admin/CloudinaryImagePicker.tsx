'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? 'labelwink_unsigned'

type Props = {
  value:       string
  onChange:    (url: string) => void
  label?:      string
  folder?:     string
  placeholder?: string
}

export function CloudinaryImagePicker({
  value,
  onChange,
  label     = 'Image',
  folder    = 'labelwink/banners',
  placeholder = 'Click to upload or paste URL',
}: Props) {
  const inputRef  = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError]         = useState<string | null>(null)

  const upload = async (file: File) => {
    if (!CLOUD_NAME) {
      setError('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME not set')
      return
    }
    setUploading(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append('file',           file)
      fd.append('upload_preset',  UPLOAD_PRESET)
      fd.append('folder',         folder)

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        { method: 'POST', body: fd }
      )
      if (!res.ok) throw new Error(`Upload failed: ${res.status}`)
      const data = await res.json()
      onChange(data.secure_url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      {/* Preview */}
      {value && (
        <div className="relative w-full h-32 rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
          <Image
            src={value}
            alt="Preview"
            fill
            className="object-cover"
          />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
          >
            ✕
          </button>
        </div>
      )}

      {/* Upload area */}
      <div
        onClick={() => inputRef.current?.click()}
        className="flex items-center gap-2 w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-white cursor-pointer hover:border-[#1C3829] hover:bg-[#FAF9F6] transition-all group"
      >
        <span className="text-gray-400 group-hover:text-[#1C3829] transition-colors">
          {uploading ? '⏳' : '📁'}
        </span>
        <span className="text-sm text-gray-500 flex-1 truncate group-hover:text-gray-700">
          {uploading ? 'Uploading...' : value ? 'Change image' : placeholder}
        </span>
        {!uploading && (
          <span className="text-xs text-[#1C3829] font-medium border border-[#1C3829] px-2 py-0.5 rounded-lg">
            Browse
          </span>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0]
          if (file) upload(file)
          e.target.value = ''
        }}
      />

      {/* Manual URL input */}
      <input
        type="url"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Or paste image URL directly"
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1C3829] focus:border-transparent"
      />

      {error && (
        <p className="text-red-500 text-xs">
          ⚠ {error}
        </p>
      )}
    </div>
  )
}
