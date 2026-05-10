import { requireSuperAdmin } from '@/lib/requireSuperAdmin'
import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const error = await requireSuperAdmin(req)
  if (error) return error

  const { key } = await params
  const body = await req.json()

  const supabase = createAdminClient()

  const { data, error: dbError } = await supabase
    .from('email_templates')
    .update({
      subject: body.subject,
      body_html: body.body_html,
      updated_at: new Date().toISOString(),
    })
    .eq('type', key)
    .select()

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  return NextResponse.json(data?.[0])
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const error = await requireSuperAdmin(req)
  if (error) return error

  const { key } = await params
  const body = await req.json()

  // Send test email via Brevo
  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': process.env.BREVO_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: [{ email: process.env.SUPER_ADMIN_EMAIL || 'admin@labelwink.co' }],
        subject: body.subject,
        htmlContent: body.body_html,
        sender: {
          name: 'LabelWink',
          email: 'noreply@labelwink.co',
        },
      }),
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error sending email' }, { status: 500 })
  }
}
