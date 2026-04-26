import { NextResponse } from 'next/server'

/**
 * GET /api/debug-env
 * TEMPORARY diagnostic endpoint — returns boolean flags only.
 * DELETE THIS FILE after confirming env vars are loaded on Vercel.
 */
export async function GET() {
  return NextResponse.json({
    supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    anon_key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    service_role_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    site_url: !!process.env.NEXT_PUBLIC_SITE_URL,
    site_url_value: process.env.NEXT_PUBLIC_SITE_URL?.replace(/https?:\/\//, '***://') || 'NOT_SET',
    internal_secret: !!process.env.INTERNAL_SECRET,
    jwt_secret: !!process.env.JWT_SECRET,
    upstash_redis_url: !!process.env.UPSTASH_REDIS_REST_URL,
    upstash_redis_token: !!process.env.UPSTASH_REDIS_REST_TOKEN,
    cloudinary_cloud: !!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    cloudinary_secret: !!process.env.CLOUDINARY_API_SECRET,
    razorpay_key: !!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    razorpay_secret: !!process.env.RAZORPAY_KEY_SECRET,
    brevo_key: !!process.env.BREVO_API_KEY,
    node_env: process.env.NODE_ENV,
  })
}
