import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const Razorpay = require('razorpay');
    const rzp = new Razorpay({ 
      key_id: process.env.RAZORPAY_KEY_ID || '', 
      key_secret: process.env.RAZORPAY_KEY_SECRET || '' 
    });
    
    await rzp.orders.all({ count: 1 });
    return NextResponse.json({ success: true, message: "Razorpay connected" });
  } catch (error: any) {
    return NextResponse.json({ error: "Connection failed — check key ID and secret" }, { status: 500 });
  }
}
