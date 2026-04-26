/**
 * Simple in-memory sliding-window rate limiter.
 * Per-process only — fine for single Vercel function instances.
 * For multi-instance deployments, swap Map for Upstash Redis.
 */
const requests = new Map<string, number[]>()

/**
 * Returns true if the request is allowed, false if rate-limited.
 * @param key       Unique identifier (e.g. `ip:${ip}` or `user:${userId}`)
 * @param limit     Max requests in the window
 * @param windowMs  Window size in milliseconds
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const prev = requests.get(key) ?? []
  const current = prev.filter(t => t > now - windowMs)

  if (current.length >= limit) return false

  requests.set(key, [...current, now])
  return true
}

/** Extract best available IP from Next.js request headers */
export function getIp(req: { headers: { get(key: string): string | null } }): string {
  return (
    req.headers.get('x-real-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    'unknown'
  )
}
