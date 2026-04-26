// ─────────────────────────────────────────────────────────────────────────────
// LabelWink — Cloudinary CDN Utilities
// ─────────────────────────────────────────────────────────────────────────────

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? process.env.CLOUDINARY_CLOUD_NAME

/**
 * Generate an optimized Cloudinary URL with auto format + quality
 * Works with both full URLs and public IDs.
 */
export function getOptimizedUrl(
  publicIdOrUrl: string,
  options: {
    width?: number
    height?: number
    crop?: 'fill' | 'fit' | 'limit' | 'thumb' | 'scale' | 'crop'
    quality?: number | 'auto'
    format?: string | 'auto'
    gravity?: string
  } = {}
): string {
  if (!publicIdOrUrl) return ''

  // If it's already a full Cloudinary URL, extract the public ID
  let publicId = publicIdOrUrl
  if (publicIdOrUrl.includes('cloudinary.com')) {
    const match = publicIdOrUrl.match(/\/upload\/(?:v\d+\/)?(.+)$/)
    if (match) {
      publicId = match[1].replace(/\.[^/.]+$/, '')  // remove extension
    }
  }

  const transforms: string[] = []

  if (options.width) transforms.push(`w_${options.width}`)
  if (options.height) transforms.push(`h_${options.height}`)
  if (options.crop) transforms.push(`c_${options.crop}`)
  if (options.gravity) transforms.push(`g_${options.gravity}`)
  transforms.push(`f_${options.format ?? 'auto'}`)
  transforms.push(`q_${options.quality ?? 'auto'}`)

  const transformStr = transforms.join(',')

  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${transformStr}/${publicId}`
}

/**
 * Get a thumbnail URL (square crop, 300px)
 */
export function getThumbnailUrl(publicIdOrUrl: string, size = 300): string {
  return getOptimizedUrl(publicIdOrUrl, {
    width: size,
    height: size,
    crop: 'fill',
    gravity: 'auto',
  })
}

/**
 * Upload an image to Cloudinary from a server-side File or Buffer.
 * Returns the secure URL.
 */
export async function uploadImage(
  file: File,
  folder = 'labelwink/products'
): Promise<{ url: string; publicId: string }> {
  const { v2: cloudinary } = await import('cloudinary')

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME ?? CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  })

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (error, result) => {
        if (error || !result) return reject(error ?? new Error('Upload failed'))
        resolve({ url: result.secure_url, publicId: result.public_id })
      }
    )
    stream.end(buffer)
  })
}

/**
 * Delete an image from Cloudinary by public ID
 */
export async function deleteImage(publicId: string): Promise<void> {
  const { v2: cloudinary } = await import('cloudinary')

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME ?? CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  })

  await cloudinary.uploader.destroy(publicId)
}

/**
 * Extract public ID from a Cloudinary URL
 */
export function getPublicIdFromUrl(url: string): string | null {
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^/.]+)?$/)
  return match ? match[1] : null
}
