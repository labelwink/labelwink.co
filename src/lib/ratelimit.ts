import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// ── Fallback type for when Redis is not configured ─────────────────────────
type FallbackLimiter = { limit: (_id: string) => Promise<{ success: true }> }
const fallback: FallbackLimiter = { limit: async (_id) => ({ success: true }) }

const isRedisConfigured =
  !!process.env.UPSTASH_REDIS_REST_URL &&
  !!process.env.UPSTASH_REDIS_REST_TOKEN

// ── Redis client (only created if env vars exist) ─────────────────────────
const redis = isRedisConfigured
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null

// NOTE: Using fixedWindow instead of slidingWindow.
// slidingWindow uses Lua scripts (evalsha) which require EVAL permission
// on Redis — not available on all Upstash tiers. fixedWindow works everywhere.

// ── OTP: 3 requests per 5 minutes ─────────────────────────────────────────
export const otpRatelimit: Ratelimit | FallbackLimiter = isRedisConfigured
  ? new Ratelimit({
      redis: redis!,
      limiter: Ratelimit.fixedWindow(3, '5 m'),
      analytics: true,
      prefix: 'lw_otp',
    })
  : fallback

// ── General API: 60 requests per minute ───────────────────────────────────
export const apiRatelimit: Ratelimit | FallbackLimiter = isRedisConfigured
  ? new Ratelimit({
      redis: redis!,
      limiter: Ratelimit.fixedWindow(60, '1 m'),
      analytics: true,
      prefix: 'lw_api',
    })
  : fallback

// ── Checkout: 10 requests per minute ──────────────────────────────────────
export const checkoutRatelimit: Ratelimit | FallbackLimiter = isRedisConfigured
  ? new Ratelimit({
      redis: redis!,
      limiter: Ratelimit.fixedWindow(10, '1 m'),
      analytics: true,
      prefix: 'lw_checkout',
    })
  : fallback

// ── Search: 30 requests per minute ────────────────────────────────────────
export const searchRatelimit: Ratelimit | FallbackLimiter = isRedisConfigured
  ? new Ratelimit({
      redis: redis!,
      limiter: Ratelimit.fixedWindow(30, '1 m'),
      analytics: true,
      prefix: 'lw_search',
    })
  : fallback

// ── Admin Auth: 5 login attempts per 15 minutes ───────────────────────────
export const adminAuthLimiter: Ratelimit | FallbackLimiter = isRedisConfigured
  ? new Ratelimit({
      redis: redis!,
      limiter: Ratelimit.fixedWindow(5, '15 m'),
      analytics: true,
      prefix: 'labelwink:admin:auth',
    })
  : fallback

// ── General API (alias with new naming convention) ────────────────────────
export const apiLimiter: Ratelimit | FallbackLimiter = isRedisConfigured
  ? new Ratelimit({
      redis: redis!,
      limiter: Ratelimit.fixedWindow(30, '1 m'),
      analytics: true,
      prefix: 'labelwink:api',
    })
  : fallback

// ── Checkout (alias with new naming convention) ───────────────────────────
export const checkoutLimiter: Ratelimit | FallbackLimiter = isRedisConfigured
  ? new Ratelimit({
      redis: redis!,
      limiter: Ratelimit.fixedWindow(10, '1 m'),
      analytics: true,
      prefix: 'labelwink:checkout',
    })
  : fallback

// ── Return requests: 3 per hour ───────────────────────────────────────────
export const returnLimiter: Ratelimit | FallbackLimiter = isRedisConfigured
  ? new Ratelimit({
      redis: redis!,
      limiter: Ratelimit.fixedWindow(3, '1 h'),
      analytics: true,
      prefix: 'labelwink:returns',
    })
  : fallback

// ── Utility: extract client IP ────────────────────────────────────────────
export function getClientIP(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'anonymous'
  )
}
