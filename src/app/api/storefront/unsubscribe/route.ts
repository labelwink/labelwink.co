import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import crypto from 'crypto';

function verifyToken(email: string, token: string) {
  const key = process.env.BREVO_API_KEY || 'default-secret';
  const expected = crypto.createHmac('sha256', key).update(email).digest('hex');
  return expected === token;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email');
  const token = searchParams.get('token');

  if (!email || !token || !verifyToken(email, token)) {
    return new NextResponse('Invalid or expired link.', { status: 400 });
  }

  const supabaseAdmin = createAdminSupabaseClient();
  await supabaseAdmin
    .from('newsletter_subscriptions')
    .update({ is_active: false })
    .eq('email', email);

  return new NextResponse(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Unsubscribed | LabelWink</title>
      <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-[#faf7f2] min-h-screen flex items-center justify-center p-4 font-sans">
      <div class="max-w-md w-full bg-white rounded-3xl p-8 text-center shadow-xl border border-sage/10">
        <div class="w-16 h-16 bg-sage/10 text-sage rounded-full flex items-center justify-center mx-auto mb-6">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
        </div>
        <h1 class="text-2xl font-bold text-charcoal mb-4">You've been unsubscribed</h1>
        <p class="text-muted-foreground mb-8">We're sorry to see you go. You will no longer receive our newsletter or marketing updates.</p>
        
        <form action="/api/storefront/unsubscribe" method="POST">
          <input type="hidden" name="email" value="${email}">
          <input type="hidden" name="token" value="${token}">
          <input type="hidden" name="action" value="resubscribe">
          <button type="submit" class="text-sage font-bold hover:underline">Changed your mind? Resubscribe &rarr;</button>
        </form>
        
        <div class="mt-12 pt-8 border-t border-sage/10">
          <p class="text-[10px] uppercase tracking-[0.3em] text-charcoal/30 font-bold">LabelWink</p>
        </div>
      </div>
    </body>
    </html>
  `, {
    headers: { 'Content-Type': 'text/html' }
  });
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const email = formData.get('email') as string;
    const token = formData.get('token') as string;
    const action = formData.get('action') as string;

    if (!email || !token || !verifyToken(email, token)) {
      return new NextResponse('Invalid request.', { status: 400 });
    }

    if (action === 'resubscribe') {
      const supabaseAdmin = createAdminSupabaseClient();
      await supabaseAdmin
        .from('newsletter_subscriptions')
        .update({ is_active: true })
        .eq('email', email);

      return new NextResponse(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>Welcome Back! | LabelWink</title>
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="bg-[#faf7f2] min-h-screen flex items-center justify-center p-4 font-sans">
          <div class="max-w-md w-full bg-white rounded-3xl p-8 text-center shadow-xl border border-sage/10">
            <h1 class="text-2xl font-bold text-charcoal mb-4">Welcome Back! ✨</h1>
            <p class="text-muted-foreground mb-8">You've been successfully resubscribed to the Wink Club newsletter.</p>
            <a href="/" class="inline-block bg-white text-white px-8 py-3 rounded-xl font-bold">Continue Shopping</a>
          </div>
        </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    return new NextResponse('Action not supported.', { status: 400 });
  } catch (err) {
    return new NextResponse('An error occurred.', { status: 500 });
  }
}
