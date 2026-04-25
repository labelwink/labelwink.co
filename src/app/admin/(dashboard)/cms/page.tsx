import { createAdminClient } from '@/lib/supabase/server'
import CMSClient from './CMSClient'

export default async function CMSPage() {
  const supabase = createAdminClient()

  const [
    { data: banners },
    { data: announcements },
    { data: sections }
  ] = await Promise.all([
    supabase.from('banners').select('*').order('sort_order', { ascending: true }),
    supabase.from('announcements').select('*').order('sort_order', { ascending: true }),
    supabase.from('homepage_sections').select('*').order('sort_order', { ascending: true })
  ])

  return (
    <div className="space-y-8 font-body">
      <div>
        <h1 className="admin-page-title">Banners & CMS</h1>
        <p className="text-sm text-gray-400 mt-1">Manage storefront banners, announcements, and layout.</p>
      </div>

      <CMSClient 
        initialBanners={banners || []} 
        initialAnnouncements={announcements || []} 
        initialSections={sections || []} 
      />
    </div>
  )
}
