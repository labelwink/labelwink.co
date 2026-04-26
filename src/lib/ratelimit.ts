import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

/**
 * Fixed-window rate limiter: 5 attempts per 15 minutes per IP.
 * Backed by Upstash Redis — survives serverless cold starts.
 *
 * Required env vars:
 *   UPSTASH_REDIS_REST_URL
 *   UPSTASH_REDIS_REST_TOKEN
 *
 * Usage in api/admin/auth/route.ts:
 *
 *   import { adminAuthLimiter } from '@/lib/ratelimit'
 *
 *   const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
 *   const { success } = await adminAuthLimiter.limit(ip)
 *   if (!success) {
 *     return NextResponse.json(
 *       { error: 'Too many attempts. Try again in 15 minutes.' },
 *       { status: 429 }
 *     )
 *   }
 */
export const adminAuthLimiter = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.fixedWindow(5, '15 m'),
  prefix: 'admin_auth',
  analytics: false,
})
