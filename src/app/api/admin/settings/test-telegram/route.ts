import { NextResponse } from 'next/server';
import { sendTelegramMessage } from '@/lib/telegram';

export async function POST() {
  try {
    await sendTelegramMessage("🧪 Test message from LabelWink admin panel\n✅ Telegram is connected!");
    return NextResponse.json({ success: true, message: "Test message sent" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to send' }, { status: 500 });
  }
}
