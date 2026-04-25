import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET

  if (!apiSecret) {
    return NextResponse.json(
      { error: 'Cloudinary not configured. Add CLOUDINARY_API_SECRET to your .env.local' },
      { status: 503 }
    )
  }

  // Use Cloudinary REST API directly (no SDK needed — avoids module issues)
  const creds = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')
  const params = new URLSearchParams({
    type: 'upload',
    prefix: 'labelwink/',
    max_results: '50',
    resource_type: 'image',
  })

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/resources/image?${params}`,
    { headers: { Authorization: `Basic ${creds}` } }
  )

  if (!res.ok) {
    const err = await res.text()
    return NextResponse.json({ error: err }, { status: res.status })
  }

  const data = await res.json()
  return NextResponse.json({ resources: data.resources ?? [] })
}

export async function DELETE(req: NextRequest) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET

  if (!apiSecret) return NextResponse.json({ error: 'Not configured' }, { status: 503 })

  const { public_id } = await req.json()
  const creds = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/resources/image/upload?public_ids[]=${encodeURIComponent(public_id)}`,
    { method: 'DELETE', headers: { Authorization: `Basic ${creds}` } }
  )

  const data = await res.json()
  return NextResponse.json(data)
}
