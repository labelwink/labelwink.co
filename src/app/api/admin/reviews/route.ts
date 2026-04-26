import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// GET — list all reviews with product name and user profile
export async function GET() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('reviews')
    .select(`
      *,
      products ( name, slug ),
      profiles ( full_name )
    `)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}
