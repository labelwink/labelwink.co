import { requireSuperAdmin } from '@/lib/requireSuperAdmin'
import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const error = await requireSuperAdmin(req)
  if (error) return error

  try {
    const supabase = createAdminClient()
    const { data: { user } } = await supabase.auth.getUser()

    const brevoKey = process.env.BREVO_API_KEY
    if (!brevoKey) {
      return NextResponse.json(
        { error: 'Brevo configuration incomplete' },
        { status: 400 }
      )
    }

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': brevoKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: [{ email: user?.email || 'admin@labelwink.co' }],
        subject: '✅ LabelWink Test Email',
        htmlContent: `
          <h2>Brevo Integration Test</h2>
          <p>This is a test email from LabelWink Super Admin Panel.</p>
          <p>Brevo email service is configured and working correctly!</p>
        `,
        sender: {
          name: 'LabelWink',
          email: 'noreply@labelwink.co',
        },
      }),
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error testing Brevo' }, { status: 500 })
  }
}
