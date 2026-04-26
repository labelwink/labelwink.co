/*
 * CREATE TABLE IF NOT EXISTS settings (
 *   key text PRIMARY KEY,
 *   value jsonb,
 *   updated_at timestamptz DEFAULT now()
 * );
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

export async function GET() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminSupabaseClient() as any
  const { data, error } = await supabase.from('settings').select('key, value')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const map: Record<string, unknown> = {}
  for (const row of data || []) map[row.key] = row.value
  return NextResponse.json(map)
}

export async function POST(req: NextRequest) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminSupabaseClient() as any
  const { key, value } = await req.json()
  if (!key) return NextResponse.json({ error: 'key is required' }, { status: 400 })

  // Allowlist known setting keys
  const ALLOWED_KEYS = [
    'store_info', 'trust_badges', 'social_links',
    'shipping_config', 'razorpay_config',
  ]
  if (!ALLOWED_KEYS.includes(key)) {
    return NextResponse.json({ error: 'Unknown setting key' }, { status: 400 })
  }

  const { error } = await supabase
    .from('settings')
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
