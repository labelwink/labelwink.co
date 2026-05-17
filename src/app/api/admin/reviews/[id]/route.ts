import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/requireAdmin'
import { sendEmail } from '@/lib/brevo'

export const runtime = 'nodejs'
type Ctx = { params: Promise<{ id: string }> }

const VALID_STATUSES = ['approved', 'rejected', 'pending'] as const

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard

  const { id } = await params
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminSupabaseClient() as any
  const body = await req.json()

  // Build allowed update payload
  const updates: Record<string, unknown> = {}

  if ('status' in body) {
    if (!VALID_STATUSES.includes(body.status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }
    updates.status = body.status
  }

  if ('admin_reply' in body) {
    updates.admin_reply = body.admin_reply || null
    updates.admin_replied_at = body.admin_reply ? new Date().toISOString() : null
  }

  if ('rejection_reason' in body) {
    updates.rejection_reason = body.rejection_reason || null
  }

  // Legacy alias
  if ('is_verified_purchase' in body) updates.is_verified_purchase = body.is_verified_purchase
  if ('is_verified' in body)          updates.is_verified_purchase = body.is_verified

  // Fetch existing review + product + user for notification
  const { data: review, error: fetchErr } = await supabase
    .from('reviews')
    .select(`
      id, admin_reply, status,
      products ( name, slug ),
      profiles ( email, full_name )
    `)
    .eq('id', id)
    .single()

  if (fetchErr || !review) return NextResponse.json({ error: 'Review not found' }, { status: 404 })

  // Persist update
  const { data: updated, error } = await supabase
    .from('reviews')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Send Brevo email if approving with a reply
  const isApproving = updates.status === 'approved' || (!updates.status && review.status === 'approved')
  const hasNewReply = updates.admin_reply && updates.admin_reply !== review.admin_reply
  const customerEmail = (review.profiles as any)?.email
  const productName   = (review.products as any)?.name || 'your product'
  const productSlug   = (review.products as any)?.slug || ''
  const customerName  = (review.profiles as any)?.full_name || 'there'

  if (isApproving && hasNewReply && customerEmail) {
    const siteUrl   = process.env.NEXT_PUBLIC_SITE_URL || 'https://shop.hawklab.in'
    const storeName = process.env.NEXT_PUBLIC_STORE_NAME || 'LabelWink'
    const productUrl = `${siteUrl}/products/${productSlug}`

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; color: #1a1a1a; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0;">
        <div style="background-color: #1a1a1a; padding: 20px; text-align: center;">
          <h2 style="color: #c9a84c; margin: 0; text-transform: uppercase; letter-spacing: 2px;">We replied to your review</h2>
        </div>
        <div style="padding: 24px; background-color: #faf7f2;">
          <p>Hi ${customerName},</p>
          <p><strong>${storeName}</strong> has responded to your review of <strong>${productName}</strong>:</p>
          <div style="border-left: 3px solid #c9a84c; padding: 12px 16px; background: #fff; margin: 20px 0; border-radius: 0 8px 8px 0;">
            <p style="margin: 0; font-style: italic; color: #374151;">"${updates.admin_reply}"</p>
          </div>
          <div style="text-align: center; margin-top: 28px;">
            <a href="${productUrl}" style="background-color: #c9a84c; color: #1a1a1a; padding: 12px 28px; text-decoration: none; font-weight: bold; border-radius: 4px; display: inline-block;">
              View on Product Page
            </a>
          </div>
        </div>
        <div style="background-color: #1a1a1a; color: #faf7f2; padding: 16px; text-align: center; font-size: 12px;">
          <p style="margin: 0;">&copy; ${new Date().getFullYear()} ${storeName}. All rights reserved.</p>
        </div>
      </div>
    `

    // Fire-and-forget — don't block response
    sendEmail({
      to: customerEmail,
      subject: `Response to your review on ${productName}`,
      htmlContent,
    }).catch(e => console.error('[reviews PATCH] Brevo error:', e))
  }

  return NextResponse.json(updated)
}

export async function DELETE(_: NextRequest, { params }: Ctx) {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard

  const { id } = await params
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminSupabaseClient() as any
  const { error } = await supabase.from('reviews').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
