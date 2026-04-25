/**
 * Build a Cloudinary delivery URL with sensible defaults.
 * Always uses f_auto (format) + q_auto:best (quality) unless overridden.
 */
export function cloudinaryUrl(
  publicId: string,
  opts?: { w?: number; q?: number | string; crop?: string }
) {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  if (!cloud) return ''

  const parts: string[] = []
  parts.push(`f_auto`)
  parts.push(`q_${opts?.q ?? 'auto:best'}`)
  if (opts?.w) parts.push(`w_${opts.w}`)
  if (opts?.crop) parts.push(`c_${opts.crop}`)

  const transform = parts.join(',')
  return `https://res.cloudinary.com/${cloud}/image/upload/${transform}/${publicId}`
}
