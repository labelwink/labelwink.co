'use client'
import { CldUploadWidget } from 'next-cloudinary'
import { Video, Film } from 'lucide-react'

interface Props {
  onUpload: (publicId: string) => void
}

export function CloudinaryVideoUploader({ onUpload }: Props) {
  return (
    <CldUploadWidget
      uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
      options={{
        folder: 'labelwink/videos',
        resourceType: 'video',
        clientAllowedFormats: ['mp4', 'mov', 'webm'],
        maxFileSize: 100000000, // 100MB
      }}
      onSuccess={(result) => {
        if (typeof result.info === 'object' && 'public_id' in result.info) {
          onUpload((result.info as any).public_id)
        }
      }}
    >
      {({ open }) => (
        <button
          type="button"
          onClick={() => open()}
          className="flex items-center gap-2 border border-sage/30 rounded-lg px-6 py-3 bg-white hover:border-teal hover:bg-sage/5 transition-all text-charcoal font-medium shadow-sm"
        >
          <Film className="w-5 h-5 text-teal" />
          <span>Upload Product Reel (Instagram Video)</span>
        </button>
      )}
    </CldUploadWidget>
  )
}
