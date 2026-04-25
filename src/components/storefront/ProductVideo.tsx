'use client'
import { CldVideoPlayer } from 'next-cloudinary'
import 'next-cloudinary/dist/cld-video-player.css'

interface Props {
  publicId: string
  posterPublicId?: string // auto-generated thumbnail
}

export function ProductVideo({ publicId, posterPublicId }: Props) {
  return (
    <div className="relative aspect-[9/16] rounded-lg overflow-hidden bg-sage/10">
      <CldVideoPlayer
        id={`product-video-${publicId.replace('/', '-')}`}
        src={publicId}
        width={400}
        height={711} // 9:16 for Reels
        autoPlay={false}
        muted={false}
        loop={false}
        controls={true}
        // Show poster from Cloudinary (auto-generated from first frame)
        poster={posterPublicId 
          ? `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/video/upload/so_0,w_400,f_jpg/${posterPublicId}`
          : undefined
        }
        className="w-full h-full object-cover"
      />
      <div className="absolute top-2 right-2 bg-charcoal/50 text-white text-[10px] uppercase tracking-widest px-2 py-1 rounded-full backdrop-blur-sm">
        🎬 See it in action
      </div>
    </div>
  )
}
