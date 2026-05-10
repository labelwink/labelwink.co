import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const { source_path } = await req.json()
    if (!source_path) return NextResponse.json({ error: 'Missing source_path' }, { status: 400 })

    const supabase = createAdminSupabaseClient()
    
    // Using RPC or raw SQL via Supabase for atomic increment
    const { error } = await supabase.rpc('increment_redirect_hit', {
      path_to_inc: source_path
    })

    // If RPC doesn't exist, fallback to fetch + update (less atomic but works for basic tracking)
    if (error) {
      const { data: current } = await supabase
        .from('url_redirects')
        .select('hit_count')
        .eq('source_path', source_path)
        .single()

      if (current) {
        await supabase
          .from('url_redirects')
          .update({ hit_count: (current.hit_count || 0) + 1 })
          .eq('source_path', source_path)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
