'use client'
import { CldUploadWidget } from 'next-cloudinary'
import { useState } from 'react'
import { ImagePlus, X } from 'lucide-react'

interface Props {
  onUpload: (publicId: string, secureUrl: string) => void
  folder?: string
}

export function CloudinaryImageUploader({ onUpload, folder = 'labelwink/products' }: Props) {
  const [uploaded, setUploaded] = useState<string[]>([])

  return (
    <CldUploadWidget
      uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
      options={{
        folder,
        multiple: true,
        maxFiles: 8,
        resourceType: 'image',
        clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
        maxFileSize: 5000000, // 5MB
      }}
      onSuccess={(result) => {
        if (typeof result.info === 'object' && 'public_id' in result.info) {
          const { public_id, secure_url } = result.info as any
          setUploaded(prev => [...prev, secure_url])
          onUpload(public_id, secure_url)
        }
      }}
    >
      {({ open }) => (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => open()}
            className="border-2 border-dashed border-sage/30 rounded-lg p-10 w-full hover:border-teal hover:bg-sage/5 transition-all group flex flex-col items-center justify-center text-center"
          >
            <div className="bg-sage/10 p-3 rounded-full group-hover:bg-teal/10 transition-colors mb-3">
              <ImagePlus className="w-6 h-6 text-muted-foreground group-hover:text-teal" />
            </div>
            <span className="text-charcoal font-medium">Click to upload product images</span>
            <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WebP — up to 5MB each, max 8 images</p>
          </button>
          
          {/* Preview uploaded images */}
          {uploaded.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
              {uploaded.map((url, i) => (
                <div key={i} className="relative aspect-square rounded-md overflow-hidden border border-sage/20 group">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button 
                    type="button"
                    onClick={() => setUploaded(prev => prev.filter((_, idx) => idx !== i))}
                    className="absolute top-1 right-1 bg-white/80 backdrop-blur-sm p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </CldUploadWidget>
  )
}
