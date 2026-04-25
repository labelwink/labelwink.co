import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const ALLOWED = ['privacy', 'returns', 'shipping', 'terms']

export async function GET(_: NextRequest, { params }: { params: Promise<{ policy: string }> }) {
  const { policy } = await params
  if (!ALLOWED.includes(policy)) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const raw = readFileSync(join(process.cwd(), 'data', 'policies', `${policy}.json`), 'utf-8')
  return NextResponse.json(JSON.parse(raw))
}

// TODO: Replace fs.writeFileSync with Supabase or Vercel Blob for production
export async function POST(req: NextRequest, { params }: { params: Promise<{ policy: string }> }) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({
      error: 'File writes not supported on this deployment. Configure a writable data store.',
      hint: 'Move to Supabase JSONB columns or use Vercel Blob storage for CMS content.'
    }, { status: 501 })
  }
  const { policy } = await params
  if (!ALLOWED.includes(policy)) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const body = await req.json()
  body.last_updated = new Date().toISOString().slice(0, 10)
  writeFileSync(join(process.cwd(), 'data', 'policies', `${policy}.json`), JSON.stringify(body, null, 2))
  return NextResponse.json({ success: true })
}
