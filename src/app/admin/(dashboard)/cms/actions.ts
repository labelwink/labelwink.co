'use server'
import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Save (insert or update) a banner.
 * DB columns: title, image_url, mobile_image_url, target_url, position, is_active, sort_order
 * Note: cloudinary_public_id is NOT a DB column; we store the full URL in image_url.
 */
export async function saveBanner(data: {
  id?: string
  title: string
  /** Full Cloudinary URL (or public_id — if public_id, we build the URL here) */
  cloudinary_public_id?: string
  image_url?: string
  mobile_image_url?: string
  cta_text?: string  // Not stored in DB, kept for compatibility
  cta_link?: string  // Maps to target_url
  target_url?: string
  position?: string
  is_active?: boolean
  sort_order?: number
}) {
  const supabase = createAdminClient()

  // Build image_url: if it's a full URL already, use it;
  // if it looks like a Cloudinary public_id, construct the URL.
  let imageUrl = data.image_url ?? null
  if (!imageUrl && data.cloudinary_public_id) {
    const publicId = data.cloudinary_public_id
    if (publicId.startsWith('http')) {
      imageUrl = publicId
    } else {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? 'dcmbwtreb'
      imageUrl = `https://res.cloudinary.com/${cloudName}/image/upload/${publicId}`
    }
  }

  const payload = {
    title: data.title,
    image_url: imageUrl,
    mobile_image_url: data.mobile_image_url ?? null,
    target_url: data.target_url ?? data.cta_link ?? null,
    position: data.position ?? 'hero',
    is_active: data.is_active ?? false,
    sort_order: data.sort_order ?? 0,
  }

  const { error } = data.id
    ? await supabase.from('banners').update(payload).eq('id', data.id)
    : await supabase.from('banners').insert(payload)

  if (error) return { error: `Failed to save banner: ${error.message}` }
  revalidatePath('/admin/cms')
  revalidatePath('/')
  return { success: true }
}

export async function deleteBanner(id: string) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('banners').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/cms')
  revalidatePath('/')
  return { success: true }
}

export async function toggleBanner(id: string, isActive: boolean) {
  const supabase = createAdminClient()
  await supabase.from('banners').update({ is_active: isActive }).eq('id', id)
  revalidatePath('/admin/cms')
  revalidatePath('/')
  return { success: true }
}

export async function saveAnnouncement(data: {
  id?: string
  text: string
  link?: string
  is_active?: boolean
}) {
  const supabase = createAdminClient()
  const payload = {
    text: data.text,
    link: data.link ?? null,
    is_active: data.is_active ?? false,
  }
  const { error } = data.id
    ? await supabase.from('announcements').update(payload).eq('id', data.id)
    : await supabase.from('announcements').insert(payload)
  if (error) return { error: error.message }
  revalidatePath('/admin/cms')
  revalidatePath('/')
  return { success: true }
}

export async function toggleSection(id: string, isActive: boolean) {
  const supabase = createAdminClient()
  await supabase.from('homepage_sections').update({ is_active: isActive }).eq('id', id)
  revalidatePath('/admin/cms')
  revalidatePath('/')
  return { success: true }
}
