import { NextResponse } from 'next/server';
import { getShiprocketToken } from '@/lib/shiprocket';

export async function GET() {
  try {
    const token = await getShiprocketToken();
    if (token) {
      return NextResponse.json({ success: true, message: "Shiprocket connected" });
    }
    throw new Error('Token is null');
  } catch (error: any) {
    return NextResponse.json({ error: "Connection failed: " + (error.message || 'Unknown error') }, { status: 500 });
  }
}
