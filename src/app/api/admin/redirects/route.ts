import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'

export async function GET() {
  const supabase = createAdminSupabaseClient()
  const { data, error } = await supabase
    .from('url_redirects')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    let { source_path, destination_url, redirect_type = 301, is_active = true } = body

    // Validation
    if (!source_path || !destination_url) {
      return NextResponse.json({ error: 'Source and destination are required' }, { status: 400 })
    }

    if (!source_path.startsWith('/')) {
      return NextResponse.json({ error: 'Source path must start with /' }, { status: 400 })
    }

    if (!destination_url.startsWith('/') && !destination_url.startsWith('http')) {
      return NextResponse.json({ error: 'Destination must be a relative path (starting with /) or a valid URL' }, { status: 400 })
    }

    if (![301, 302].includes(redirect_type)) {
      return NextResponse.json({ error: 'Redirect type must be 301 or 302' }, { status: 400 })
    }

    source_path = source_path.toLowerCase().trim()
    if (source_path === destination_url.toLowerCase().trim()) {
      return NextResponse.json({ error: 'Source and destination cannot be the same' }, { status: 400 })
    }

    const supabase = createAdminSupabaseClient()
    const { data, error } = await supabase
      .from('url_redirects')
      .insert({
        source_path,
        destination_url,
        redirect_type,
        is_active
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Source path already exists' }, { status: 400 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
