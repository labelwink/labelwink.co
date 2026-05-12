import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: page, error } = await supabase
    .from('pages')
    .select('*')
    .eq('slug', slug)
    .single()

  return NextResponse.json({
    slug,
    error,
    pageFound: !!page,
    isPublished: page?.is_published,
    data: page
  })
}
