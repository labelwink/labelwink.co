import { requireSuperAdmin } from '@/lib/requireSuperAdmin'
import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

function maskSecret(secret: string): string {
  if (!secret || secret.length < 8) return '••••••••'
  return secret.slice(0, 4) + '••••' + secret.slice(-4)
}

export async function GET(req: NextRequest) {
  const error = await requireSuperAdmin(req)
  if (error) return error

  const supabase = createAdminClient()

  const { data, error: dbError } = await supabase
    .from('site_settings')
    .select('*')
    .single()

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  const config = data?.config || {}

  // Mask secrets
  if (config.razorpay_key) config.razorpay_key = maskSecret(config.razorpay_key)
  if (config.shiprocket_email) config.shiprocket_email = maskSecret(config.shiprocket_email)
  if (config.brevo_api_key) config.brevo_api_key = maskSecret(config.brevo_api_key)

  return NextResponse.json({ config })
}

export async function PATCH(req: NextRequest) {
  const error = await requireSuperAdmin(req)
  if (error) return error

  const body = await req.json()
  const supabase = createAdminClient()

  const { data, error: dbError } = await supabase
    .from('site_settings')
    .update({ config: body.config })
    .select()
    .single()

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
