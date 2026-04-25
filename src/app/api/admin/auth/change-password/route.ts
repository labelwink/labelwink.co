import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/adminAuth'

export async function POST(req: NextRequest) {
  const token = req.cookies.get('admin_session')?.value
  if (!token || !(await verifyAdminToken(token))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { currentPassword?: string; newPassword?: string; confirmPassword?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { currentPassword, newPassword, confirmPassword } = body

  if (currentPassword !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 })
  }

  if (!newPassword || newPassword.length < 8) {
    return NextResponse.json({ error: 'New password must be at least 8 characters' }, { status: 400 })
  }

  if (newPassword !== confirmPassword) {
    return NextResponse.json({ error: 'Passwords do not match' }, { status: 400 })
  }

  return NextResponse.json({
    success: true,
    message: 'Update ADMIN_PASSWORD in your .env.local and redeploy. Cannot update environment variables at runtime.',
  })
}
