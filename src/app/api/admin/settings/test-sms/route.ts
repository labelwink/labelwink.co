import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/requireAdmin'
import { createAdminClient } from '@/lib/supabase/server'
import { sendSMS } from '@/lib/msg91'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const guard = await requireAdmin()
  if (guard) return guard

  const supabase = createAdminClient()
  
  try {
    const body = await req.json()
    const { phone } = body

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 })
    }

    const { data: settings } = await supabase.from('shop_settings').select('store_name').single()
    const store_name = settings?.store_name || 'LabelWink'

    const message = `Test SMS from ${store_name} admin panel. SMS notifications are working! ✓`
    
    // Call msg91 sendSMS directly, passing the message
    await sendSMS(phone, { message })

    // Log the test
    await supabase.from('sms_logs').insert({
      phone,
      message_type: 'test',
      status: 'sent',
      provider_response: { via: 'Test Route' }
    })

    return NextResponse.json({ success: true, message: `✅ Sent to ${phone}` })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('Test SMS error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
