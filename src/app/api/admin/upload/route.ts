import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

  if (!cloudName || !uploadPreset) {
    return NextResponse.json(
      { error: 'Cloudinary is not configured (missing CLOUD_NAME or UPLOAD_PRESET)' },
      { status: 500 }
    )
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }
  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 })
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'File size must be under 5MB' }, { status: 400 })
  }

  // Forward to Cloudinary unsigned upload REST API
  const cloudinaryForm = new FormData()
  cloudinaryForm.append('file', file)
  cloudinaryForm.append('upload_preset', uploadPreset)
  cloudinaryForm.append('folder', 'labelwink/products')

  try {
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: 'POST', body: cloudinaryForm }
    )

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      console.error('Cloudinary upload error:', err)
      return NextResponse.json(
        { error: err?.error?.message ?? 'Cloudinary upload failed' },
        { status: 500 }
      )
    }

    const result = await res.json()
    return NextResponse.json({
      url: result.secure_url,
      public_id: result.public_id,
    })
  } catch (err) {
    console.error('Upload route error:', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}

