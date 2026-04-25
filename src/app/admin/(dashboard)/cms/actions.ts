'use server'
import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveBanner(data: {
  id?: string
  title: string
  cloudinary_public_id?: string
  cta_text?: string
  cta_link?: string
  position?: string
  is_active?: boolean
  sort_order?: number
}) {
  const supabase = createAdminClient()
  const payload = {
    title: data.title,
    cloudinary_public_id: data.cloudinary_public_id ?? null,
    cta_text: data.cta_text ?? null,
    cta_link: data.cta_link ?? null,
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

export async function saveAnnouncement(data: { id?: string; text: string; link?: string; is_active?: boolean }) {
  const supabase = createAdminClient()
  const payload = { text: data.text, link: data.link ?? null, is_active: data.is_active ?? false }
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
