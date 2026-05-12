// src/lib/utils/cloudinary.ts
// CLIENT-SAFE: pure URL helpers — no SDK, no fs

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME

// ── Raw ID extractor ───────────────────────────────────────────────────────
export function toCloudinaryId(urlOrId: string): string {
  if (!urlOrId) return ''
  if (!urlOrId.includes('cloudinary.com')) return urlOrId
  const parts = urlOrId.split('/upload/')
  const id = parts[1]?.replace(/^v\d+\//, '') ?? urlOrId
  // Remove file extension if present (Cloudinary doesn't need it in the public ID part)
  return id.replace(/\.(jpg|jpeg|png|webp|gif|avif|HEIC)$/i, '')
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
    ? `${base}/${transforms},c_fill,g_auto/${cleanId}`
    : `${base}/${cleanId}`
}

// ── Legacy flexible builder (used by ProductImage component) ───────────────
export function getCloudinaryUrl(
  publicIdOrUrl: string,
  options: { width?: number; height?: number; quality?: number } = {}
): string {
  if (!publicIdOrUrl) return '/placeholder-product.jpg'
  if (publicIdOrUrl.startsWith('/')) return publicIdOrUrl

  const { width, height, quality = 'auto' } = options
  const t: string[] = ['f_auto', `q_${quality}`]
  if (width) t.push(`w_${width}`)
  if (height) t.push(`h_${height}`, 'c_fill', 'g_auto')

  const publicId = toCloudinaryId(publicIdOrUrl)
  const cloud = CLOUD_NAME || 'dcmbwtreb'
  return `https://res.cloudinary.com/${cloud}/image/upload/${t.join(',')}/${publicId}`
}

// ── Legacy size helper ────────────────────────────────────────────────────
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
