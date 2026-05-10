import { requireSuperAdmin } from '@/lib/requireSuperAdmin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const error = await requireSuperAdmin(req)
  if (error) return error

  try {
    // Test Telegram connection
    const telegramToken = process.env.TELEGRAM_BOT_TOKEN
    const chatId = process.env.TELEGRAM_CHAT_ID

    if (!telegramToken || !chatId) {
      return NextResponse.json(
        { error: 'Telegram configuration incomplete' },
        { status: 400 }
      )
    }

    const response = await fetch(
      `https://api.telegram.org/bot${telegramToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: '✅ Test from LabelWink Super Admin\n\nTelegram integration is working!',
          parse_mode: 'HTML',
        }),
      }
    )

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to send Telegram message' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Error testing Telegram' },
      { status: 500 }
    )
  }
}
