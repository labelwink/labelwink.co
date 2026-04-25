import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const ALLOWED = ['home', 'about', 'faq', 'contact']

export async function GET(_: NextRequest, { params }: { params: Promise<{ page: string }> }) {
  const { page } = await params
  if (!ALLOWED.includes(page)) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const raw = readFileSync(join(process.cwd(), 'data', 'pages', `${page}.json`), 'utf-8')
  return NextResponse.json(JSON.parse(raw))
}

// TODO: Replace fs.writeFileSync with Supabase or Vercel Blob for production
export async function POST(req: NextRequest, { params }: { params: Promise<{ page: string }> }) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({
      error: 'File writes not supported on this deployment. Configure a writable data store.',
      hint: 'Move to Supabase JSONB columns or use Vercel Blob storage for CMS content.'
    }, { status: 501 })
  }
  const { page } = await params
  if (!ALLOWED.includes(page)) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const body = await req.json()
  writeFileSync(join(process.cwd(), 'data', 'pages', `${page}.json`), JSON.stringify(body, null, 2))
  return NextResponse.json({ success: true })
}
