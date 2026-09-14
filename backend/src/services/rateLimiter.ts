import { Env } from '../env';

export interface RateLimitConfig {
  action: string;
  limit: number;
  windowSeconds: number;
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfter: number;
  currentCount?: number;
}

export function getClientIp(request: Request): string {
  const cfIp = request.headers.get('cf-connecting-ip');
  if (cfIp) return cfIp.trim();

  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const first = forwardedFor.split(',')[0].trim();
    if (first) return first;
  }

  return '127.0.0.1';
}

/**
 * Atomic sliding-window rate limiter using Cloudflare D1.
 * Persists count and expiry timestamp across edge locations and Worker isolates.
 */
export async function checkRateLimit(
  env: Env,
  request: Request,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const ip = getClientIp(request);
  const key = `rl:${config.action}:${ip}`;
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;
  const newResetAt = now + windowMs;

  try {
    const result = await env.DB.prepare(
      `INSERT INTO rate_limits (key, count, reset_at)
       VALUES (?1, 1, ?2)
       ON CONFLICT(key) DO UPDATE SET
         count = CASE WHEN rate_limits.reset_at <= ?3 THEN 1 ELSE rate_limits.count + 1 END,
         reset_at = CASE WHEN rate_limits.reset_at <= ?3 THEN ?2 ELSE rate_limits.reset_at END
       RETURNING count, reset_at;`
    )
      .bind(key, newResetAt, now)
      .first<{ count: number; reset_at: number }>();

    if (!result) {
      // In unlikely event returning is empty, allow request safely
      return { allowed: true, retryAfter: 0 };
    }

    const { count, reset_at } = result;

    if (count > config.limit) {
      const retryAfter = Math.max(1, Math.ceil((reset_at - now) / 1000));
      return {
        allowed: false,
        retryAfter,
        currentCount: count,
      };
    }

    return {
      allowed: true,
      retryAfter: 0,
      currentCount: count,
    };
  } catch (err: any) {
    // If table doesn't exist yet in local development / mock tests, gracefully allow but log
    console.error('[RateLimiter] Warning: Rate limit check failed:', err?.message || err);
    return { allowed: true, retryAfter: 0 };
  }
}

export function createRateLimitResponse(retryAfter: number, corsHeaders?: Record<string, string>): Response {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Retry-After': String(retryAfter),
    ...(corsHeaders || {}),
  };

  return new Response(
    JSON.stringify({
      success: false,
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please try again later.',
    }),
    {
      status: 429,
      headers,
    }
  );
}
