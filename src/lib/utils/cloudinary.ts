// src/lib/utils/cloudinary.ts
// CLIENT-SAFE: pure URL helpers — no SDK, no fs

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME

// ── Raw ID extractor ───────────────────────────────────────────────────────
export function toCloudinaryId(urlOrId: string): string {
  if (!urlOrId) return ''
  if (!urlOrId.includes('cloudinary.com')) return urlOrId
  const parts = urlOrId.split('/upload/')
  const id = parts[1]?.replace(/^v\d+\//, '') ?? urlOrId
  // Remove file extension if present
  return id.replace(/\.(jpg|jpeg|png|webp|gif|avif|HEIC)$/i, '')
}

// ── Master Optimizer ────────────────────────────────────────────────────────
/**
 * Ensures any Cloudinary URL or ID is optimized with highest quality.
 * Default: f_auto (format), q_auto:best (quality), dpr_auto (high-density)
 */
export function cloudinaryOptimize(
  urlOrId: string, 
  transforms: string = 'f_auto,q_auto:best,dpr_auto'
): string {
  if (!urlOrId) return '/placeholder-product.jpg'
  if (urlOrId.startsWith('/') && !urlOrId.includes('cloudinary.com')) return urlOrId
  
  const id = toCloudinaryId(urlOrId)
  const cloud = CLOUD_NAME || 'dcmbwtreb'
  return `https://res.cloudinary.com/${cloud}/image/upload/${transforms}/${id}`
}

// ── Base URL builder ───────────────────────────────────────────────────────
export function cloudinaryUrl(
  publicId: string,
  transforms: string = 'f_auto,q_auto:best'
): string {
  if (!publicId) return '/placeholder-product.jpg'
  if (publicId.startsWith('/') && !publicId.includes('cloudinary.com')) return publicId
  
  if (!CLOUD_NAME) {
    console.warn('[Cloudinary] NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME not set')
    return '/placeholder-product.jpg'
  }
  const cleanId = toCloudinaryId(publicId)
  const base = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload`
  
  // If user passed specific transforms, we use them, otherwise we use the default optimized ones
  return `${base}/${transforms}/${cleanId}`
}

// ── Flexible builder ───────────────────────────────────────────────────────
export function getCloudinaryUrl(
  publicIdOrUrl: string,
  options: { width?: number; height?: number; quality?: string | number } = {}
): string {
  if (!publicIdOrUrl) return '/placeholder-product.jpg'
  if (publicIdOrUrl.startsWith('/') && !publicIdOrUrl.includes('cloudinary.com')) return publicIdOrUrl

  const { width, height, quality = 'auto:best' } = options
  const t: string[] = ['f_auto', `q_${quality}`]
  if (width) t.push(`w_${width}`)
  if (height) t.push(`h_${height}`, 'c_fill', 'g_auto')

  const publicId = toCloudinaryId(publicIdOrUrl)
  const cloud = CLOUD_NAME || 'dcmbwtreb'
  return `https://res.cloudinary.com/${cloud}/image/upload/${t.join(',')}/${publicId}`
}

// ── Size helpers ──────────────────────────────────────────────────────────
export function getProductImageUrl(
  image: string | undefined | null,
  size: 'thumb' | 'card' | 'full' = 'card'
): string {
  if (!image) return '/placeholder-product.jpg'
  const sizes = {
    thumb: { width: 400, height: 400 },
    card:  { width: 600, height: 750 },
    full:  { width: 1200, height: 1500 },
  }
  return getCloudinaryUrl(image, sizes[size])
}

// ── Named presets ─────────────────────────────────────────────────────────

/** Product image — portrait 4:5 ratio, optimized WebP/AVIF */
export const cloudinaryProduct = (publicId: string): string =>
  cloudinaryUrl(publicId, 'w_1000,h_1250,c_fill,q_auto:best,f_auto')

/** Thumbnail — square 400×400 */
export const cloudinaryThumb = (publicId: string): string =>
  cloudinaryUrl(publicId, 'w_400,h_400,c_fill,q_auto:best,f_auto')

/** Hero / banner — wide 1920px width for retina screens */
export const cloudinaryHero = (publicId: string): string =>
  cloudinaryUrl(publicId, 'w_1920,h_1080,c_fill,q_auto:best,f_auto')

/** Lookbook — editorial tall 1200×1600 */
export const cloudinaryLookbook = (publicId: string): string =>
  cloudinaryUrl(publicId, 'w_1200,h_1600,c_fill,q_auto:best,f_auto')

/** Avatar — small square with face gravity */
export const cloudinaryAvatar = (publicId: string): string =>
  cloudinaryUrl(publicId, 'w_300,h_300,c_fill,g_face,q_auto:best,f_auto')

