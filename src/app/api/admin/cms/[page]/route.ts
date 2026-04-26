/*
 * CREATE TABLE IF NOT EXISTS cms_content (
 *   page text PRIMARY KEY,
 *   content jsonb DEFAULT '{}',
 *   updated_at timestamptz DEFAULT now()
 * );
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(_: NextRequest, { params }: { params: Promise<{ page: string }> }) {
  const { page } = await params
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('cms_content')
    .select('content')
    .eq('page', page)
    .single()
  return NextResponse.json(data?.content || {})
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ page: string }> }) {
  const { page } = await params
  const supabase = createAdminClient()
  const body = await req.json()
  const { error } = await supabase
    .from('cms_content')
    .upsert(
      { page, content: body, updated_at: new Date().toISOString() },
      { onConflict: 'page' }
    )
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export { POST as PUT }
