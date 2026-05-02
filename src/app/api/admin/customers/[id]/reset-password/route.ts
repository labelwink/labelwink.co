import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/requireAdmin'
import { sendEmail } from '@/lib/brevo'

export const runtime = 'nodejs'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin()
  if (guard) return guard

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminSupabaseClient() as any
  const { id } = await params

  // Get customer email
  const { data: profile, error: pErr } = await supabase
    .from('profiles')
    .select('email, full_name')
    .eq('id', id)
    .single()

  if (pErr || !profile?.email) {
    return NextResponse.json({ error: 'Customer not found or no email' }, { status: 404 })
  }

  // Generate recovery link via Supabase admin
  let recoveryLink = ''
  try {
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: profile.email,
    })
    if (error) throw error
    recoveryLink = data?.properties?.action_link || data?.action_link || ''
  } catch (err: any) {
    return NextResponse.json({ error: `Failed to generate reset link: ${err.message}` }, { status: 500 })
  }

  if (!recoveryLink) {
    return NextResponse.json({ error: 'Could not generate recovery link' }, { status: 500 })
  }

  // Get store settings for email
  const { data: settings } = await supabase
    .from('shop_settings')
    .select('store_name')
    .single()
  const storeName = settings?.store_name || 'LabelWink'

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; color: #1a1a1a; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0;">
      <div style="background-color: #1a1a1a; padding: 24px; text-align: center;">
        <h2 style="color: #c9a84c; margin: 0; text-transform: uppercase; letter-spacing: 2px;">Password Reset</h2>
      </div>
      <div style="padding: 32px; background-color: #faf7f2;">
        <p style="margin: 0 0 16px;">Hi ${profile.full_name || 'there'},</p>
        <p style="margin: 0 0 24px;">A password reset was requested for your ${storeName} account. Click the button below to set a new password.</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${recoveryLink}"
            style="background-color: #c9a84c; color: #1a1a1a; padding: 14px 32px; text-decoration: none;
                   font-weight: bold; border-radius: 4px; display: inline-block; letter-spacing: 1px;">
            Reset Password
          </a>
        </div>
        <p style="margin: 0; font-size: 13px; color: #6b7280;">This link expires in <strong>24 hours</strong>. If you did not request a password reset, please ignore this email.</p>
      </div>
      <div style="background-color: #1a1a1a; color: #faf7f2; padding: 16px; text-align: center; font-size: 12px;">
        <p style="margin: 0;">&copy; ${new Date().getFullYear()} ${storeName}. All rights reserved.</p>
      </div>
    </div>
  `

  await sendEmail({
    to: profile.email,
    subject: `Reset your ${storeName} password`,
    htmlContent,
  })

  return NextResponse.json({
    success: true,
    message: `Password reset email sent to ${profile.email}`,
  })
}
