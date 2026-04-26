import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import CMSClient from './CMSClient'

export default async function CMSPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminSupabaseClient() as any

  const [
    { data: banners },
    { data: announcements },
    { data: sections },
  ] = await Promise.all([
    supabase.from('banners').select('*').order('sort_order', { ascending: true }),
    supabase.from('announcements').select('*').order('sort_order', { ascending: true }),
    supabase.from('homepage_sections').select('*').order('sort_order', { ascending: true }),
  ])

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-[#1a1a1a]">CMS & Banners</h1>
        <p className="text-xs text-[#6b7280] mt-0.5">Manage storefront banners, announcements, and page sections.</p>
      </div>
      <CMSClient
        initialBanners={banners ?? []}
        initialAnnouncements={announcements ?? []}
        initialSections={sections ?? []}
      />
    </div>
  )
}
