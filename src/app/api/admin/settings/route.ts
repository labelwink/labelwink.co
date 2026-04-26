/*
 * CREATE TABLE IF NOT EXISTS settings (
 *   key text PRIMARY KEY,
 *   value jsonb,
 *   updated_at timestamptz DEFAULT now()
 * );
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createAdminClient()
  const { data, error } = await supabase.from('settings').select('key, value')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const map: Record<string, unknown> = {}
  for (const row of data || []) map[row.key] = row.value
  return NextResponse.json(map)
}

export async function POST(req: NextRequest) {
  const supabase = createAdminClient()
  const { key, value } = await req.json()
  if (!key) return NextResponse.json({ error: 'key is required' }, { status: 400 })
  const { error } = await supabase
    .from('settings')
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
