import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const NAV_FILE = join(process.cwd(), 'data', 'navigation.json')

function readNav() {
  try {
    return JSON.parse(readFileSync(NAV_FILE, 'utf-8'))
  } catch {
    return { main_nav: [], footer_columns: [] }
  }
}

export async function GET() {
  return NextResponse.json(readNav())
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const current = readNav()

  if (body.section === 'main_nav') {
    current.main_nav = body.items
  } else if (body.section === 'footer_columns') {
    current.footer_columns = body.columns
  }

  try {
    writeFileSync(NAV_FILE, JSON.stringify(current, null, 2), 'utf-8')
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Write failed' }, { status: 500 })
  }
}
