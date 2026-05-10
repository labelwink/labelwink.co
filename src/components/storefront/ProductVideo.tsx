'use client'

interface Props {
  publicId: string
  posterPublicId?: string // auto-generated thumbnail
}

export function ProductVideo({ publicId, posterPublicId }: Props) {
  const videoSrc = publicId.startsWith('http')
    ? publicId
    : `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/video/upload/f_auto,q_auto/${publicId}`

  const posterSrc = posterPublicId
    ? `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/video/upload/so_0,w_400,f_jpg/${posterPublicId}`
    : undefined

  return (
    <div className="relative aspect-[9/16] rounded-lg overflow-hidden bg-sage/10">
      <video
        src={videoSrc}
        width={400}
        height={711}
        controls
        className="w-full h-full object-cover"
        poster={posterSrc}
      />
      <div className="absolute top-2 right-2 bg-charcoal/50 text-white text-[10px] uppercase tracking-widest px-2 py-1 rounded-full backdrop-blur-sm">
        🎬 See it in action
      </div>
    </div>
  )
}
