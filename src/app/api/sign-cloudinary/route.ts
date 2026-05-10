import { NextRequest, NextResponse } from 'next/server'
import { cloudinary } from '@/lib/server/cloudinary-upload'
import { requireAdmin } from '@/lib/requireAdmin'

export async function POST(req: NextRequest) {
  const guard = await requireAdmin()
  if (guard) return guard
  try {
    const body = await req.json()
    const { paramsToSign } = body

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET!
    )

    return NextResponse.json({ signature })
  } catch (error) {
    console.error('Cloudinary signing error:', error)
    return NextResponse.json({ error: 'Failed to sign request' }, { status: 500 })
  }
}
