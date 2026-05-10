import { createAdminSupabaseClient } from './supabase/admin'

let redirectCache: Map<string, { destination: string; type: number }> = new Map()
let lastFetched: number = 0

export async function getRedirects(): Promise<Map<string, { destination: string; type: number }>> {
  // Return cached version if fetched within the last 5 minutes
  if (Date.now() - lastFetched < 5 * 60 * 1000 && redirectCache.size > 0) {
    return redirectCache
  }

  try {
    const supabase = createAdminSupabaseClient()
    const { data, error } = await supabase
      .from('url_redirects')
      .select('source_path, destination_url, redirect_type')
      .eq('is_active', true)

    if (error) {
      console.error('[Redirects] Fetch error:', error)
      return redirectCache // Return old cache on error
    }

    const newCache = new Map()
    data?.forEach((r) => {
      newCache.set(r.source_path, {
        destination: r.destination_url,
        type: r.redirect_type
      })
    })

    redirectCache = newCache
    lastFetched = Date.now()
    return redirectCache
  } catch (err) {
    console.error('[Redirects] Exception:', err)
    return redirectCache
  }
}
