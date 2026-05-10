// src/lib/utils/cloudinary.ts
// CLIENT-SAFE: pure URL helpers — no SDK, no fs

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME

// ── Raw ID extractor ───────────────────────────────────────────────────────
export function toCloudinaryId(urlOrId: string): string {
  if (!urlOrId) return ''
  if (!urlOrId.includes('cloudinary.com')) return urlOrId
  const parts = urlOrId.split('/upload/')
  return parts[1]?.replace(/^v\d+\//, '') ?? urlOrId
}

// ── Base URL builder ───────────────────────────────────────────────────────
export function cloudinaryUrl(
  publicId: string,
  transforms: string = ''
): string {
  if (!publicId) return '/placeholder-product.jpg'
  if (publicId.startsWith('/')) return publicId
  if (!CLOUD_NAME) {
    console.warn('[Cloudinary] NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME not set')
    return '/placeholder-product.jpg'
  }
  const cleanId = toCloudinaryId(publicId)
  const base = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload`
  return transforms
    ? `${base}/${transforms}/${cleanId}`
    : `${base}/${cleanId}`
}

// ── Legacy flexible builder (used by ProductImage component) ───────────────
export function getCloudinaryUrl(
  publicIdOrUrl: string,
  options: { width?: number; height?: number; quality?: number } = {}
): string {
  if (!publicIdOrUrl) return '/placeholder-product.jpg'
  if (publicIdOrUrl.startsWith('/')) return publicIdOrUrl

  const { width, height, quality = 80 } = options
  const t: string[] = ['f_webp', `q_${quality}`]
  if (width) t.push(`w_${width}`)
  if (height) t.push(`h_${height}`, 'c_fill')

  const publicId = toCloudinaryId(publicIdOrUrl)
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${t.join(',')}/v1/${publicId}`
}

// ── Legacy size helper ────────────────────────────────────────────────────
export function getProductImageUrl(
  image: string | undefined | null,
  size: 'thumb' | 'card' | 'full' = 'card'
): string {
  if (!image) return '/placeholder-product.jpg'
  const sizes = {
    thumb: { width: 80,  height: 80  },
    card:  { width: 400, height: 500 },
    full:  { width: 800, height: 1000 },
  }
  return getCloudinaryUrl(image, sizes[size])
}

// ── Named presets ─────────────────────────────────────────────────────────

/** Product image — portrait 4:5 ratio, optimised WebP */
export const cloudinaryProduct = (publicId: string): string =>
  cloudinaryUrl(publicId, 'w_800,h_1000,c_fill,q_auto,f_auto')

/** Thumbnail — square 400×400 */
export const cloudinaryThumb = (publicId: string): string =>
  cloudinaryUrl(publicId, 'w_400,h_400,c_fill,q_auto,f_auto')

/** Hero / banner — wide 1400×600 */
export const cloudinaryHero = (publicId: string): string =>
  cloudinaryUrl(publicId, 'w_1400,h_600,c_fill,q_auto,f_auto')

/** Lookbook — editorial tall 1200×1600 */
export const cloudinaryLookbook = (publicId: string): string =>
  cloudinaryUrl(publicId, 'w_1200,h_1600,c_fill,q_auto,f_auto')

/** Avatar — small square with face gravity */
export const cloudinaryAvatar = (publicId: string): string =>
  cloudinaryUrl(publicId, 'w_200,h_200,c_fill,g_face,q_auto,f_auto')
