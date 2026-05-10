import crypto from 'crypto';

async function createRazorpayClient() {
  const RazorpayModule = await import('razorpay');
  const Razorpay = RazorpayModule.default || RazorpayModule;

  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is not defined');
  }

  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

export async function createRazorpayOrder(amount: number, receipt: string) {
  const razorpay = await createRazorpayClient();
  const options = {
    amount: Math.round(amount * 100),
    currency: 'INR',
    receipt,
  };

  try {
    const order = await razorpay.orders.create(options);
    return order;
  } catch (error) {
    console.error('[razorpay] create order error', error);
    throw error;
  }
}

export function verifyRazorpaySignature(razorpay_order_id: string, razorpay_payment_id: string, razorpay_signature: string): boolean {
  try {
    const key_secret = process.env.RAZORPAY_KEY_SECRET || '';
    const generated_signature = crypto
      .createHmac('sha256', key_secret)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    return generated_signature === razorpay_signature;
  } catch (error) {
    console.error('Error verifying Razorpay signature:', error);
    return false;
  }
}

export async function createRazorpayOrder(amount: number, receipt: string) {
  const options = {
    amount: Math.round(amount * 100), // convert to paise
    currency: 'INR',
    receipt: receipt,
  };

  try {
    const order = await razorpay.orders.create(options);
    return order;
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    throw error;
  }
}
